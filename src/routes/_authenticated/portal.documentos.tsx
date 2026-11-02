import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, SectionCard } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { documents } from "@/lib/domain/seed";
import type { DocumentItem } from "@/lib/domain/types";
import { fmtDate } from "@/lib/format";
import { currentTenant } from "@/lib/domain/seed";
import { platform } from "@/lib/integration/mock-adapters";
import { downloadPdf } from "@/lib/integration/demo-pdf";

export const Route = createFileRoute("/_authenticated/portal/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos — Portal del Cliente" },
      { name: "description", content: "Contratos, anexos, licencias, manuales y condiciones del servicio de tu empresa, siempre actualizados." },
      { property: "og:title", content: "Documentos — Portal del Cliente" },
      { property: "og:description", content: "Gestor documental del tenant con contratos y manuales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalDocumentos,
});

const tipos: { clave: DocumentItem["tipo"] | "todos"; label: string }[] = [
  { clave: "todos", label: "Todos" },
  { clave: "contrato", label: "Contratos" },
  { clave: "licencia", label: "Licencias" },
  { clave: "manual", label: "Manuales" },
  { clave: "documentacion", label: "Documentación" },
  { clave: "condiciones", label: "Condiciones" },
];

function PortalDocumentos() {
  const [tipo, setTipo] = useState<DocumentItem["tipo"] | "todos">("todos");
  const [descargando, setDescargando] = useState<string | null>(null);
  const lista = tipo === "todos" ? documents : documents.filter((d) => d.tipo === tipo);
  async function descargar(item: DocumentItem) {
    if (descargando) return;
    setDescargando(item.id);
    try {
      const url = await platform.documents.getPdfUrl(currentTenant.id, item.id);
      downloadPdf(url, `${item.nombre}-ejemplo.pdf`);
      toast.success("Documento de ejemplo descargado");
    } catch { toast.error("No se ha podido descargar el documento"); }
    finally { setDescargando(null); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Documentos"
        descripcion="Repositorio documental del tenant. La versión vigente la publica el módulo de Contratos."
      />

      <div className="flex flex-wrap gap-2">
        {tipos.map((t) => (
          <Button key={t.clave} size="sm" variant={tipo === t.clave ? "default" : "outline"} onClick={() => setTipo(t.clave)}>
            {t.label}
          </Button>
        ))}
      </div>

      <SectionCard titulo={`${lista.length} documentos`}>
        {lista.length === 0 ? (
          <EmptyState titulo="Sin documentos" descripcion="No hay documentos de este tipo todavía." />
        ) : (
          <ul className="divide-y divide-border">
            {lista.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 md:px-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{d.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.tipo} · {d.tamano} · actualizado el {fmtDate(d.actualizadoEn)}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={descargando !== null} onClick={() => descargar(d)}>
                  {descargando === d.id ? "Descargando…" : "Descargar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
