import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard, StatusPill } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applications, currentTenant, subscriptions } from "@/lib/domain/seed";
import { fmtDate, fmtNumber, pct } from "@/lib/format";
import { platform } from "@/lib/integration/mock-adapters";

export const Route = createFileRoute("/_authenticated/portal/aplicaciones")({
  head: () => ({
    meta: [
      { title: "Mis aplicaciones — Portal del Cliente" },
      { name: "description", content: "Consulta tus suscripciones activas, amplía o reduce licencias y solicita el alta de nuevas aplicaciones." },
      { property: "og:title", content: "Mis aplicaciones — Portal del Cliente" },
      { property: "og:description", content: "Suscripciones, licencias y catálogo de aplicaciones disponibles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalAplicaciones,
});

const estadoTono = { activa: "exito", suspendida: "error", en_renovacion: "aviso", baja_solicitada: "neutro" } as const;

function PortalAplicaciones() {
  const [licencias, setLicencias] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<string | null>(null);

  const contratadas = new Set(subscriptions.map((s) => s.aplicacionId));
  const catalogo = applications.filter((a) => !contratadas.has(a.id));

  async function solicitar(aplicacionId: string, tipo: "ampliacion" | "reduccion" | "alta" | "baja") {
    setEnviando(`${aplicacionId}-${tipo}`);
    try {
      const cantidad = Number(licencias[aplicacionId] ?? 0);
      const res = await platform.subscriptions.requestChange({
        tenantId: currentTenant.id,
        aplicacionId,
        tipo,
        ...(cantidad ? { licencias: cantidad } : {}),
      });
      toast.success(`Solicitud registrada · ${res.referencia}`, {
        description: "El módulo de Aprovisionamiento la procesará automáticamente.",
      });
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Mis aplicaciones"
        descripcion="Cada solicitud de cambio se publica como evento y genera una orden en el módulo de Aprovisionamiento."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {subscriptions.map((s) => {
          const usoLic = pct(s.licenciasUsadas, s.licenciasTotales);
          const usoCons = pct(s.consumoMes, s.limiteConsumo);
          return (
            <SectionCard
              key={s.id}
              titulo={`${s.aplicacion} · v${s.version}`}
              descripcion={`Contratada el ${fmtDate(s.contratadaEn)} · renueva el ${fmtDate(s.renuevaEn)}`}
              acciones={<StatusPill tono={estadoTono[s.estado]}>{s.estado.replace(/_/g, " ")}</StatusPill>}
            >
              <div className="space-y-4 p-4 md:px-5">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Licencias</span>
                    <span>
                      {s.licenciasUsadas}/{s.licenciasTotales} ({usoLic} %)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(usoLic, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Consumo del mes ({s.unidadConsumo})</span>
                    <span>
                      {fmtNumber(s.consumoMes)}/{fmtNumber(s.limiteConsumo)} ({usoCons} %)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={usoCons > 85 ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-info"}
                      style={{ width: `${Math.min(usoCons, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <Input
                    type="number"
                    min={1}
                    value={licencias[s.aplicacionId] ?? ""}
                    onChange={(e) => setLicencias((p) => ({ ...p, [s.aplicacionId]: e.target.value }))}
                    placeholder="Licencias"
                    className="h-8 w-28 text-xs"
                    aria-label={`Licencias para ${s.aplicacion}`}
                  />
                  <Button size="sm" disabled={enviando !== null} onClick={() => solicitar(s.aplicacionId, "ampliacion")}>
                    Ampliar
                  </Button>
                  <Button size="sm" variant="outline" disabled={enviando !== null} onClick={() => solicitar(s.aplicacionId, "reduccion")}>
                    Reducir
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={enviando !== null} onClick={() => solicitar(s.aplicacionId, "baja")}>
                    Solicitar baja
                  </Button>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>

      <SectionCard titulo="Catálogo disponible" descripcion="Aplicaciones que puedes contratar con tu plan actual">
        <ul className="divide-y divide-border">
          {catalogo.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 md:px-5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {a.nombre} <span className="text-xs text-muted-foreground">v{a.version}</span>
                </p>
                <p className="text-xs text-muted-foreground">{a.categoria}</p>
              </div>
              <Button size="sm" variant="outline" disabled={enviando !== null} onClick={() => solicitar(a.id, "alta")}>
                Solicitar alta
              </Button>
            </li>
          ))}
          {catalogo.length === 0 ? <li className="px-4 py-8 text-center text-sm text-muted-foreground">Ya tienes contratadas todas las aplicaciones.</li> : null}
        </ul>
      </SectionCard>
    </div>
  );
}
