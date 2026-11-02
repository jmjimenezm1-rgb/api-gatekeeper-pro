import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, SectionCard, StatusPill } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { currentTenant, subscriptions } from "@/lib/domain/seed";
import type { Ticket } from "@/lib/domain/types";
import { fmtDateTime } from "@/lib/format";
import { platform } from "@/lib/integration/mock-adapters";

export const Route = createFileRoute("/_authenticated/portal/soporte")({
  head: () => ({
    meta: [
      { title: "Soporte — Portal del Cliente" },
      { name: "description", content: "Abre incidencias, sigue su estado y conversa con el equipo de soporte desde un único lugar." },
      { property: "og:title", content: "Soporte — Portal del Cliente" },
      { property: "og:description", content: "Incidencias y conversaciones servidas por el módulo de Soporte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalSoporte,
});

const estadoTono = { abierta: "info", en_curso: "aviso", esperando_cliente: "aviso", resuelta: "exito" } as const;
const prioridades: Ticket["prioridad"][] = ["baja", "media", "alta", "critica"];

function PortalSoporte() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [asunto, setAsunto] = useState("");
  const [aplicacion, setAplicacion] = useState(subscriptions[0]?.aplicacion ?? "");
  const [prioridad, setPrioridad] = useState<Ticket["prioridad"]>("media");
  const [cuerpo, setCuerpo] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {
    let activo = true;
    void platform.support.listTickets(currentTenant.id).then((t) => {
      if (!activo) return;
      setTickets(t);
      setSeleccion(t[0]?.id ?? null);
    }).catch(() => { if (activo) setErrorCarga(true); }).finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  const actual = tickets.find((t) => t.id === seleccion) ?? null;

  async function crear() {
    if (enviando) return;
    if (!asunto.trim() || !cuerpo.trim()) {
      toast.error("Indica el asunto y la descripción");
      return;
    }
    setEnviando(true);
    try {
      const nuevo = await platform.support.createTicket({ tenantId: currentTenant.id, asunto: asunto.trim(), aplicacion, prioridad, cuerpo: cuerpo.trim() });
      setTickets((prev) => [nuevo, ...prev]);
      setSeleccion(nuevo.id);
      setAsunto("");
      setCuerpo("");
      toast.success(`Incidencia creada · ${nuevo.referencia}`);
    } catch { toast.error("No se ha podido crear la incidencia. Inténtalo de nuevo."); }
    finally { setEnviando(false); }
  }

  async function responder() {
    if (!actual || !respuesta.trim() || enviando) return;
    setEnviando(true);
    try {
      const actualizado = await platform.support.reply({ tenantId: currentTenant.id, ticketId: actual.id, cuerpo: respuesta.trim() });
      setTickets((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)));
      setRespuesta("");
      toast.success("Respuesta enviada");
    } catch { toast.error("No se ha podido enviar la respuesta. Inténtalo de nuevo."); }
    finally { setEnviando(false); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Soporte"
      />

      <SectionCard titulo="Nueva incidencia">
        <div className="grid gap-3 p-4 md:px-5 lg:grid-cols-3">
          <Input aria-label="Asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto" />
          <select
            value={aplicacion}
            onChange={(e) => setAplicacion(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Aplicación afectada"
          >
            {subscriptions.map((s) => (
              <option key={s.id} value={s.aplicacion}>
                {s.aplicacion}
              </option>
            ))}
          </select>
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value as Ticket["prioridad"])}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Prioridad"
          >
            {prioridades.map((p) => (
              <option key={p} value={p}>
                Prioridad {p}
              </option>
            ))}
          </select>
          <Textarea
            aria-label="Descripción del problema"
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            placeholder="Describe el problema, pasos para reproducirlo y usuarios afectados"
            className="lg:col-span-3"
            rows={3}
          />
          <div className="lg:col-span-3">
            <Button disabled={enviando} onClick={crear}>{enviando ? "Enviando…" : "Crear incidencia"}</Button>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-5">
        <SectionCard className="lg:col-span-2" titulo="Mis incidencias">
          {cargando ? (
            <EmptyState titulo="Cargando…" />
          ) : errorCarga ? <EmptyState titulo="No se han podido cargar las incidencias" /> : tickets.length === 0 ? <EmptyState titulo="Sin incidencias" /> : (
            <ul className="divide-y divide-border">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setSeleccion(t.id)}
                    className={`block h-auto w-full whitespace-normal rounded-none px-4 py-3 text-left md:px-5 ${t.id === seleccion ? "bg-muted/60" : "hover:bg-muted/40"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.asunto}</span>
                      <StatusPill tono={estadoTono[t.estado]}>{t.estado.replace(/_/g, " ")}</StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.referencia} · {t.aplicacion} · prioridad {t.prioridad} · {fmtDateTime(t.creadaEn)}
                    </p>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard className="lg:col-span-3" titulo={actual ? actual.asunto : "Conversación"} descripcion={actual?.referencia ?? ""}>
          {actual ? (
            <div className="space-y-4 p-4 md:px-5">
              <ul className="space-y-3">
                {actual.mensajes.filter((m) => !m.interno).map((m) => (
                  <li key={m.id} className={`rounded-lg border p-3 text-sm ${m.interno ? "border-dashed border-border bg-muted/40" : "border-border"}`}>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{m.autor}</span>
                      <span>{fmtDateTime(m.fecha)}</span>
                      {m.interno ? <StatusPill tono="neutro">nota interna</StatusPill> : null}
                    </div>
                    <p className="mt-1.5">{m.cuerpo}</p>
                    {m.adjuntos.length ? (
                      <p className="mt-1.5 text-xs text-muted-foreground">Adjuntos: {m.adjuntos.join(", ")}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="space-y-2 border-t border-border pt-3">
                <Textarea aria-label="Respuesta" value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Escribe tu respuesta" rows={3} />
                <Button onClick={responder} disabled={enviando || !respuesta.trim()}>
                  Responder
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState titulo="Selecciona una incidencia" descripcion="Elige una incidencia de la lista para ver la conversación." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
