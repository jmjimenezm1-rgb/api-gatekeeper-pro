import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, StatusPill } from "@/components/common/ui-bits";
import { connectors } from "@/lib/domain/seed";
import { fmtDateTime } from "@/lib/format";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/_authenticated/aprovisionamiento/conectores")({
  head: () => pageMeta("Conectores de Aprovisionamiento — Nexora", "Estado de los adaptadores simulados de identidad, directorio, pagos e integraciones."),
  component: Conectores,
});

const tono = { conectado: "exito", error: "error", no_configurado: "neutro" } as const;
const label = { conectado: "Conectado", error: "Error", no_configurado: "No configurado" } as const;

function Conectores() {
  const grupos = ["identidad", "directorio", "pagos", "generico"] as const;
  const titulos = { identidad: "Identidad y SSO", directorio: "Directorio y sincronización", pagos: "Pagos", generico: "Genéricos" };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Conectores"
        descripcion="Adaptadores hacia sistemas destino. En esta fase todos operan en modo simulado: sustituir la implementación no afecta a la lógica del módulo."
      />
      {grupos.map((g) => (
        <SectionCard key={g} titulo={titulos[g]}>
          <ul className="divide-y divide-border">
            {connectors
              .filter((c) => c.tipo === g)
              .map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.protocolo}
                      {c.ultimaSync ? ` · última sincronización ${fmtDateTime(c.ultimaSync)}` : ""}
                      {c.simulado ? " · simulado" : ""}
                    </p>
                  </div>
                  <StatusPill tono={tono[c.estado]}>{label[c.estado]}</StatusPill>
                </li>
              ))}
          </ul>
        </SectionCard>
      ))}
    </div>
  );
}
