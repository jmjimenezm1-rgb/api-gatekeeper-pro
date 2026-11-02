import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader, SectionCard, StatCard, StatusPill } from "@/components/common/ui-bits";
import { currentTenant, invoices, portalUsers, subscriptions, tickets, usageSeries } from "@/lib/domain/seed";
import { useNotifications } from "@/lib/portal/notifications";
import { pageMeta } from "@/lib/route-meta";
import { fmtCurrency, fmtDate, fmtNumber, pct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => pageMeta("Inicio — Portal del Cliente Nexora", "Resumen de aplicaciones, licencias, consumo, facturas y avisos de tu empresa."),
  component: PortalInicio,
});

const estadoTono = { activa: "exito", suspendida: "error", en_renovacion: "aviso", baja_solicitada: "neutro" } as const;

function PortalInicio() {
  const notifications = useNotifications();
  const licenciasUsadas = subscriptions.reduce((a, s) => a + s.licenciasUsadas, 0);
  const licenciasTotales = subscriptions.reduce((a, s) => a + s.licenciasTotales, 0);
  const pendientes = invoices.filter((i) => i.estado !== "pagada");
  const abiertas = tickets.filter((t) => t.estado !== "resuelta");

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Hola, ${currentTenant.organizacion}`}
        descripcion={`Plan ${currentTenant.plan} · ${currentTenant.zonaHoraria} · ${currentTenant.locale}. Todos los datos mostrados están aislados a tu empresa.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard etiqueta="Aplicaciones contratadas" valor={subscriptions.length} ayuda={`${subscriptions.filter((s) => s.estado === "activa").length} activas`} />
        <StatCard etiqueta="Licencias en uso" valor={`${licenciasUsadas}/${licenciasTotales}`} ayuda={`${pct(licenciasUsadas, licenciasTotales)} % del total`} tono="info" />
        <StatCard etiqueta="Usuarios" valor={portalUsers.filter((u) => u.estado === "activo").length} ayuda={`${portalUsers.length} en total`} />
        <StatCard etiqueta="Facturas pendientes" valor={pendientes.length} ayuda={fmtCurrency(pendientes.reduce((a, i) => a + i.importe, 0))} tono={pendientes.length ? "aviso" : "exito"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <SectionCard className="lg:col-span-3" titulo="Consumo del último mes" descripcion="Datos servidos por el módulo de BI (simulado)">
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" tickFormatter={(v: string) => v.slice(-2)} />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="consumo" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard className="lg:col-span-2" titulo="Estado de los servicios">
          <ul className="divide-y divide-border">
            {subscriptions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {s.aplicacion} <span className="text-xs text-muted-foreground">v{s.version}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.licenciasUsadas}/{s.licenciasTotales} licencias · renueva {fmtDate(s.renuevaEn)} · {fmtNumber(s.consumoMes)} {s.unidadConsumo}
                  </p>
                </div>
                <StatusPill tono={estadoTono[s.estado]}>{s.estado.replace(/_/g, " ")}</StatusPill>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard titulo="Facturas recientes">
          <ul className="divide-y divide-border">
            {invoices.slice(0, 3).map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm md:px-5">
                <span>
                  {i.numero}
                  <span className="block text-xs text-muted-foreground">{fmtDate(i.fecha)}</span>
                </span>
                <span className="text-right">
                  {fmtCurrency(i.importe)}
                  <StatusPill className="mt-1 block w-fit" tono={i.estado === "pagada" ? "exito" : i.estado === "vencida" ? "error" : "aviso"}>
                    {i.estado}
                  </StatusPill>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard titulo="Incidencias abiertas">
          <ul className="divide-y divide-border">
            {abiertas.map((t) => (
              <li key={t.id} className="px-4 py-3 text-sm md:px-5">
                <p className="font-medium">{t.asunto}</p>
                <p className="text-xs text-muted-foreground">
                  {t.referencia} · {t.aplicacion} · prioridad {t.prioridad}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard titulo="Avisos y notificaciones" acciones={<Link to="/portal/notificaciones" className="text-xs text-primary hover:underline">Ver todo</Link>}>
          <ul className="divide-y divide-border">
            {notifications.slice(0, 4).map((n) => (
              <li key={n.id} className="px-4 py-3 text-sm md:px-5">
                <p className={n.leida ? "font-normal" : "font-semibold"}>{n.titulo}</p>
                <p className="text-xs text-muted-foreground">{n.cuerpo}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
