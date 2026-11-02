import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, StatusPill } from "@/components/common/ui-bits";
import { contracts } from "@/lib/integration/contracts";

const titulo = "Contratos de integración — Nexora Platform";
const descripcion =
  "Endpoints expuestos y consumidos por Aprovisionamiento y Portal del Cliente: objetivo, método, entrada, respuesta, códigos de error y eventos.";

export const Route = createFileRoute("/_authenticated/integraciones")({
  head: () => ({
    meta: [
      { title: titulo },
      { name: "description", content: descripcion },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descripcion },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Integraciones,
});

function Integraciones() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <PageHeader titulo="Contratos de integración (API First)" descripcion={descripcion} />
      <div className="space-y-4">
        {contracts.map((c) => (
          <SectionCard
            key={c.id}
            titulo={`${c.metodo} ${c.ruta}`}
            descripcion={`${c.modulo} · ${c.objetivo}`}
            acciones={<StatusPill tono={c.direccion === "expuesto" ? "info" : "aviso"}>{c.direccion}</StatusPill>}
          >
            <dl className="grid gap-4 px-4 py-4 text-sm md:grid-cols-2 md:px-5">
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">Entrada</dt>
                <dd className="mt-1 rounded-md bg-muted px-3 py-2 font-mono text-xs break-words">{c.entrada}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">Respuesta</dt>
                <dd className="mt-1 rounded-md bg-muted px-3 py-2 font-mono text-xs break-words">{c.respuesta}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">Códigos de error</dt>
                <dd className="mt-1 space-y-1">
                  {c.errores.map((e) => (
                    <p key={e.codigo} className="text-xs">
                      <span className="font-mono font-medium">{e.codigo}</span>{" "}
                      <span className="text-muted-foreground">{e.descripcion}</span>
                    </p>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">Eventos</dt>
                <dd className="mt-1 space-y-1">
                  {c.eventos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">—</p>
                  ) : (
                    c.eventos.map((e) => (
                      <p key={e.nombre} className="font-mono text-xs">
                        {e.nombre} <span className="text-muted-foreground">({e.tipo})</span>
                      </p>
                    ))
                  )}
                </dd>
              </div>
            </dl>
          </SectionCard>
        ))}
      </div>
    </main>
  );
}
