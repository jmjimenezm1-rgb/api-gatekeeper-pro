/**
 * Servicio interno del módulo de Aprovisionamiento.
 * Store en memoria + máquina de estados. Sustituible por su propia API REST/BD.
 */

import { provisioningRequests as seed, provisioningRules as seedRules } from "../domain/seed";
import type { ProvisioningRequest, ProvisioningRule, ProvisioningStatus } from "../domain/types";
import { publish } from "../integration/event-bus";
import { platform } from "../integration/mock-adapters";

let requests: ProvisioningRequest[] = seed.map((r) => ({ ...r, tareas: r.tareas.map((t) => ({ ...t })) }));
let rules: ProvisioningRule[] = seedRules.map((r) => ({ ...r }));

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function onStoreChange(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listRequests(): ProvisioningRequest[] {
  return requests;
}

export function getRequest(id: string): ProvisioningRequest | undefined {
  return requests.find((r) => r.id === id || r.referencia === id);
}

export function listRules(): ProvisioningRule[] {
  return rules;
}

export function toggleRule(id: string) {
  rules = rules.map((r) => (r.id === id ? { ...r, activa: !r.activa } : r));
  emit();
}

function update(id: string, patch: Partial<ProvisioningRequest>) {
  requests = requests.map((r) =>
    r.id === id ? { ...r, ...patch, actualizadoEn: new Date().toISOString() } : r,
  );
  emit();
}

function auditar(req: ProvisioningRequest, accion: string, detalle: string) {
  void platform.audit.record({
    actor: "admin@plataforma.io",
    accion,
    entidad: req.referencia,
    tenantId: req.tenantId,
    detalle,
  });
}

export function retryRequest(id: string) {
  const req = getRequest(id);
  if (!req) return;
  update(id, { estado: "en_proceso", reintentos: req.reintentos + 1 });
  publish("aprovisionamiento.solicitud.reintentada", { referencia: req.referencia }, { emisor: "aprovisionamiento", tenantId: req.tenantId, correlationId: req.correlationId });
  auditar(req, "provisioning.request.retried", `Reintento manual #${req.reintentos + 1}`);
  setTimeout(() => {
    const actual = getRequest(id);
    if (!actual) return;
    update(id, {
      estado: "completado",
      tareas: actual.tareas.map((t) => ({ ...t, estado: t.estado === "ok" ? "ok" : "ok", duracionMs: t.duracionMs || 420 })),
    });
    void platform.crm.notifyProvisioningResult({ tenantId: actual.tenantId, referencia: actual.referencia, resultado: "completado" });
    publish("aprovisionamiento.solicitud.completada", { referencia: actual.referencia }, { emisor: "aprovisionamiento", tenantId: actual.tenantId, correlationId: actual.correlationId });
  }, 1_600);
}

export function transition(id: string, estado: ProvisioningStatus, accion: string) {
  const req = getRequest(id);
  if (!req) return;
  update(id, { estado });
  auditar(req, accion, `Estado → ${estado}`);
  publish(`aprovisionamiento.solicitud.${estado}`, { referencia: req.referencia }, { emisor: "aprovisionamiento", tenantId: req.tenantId, correlationId: req.correlationId });
}

export function createRequest(input: {
  operacion: ProvisioningRequest["operacion"];
  origen: ProvisioningRequest["origen"];
  tenantId: string;
  organizacion: string;
  aplicacionId: string;
  aplicacion: string;
  licencias: number;
  solicitadoPor: string;
}): ProvisioningRequest {
  const numero = 1046 + requests.length;
  const nueva: ProvisioningRequest = {
    id: `pr_${numero}`,
    referencia: `APRV-${new Date().getFullYear()}-${numero}`,
    estado: "pendiente",
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
    duracionMs: 0,
    reintentos: 0,
    correlationId: `corr_${Math.random().toString(36).slice(2, 8)}`,
    tareas: [
      { id: "t1", nombre: "Validar solicitud y cuotas", sistema: "quotas", estado: "pendiente", duracionMs: 0 },
      { id: "t2", nombre: "Ejecutar reglas de aprovisionamiento", sistema: "rules", estado: "pendiente", duracionMs: 0 },
      { id: "t3", nombre: "Notificar al cliente", sistema: "notificaciones", estado: "pendiente", duracionMs: 0 },
    ],
    ...input,
  };
  requests = [nueva, ...requests];
  emit();
  publish("aprovisionamiento.solicitud.recibida", nueva, { emisor: input.origen, tenantId: input.tenantId, correlationId: nueva.correlationId });
  auditar(nueva, "provisioning.request.created", `${input.operacion} · ${input.aplicacion}`);
  return nueva;
}

export function metrics() {
  const total = requests.length;
  const por = (e: ProvisioningStatus) => requests.filter((r) => r.estado === e).length;
  const completadas = requests.filter((r) => r.estado === "completado");
  const tiempoMedio = completadas.length
    ? Math.round(completadas.reduce((a, r) => a + r.duracionMs, 0) / completadas.length / 1000)
    : 0;
  const porAplicacion = Object.entries(
    requests.reduce<Record<string, number>>((acc, r) => {
      acc[r.aplicacion] = (acc[r.aplicacion] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([aplicacion, total]) => ({ aplicacion, total }))
    .sort((a, b) => b.total - a.total);

  return {
    total,
    pendientes: por("pendiente"),
    enProceso: por("en_proceso"),
    esperando: por("esperando_validacion"),
    errores: por("error") + por("completado_parcial"),
    reintentos: requests.reduce((a, r) => a + r.reintentos, 0),
    tiempoMedioSeg: tiempoMedio,
    tasaExito: total ? Math.round(((por("completado") + por("completado_parcial") * 0.5) / total) * 100) : 0,
    porAplicacion,
  };
}
