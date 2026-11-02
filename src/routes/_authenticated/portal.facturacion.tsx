import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard, StatCard, StatusPill } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { currentTenant, invoices } from "@/lib/domain/seed";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { platform } from "@/lib/integration/mock-adapters";
import { downloadPdf } from "@/lib/integration/demo-pdf";

export const Route = createFileRoute("/_authenticated/portal/facturacion")({
  head: () => ({
    meta: [
      { title: "Facturación — Portal del Cliente" },
      { name: "description", content: "Historial de facturas, importes, impuestos, método de pago y descarga de PDF de tu empresa." },
      { property: "og:title", content: "Facturación — Portal del Cliente" },
      { property: "og:description", content: "Facturas y método de pago servidos por el módulo de Facturación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalFacturacion,
});

const estadoTono = { pagada: "exito", pendiente: "aviso", vencida: "error" } as const;

function PortalFacturacion() {
  const [metodo, setMetodo] = useState<{ tipo: string; detalle: string; predeterminado: boolean } | null>(null);
  const [descargando, setDescargando] = useState<string | null>(null);

  useEffect(() => {
    void platform.billing.getPaymentMethod(currentTenant.id).then(setMetodo);
  }, []);

  const pendientes = invoices.filter((i) => i.estado !== "pagada");
  const totalAnual = invoices.reduce((a, i) => a + i.importe, 0);

  async function descargar(id: string, numero: string) {
    if (descargando) return;
    setDescargando(id);
    try {
      const url = await platform.billing.getInvoicePdfUrl(currentTenant.id, id);
      downloadPdf(url, `${numero}-ejemplo.pdf`);
      toast.success("Factura de ejemplo descargada");
    } catch {
      toast.error("No se ha podido descargar la factura");
    } finally { setDescargando(null); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Facturación"
        descripcion="Solo lectura: los datos provienen del módulo de Facturación a través de su contrato de integración."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard etiqueta="Pendiente de pago" valor={fmtCurrency(pendientes.reduce((a, i) => a + i.importe, 0))} ayuda={`${pendientes.length} facturas`} tono={pendientes.length ? "aviso" : "exito"} />
        <StatCard etiqueta="Facturado (histórico)" valor={fmtCurrency(totalAnual)} ayuda={`${invoices.length} facturas`} />
        <StatCard etiqueta="Impuestos acumulados" valor={fmtCurrency(invoices.reduce((a, i) => a + i.impuestos, 0))} tono="info" />
        <StatCard etiqueta="Método de pago" valor={metodo?.detalle ?? "…"} ayuda={metodo?.tipo ?? "Cargando"} />
      </div>

      <SectionCard titulo="Historial de facturas">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium md:px-5">Número</th>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
                <th className="px-4 py-2.5 font-medium">Vencimiento</th>
                <th className="px-4 py-2.5 font-medium">Base</th>
                <th className="px-4 py-2.5 font-medium">Impuestos</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium text-right md:px-5">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-medium md:px-5">
                    {i.numero}
                    <span className="block text-xs font-normal text-muted-foreground">{i.metodoPago}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(i.fecha)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(i.vencimiento)}</td>
                  <td className="px-4 py-3">{fmtCurrency(i.importe)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtCurrency(i.impuestos)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tono={estadoTono[i.estado]}>{i.estado}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right md:px-5">
                    <Button size="sm" variant="outline" disabled={descargando !== null} onClick={() => descargar(i.id, i.numero)}>
                      <Download className="size-3.5" aria-hidden /> {descargando === i.id ? "Descargando…" : "Descargar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard titulo="Datos de facturación" descripcion="Gestionados por el módulo de Clientes">
        <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4 md:px-5">
          <div>
            <dt className="text-xs text-muted-foreground uppercase">Razón social</dt>
            <dd className="mt-1 font-medium">{currentTenant.organizacion}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase">CIF</dt>
            <dd className="mt-1 font-medium">{currentTenant.cif}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase">Plan</dt>
            <dd className="mt-1 font-medium">{currentTenant.plan}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase">Método predeterminado</dt>
            <dd className="mt-1 font-medium">{metodo ? `${metodo.tipo} · ${metodo.detalle}` : "…"}</dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}
