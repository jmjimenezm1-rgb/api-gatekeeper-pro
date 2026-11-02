import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader, SectionCard, StatCard, StatusPill } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { currentTenant, subscriptions, usageSeries } from "@/lib/domain/seed";
import { fmtNumber, pct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portal/consumo")({
  head: () => ({
    meta: [
      { title: "Consumo y límites — Portal del Cliente" },
      { name: "description", content: "Evolución de usuarios activos, consumo por aplicación y almacenamiento frente a los límites de tu plan." },
      { property: "og:title", content: "Consumo y límites — Portal del Cliente" },
      { property: "og:description", content: "Métricas de uso servidas por el módulo de BI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalConsumo,
});

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

function PortalConsumo() {
  const [rango, setRango] = useState<7 | 30>(30);
  const datos = usageSeries.slice(-rango);
  const almacenamiento = Math.round(datos[datos.length - 1]?.almacenamientoGb ?? 0);
  const llamadas = datos.reduce((a, d) => a + d.consumo, 0);
  const mediaUsuarios = Math.round(datos.reduce((a, d) => a + d.usuariosActivos, 0) / datos.length);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Consumo y límites"
        descripcion="Datos agregados del módulo de BI (simulado). El aviso se dispara automáticamente al superar el 85 % de un límite."
        acciones={
          <div className="flex gap-2">
            <Button size="sm" variant={rango === 7 ? "default" : "outline"} onClick={() => setRango(7)}>
              7 días
            </Button>
            <Button size="sm" variant={rango === 30 ? "default" : "outline"} onClick={() => setRango(30)}>
              30 días
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard etiqueta="Usuarios activos (media)" valor={mediaUsuarios} ayuda={`límite ${currentTenant.limites.usuarios}`} />
        <StatCard etiqueta="Consumo acumulado" valor={fmtNumber(llamadas)} ayuda={`${rango} días`} tono="info" />
        <StatCard
          etiqueta="Almacenamiento"
          valor={`${almacenamiento} GB`}
          ayuda={`${pct(almacenamiento, currentTenant.limites.almacenamientoGb)} % de ${currentTenant.limites.almacenamientoGb} GB`}
          tono={pct(almacenamiento, currentTenant.limites.almacenamientoGb) > 85 ? "aviso" : "neutro"}
        />
        <StatCard
          etiqueta="Llamadas API / mes"
          valor={fmtNumber(llamadas * 3)}
          ayuda={`límite ${fmtNumber(currentTenant.limites.llamadasApiMes)}`}
        />
      </div>

      <SectionCard titulo="Usuarios activos y consumo" descripcion="Serie diaria por tenant">
        <div className="h-72 px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" tickFormatter={(v: string) => v.slice(-2)} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line yAxisId="left" type="monotone" dataKey="usuariosActivos" name="Usuarios activos" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="consumo" name="Consumo" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard titulo="Consumo por aplicación" descripcion="Mes en curso">
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subscriptions.map((s) => ({ aplicacion: s.aplicacion, consumo: s.consumoMes, limite: s.limiteConsumo }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="aplicacion" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="consumo" name="Consumo" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="limite" name="Límite" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} fillOpacity={0.35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard titulo="Estado frente a los límites">
          <ul className="divide-y divide-border">
            {subscriptions.map((s) => {
              const uso = pct(s.consumoMes, s.limiteConsumo);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.aplicacion}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtNumber(s.consumoMes)} de {fmtNumber(s.limiteConsumo)} {s.unidadConsumo}
                    </p>
                  </div>
                  <StatusPill tono={uso > 85 ? "aviso" : uso > 60 ? "info" : "exito"}>{uso} %</StatusPill>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
