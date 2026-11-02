import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader, SectionCard, StatCard, StatusPill, provisioningStatusMeta } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { fmtDateTime, fmtDuration } from "@/lib/format";
import { useProvisioning } from "@/lib/provisioning/use-provisioning";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/_authenticated/aprovisionamiento/")({
  head: () => pageMeta("Panel de Aprovisionamiento — Nexora", "Estado operativo, solicitudes pendientes, errores y métricas de aprovisionamiento."),
  component: Panel,
});

function Panel() {
  const { requests, stats } = useProvisioning();
  const activas = requests.filter((r) => ["pendiente", "en_proceso", "esperando_validacion"].includes(r.estado));
  const conError = requests.filter((r) => r.estado === "error" || r.estado === "completado_parcial");

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Estado del aprovisionamiento"
        descripcion="Indicadores operativos del módulo. Las solicitudes llegan desde CRM, Clientes, Suscripciones, API externa, integraciones y automatizaciones."
        acciones={
          <Button asChild>
            <Link to="/aprovisionamiento/solicitudes">Ver todas las solicitudes</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard etiqueta="Pendientes" valor={stats.pendientes} ayuda="En cola de ejecución" />
        <StatCard etiqueta="En proceso" valor={stats.enProceso} ayuda="Workers activos" tono="info" />
        <StatCard etiqueta="Errores" valor={stats.errores} ayuda="Requieren intervención" tono="error" />
        <StatCard etiqueta="Tiempo medio" valor={`${stats.tiempoMedioSeg} s`} ayuda="Solicitudes completadas" tono="exito" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard etiqueta="Tasa de éxito" valor={`${stats.tasaExito} %`} tono="exito" ayuda="Últimos 30 días" />
        <StatCard etiqueta="Reintentos acumulados" valor={stats.reintentos} tono="aviso" ayuda="Manuales y automáticos" />
        <StatCard etiqueta="Esperando validación" valor={stats.esperando} tono="aviso" ayuda="Aprobación de un administrador" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          titulo="Solicitudes activas"
          descripcion="Pendientes, en proceso y esperando validación"
        >
          <ul className="divide-y divide-border">
            {activas.map((r) => {
              const meta = provisioningStatusMeta[r.estado]!;
              return (
                <li key={r.id}>
                  <Link
                    to="/aprovisionamiento/solicitudes/$id"
                    params={{ id: r.id }}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/60 md:px-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {r.referencia} · {r.aplicacion}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.organizacion} · {r.operacion} · origen {r.origen} · {fmtDateTime(r.creadoEn)}
                      </span>
                    </span>
                    <StatusPill tono={meta.tono}>{meta.label}</StatusPill>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard className="lg:col-span-2" titulo="Aplicaciones más aprovisionadas">
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.porAplicacion}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="aplicacion" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard titulo="Errores recientes" descripcion="Motivo, código, sistema afectado y reintentos">
        {conError.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Sin errores registrados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {conError.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-3 px-4 py-3.5 md:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {r.error?.codigo} · {r.error?.sistemaAfectado}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.error?.motivo}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.referencia} · {r.organizacion} · {r.error?.reintentos} reintentos · {fmtDuration(r.duracionMs)}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/aprovisionamiento/solicitudes/$id" params={{ id: r.id }}>
                    Revisar
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
