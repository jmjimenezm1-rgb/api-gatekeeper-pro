import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader, SectionCard, StatusPill } from "@/components/common/ui-bits";
import { Switch } from "@/components/ui/switch";
import { fmtNumber } from "@/lib/format";
import { toggleRule } from "@/lib/provisioning/store";
import { useProvisioning } from "@/lib/provisioning/use-provisioning";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/_authenticated/aprovisionamiento/reglas")({
  head: () => pageMeta("Reglas de Aprovisionamiento — Nexora", "Eventos, condiciones y acciones del motor de reglas de aprovisionamiento."),
  component: Reglas,
});

const accionLabels: Record<string, string> = {
  crear_grupo: "Crear grupo",
  crear_usuario_admin: "Crear usuario administrador",
  asignar_permisos: "Asignar permisos",
  asignar_almacenamiento: "Asignar almacenamiento",
  enviar_correo: "Enviar correo",
  crear_api_key: "Crear clave API",
  webhook: "Llamar webhook",
  suspender_tenant: "Suspender tenant",
};

function Reglas() {
  const { rules } = useProvisioning();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Motor de reglas"
        descripcion="Reglas evaluadas al recibir un evento de dominio. Se editan como configuración (evento + condición + acciones), sin desplegar código."
      />

      <div className="grid gap-4">
        {rules.map((r) => (
          <SectionCard
            key={r.id}
            titulo={r.nombre}
            descripcion={`Evento ${r.evento} · prioridad ${r.prioridad} · ${fmtNumber(r.ejecuciones)} ejecuciones`}
            acciones={
              <div className="flex items-center gap-3">
                <StatusPill tono={r.activa ? "exito" : "neutro"}>{r.activa ? "Activa" : "Inactiva"}</StatusPill>
                <Switch
                  checked={r.activa}
                  aria-label={`Activar regla ${r.nombre}`}
                  onCheckedChange={() => {
                    toggleRule(r.id);
                    toast.success(`Regla ${r.activa ? "desactivada" : "activada"}`, { description: r.nombre });
                  }}
                />
              </div>
            }
          >
            <div className="grid gap-4 px-4 py-4 md:grid-cols-[1fr_1.2fr] md:px-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Condición</p>
                <code className="mt-1.5 block rounded-md bg-muted px-3 py-2 text-xs">{r.condicion}</code>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Acciones encadenadas</p>
                <ol className="mt-1.5 space-y-1.5">
                  {r.acciones.map((a, i) => (
                    <li key={`${r.id}-${i}`} className="flex flex-wrap items-baseline gap-2 text-sm">
                      <span className="grid size-5 shrink-0 place-items-center rounded bg-primary/10 text-[11px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="font-medium">{accionLabels[a.tipo] ?? a.tipo}</span>
                      <span className="text-xs text-muted-foreground">
                        {Object.entries(a.parametros)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(" · ")}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
