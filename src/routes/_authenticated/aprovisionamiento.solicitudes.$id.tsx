import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, CircleSlash, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, SectionCard, StatusPill, provisioningStatusMeta } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fmtDateTime, fmtDuration } from "@/lib/format";
import { getRequest, retryRequest, transition } from "@/lib/provisioning/store";
import { useProvisioning } from "@/lib/provisioning/use-provisioning";

export const Route = createFileRoute("/_authenticated/aprovisionamiento/solicitudes/$id")({
  loader: ({ params }) => {
    if (!getRequest(params.id)) throw notFound();
    return null;
  },
  head: () => ({
    meta: [
      { title: "Detalle de solicitud — Aprovisionamiento" },
      { name: "description", content: "Tareas ejecutadas, errores, reintentos y acciones manuales de una solicitud de aprovisionamiento." },
      { property: "og:title", content: "Detalle de solicitud de aprovisionamiento" },
      { property: "og:description", content: "Trazabilidad completa por correlationId con acciones de reintento y reversión." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detalle,
});

const iconos = {
  ok: CheckCircle2,
  error: XCircle,
  pendiente: Clock,
  omitido: CircleSlash,
} as const;

const tonos = { ok: "text-success", error: "text-destructive", pendiente: "text-muted-foreground", omitido: "text-muted-foreground" } as const;

function Detalle() {
  const { id } = Route.useParams();
  useProvisioning();
  const req = getRequest(id);
  if (!req) return null;
  const meta = provisioningStatusMeta[req.estado]!;

  return (
    <div className="space-y-6">
      <Link to="/aprovisionamiento/solicitudes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Volver a solicitudes
      </Link>

      <PageHeader
        titulo={`${req.referencia} · ${req.aplicacion}`}
        descripcion={`${req.organizacion} · operación ${req.operacion} · origen ${req.origen} · solicitado por ${req.solicitadoPor}`}
        acciones={
          <>
            <Button
              variant="outline"
              onClick={() => {
                retryRequest(req.id);
                toast.success("Reintento en curso", { description: "POST /requests/{referencia}/actions · accion=reintentar" });
              }}
            >
              Reintentar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                transition(req.id, "en_proceso", "provisioning.request.resynced");
                toast.info("Sincronización solicitada");
              }}
            >
              Sincronizar
            </Button>
            {req.estado === "esperando_validacion" ? (
              <Button
                onClick={() => {
                  transition(req.id, "completado", "provisioning.request.approved");
                  toast.success("Solicitud aprobada");
                }}
              >
                Aprobar
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => {
                  transition(req.id, "revertido", "provisioning.request.reverted");
                  toast.warning("Solicitud revertida");
                }}
              >
                Revertir
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" titulo="Tareas ejecutadas" descripcion="Cada tarea es reintentable de forma independiente">
          <ol className="divide-y divide-border">
            {req.tareas.map((t) => {
              const Icono = iconos[t.estado];
              return (
                <li key={t.id} className="flex items-start gap-3 px-4 py-3 md:px-5">
                  <Icono className={`mt-0.5 size-4 shrink-0 ${tonos[t.estado]}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      sistema: {t.sistema} · {fmtDuration(t.duracionMs)}
                    </p>
                    {t.detalle ? <p className="mt-1 text-xs text-destructive">{t.detalle}</p> : null}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{t.estado}</span>
                </li>
              );
            })}
          </ol>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard titulo="Estado">
            <div className="space-y-3 px-4 py-4 text-sm md:px-5">
              <StatusPill tono={meta.tono}>{meta.label}</StatusPill>
              <Separator />
              <Dato k="Creada" v={fmtDateTime(req.creadoEn)} />
              <Dato k="Actualizada" v={fmtDateTime(req.actualizadoEn)} />
              <Dato k="Duración" v={fmtDuration(req.duracionMs)} />
              <Dato k="Reintentos" v={String(req.reintentos)} />
              <Dato k="Licencias" v={String(req.licencias)} />
              <Dato k="Tenant" v={req.tenantId} />
              <Dato k="correlationId" v={req.correlationId} />
            </div>
          </SectionCard>

          {req.error ? (
            <SectionCard titulo="Error registrado">
              <div className="space-y-2 px-4 py-4 text-sm md:px-5">
                <p className="font-medium text-destructive">{req.error.codigo}</p>
                <p className="text-muted-foreground">{req.error.motivo}</p>
                <Separator />
                <Dato k="Sistema afectado" v={req.error.sistemaAfectado} />
                <Dato k="Reintentos" v={String(req.error.reintentos)} />
                <Dato k="Reintentable" v={req.error.reintentable ? "Sí" : "No"} />
              </div>
            </SectionCard>
          ) : null}

          <SectionCard titulo="Eventos de dominio">
            <ul className="space-y-1.5 px-4 py-4 text-xs text-muted-foreground md:px-5">
              <li>aprovisionamiento.solicitud.recibida</li>
              <li>aprovisionamiento.solicitud.en_proceso</li>
              <li>aprovisionamiento.solicitud.completada | .error</li>
              <li>crm.aprovisionamiento.resultado</li>
              <li>auditoria.registro</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="truncate text-sm font-medium">{v}</span>
    </div>
  );
}
