import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, StatusPill } from "@/components/common/ui-bits";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditLog } from "@/lib/domain/seed";
import { fmtDateTime, fmtDuration } from "@/lib/format";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/_authenticated/aprovisionamiento/historial")({
  head: () => pageMeta("Historial de Aprovisionamiento — Nexora", "Registro de acciones, resultados y trazabilidad de solicitudes de aprovisionamiento."),
  component: Historial,
});

function Historial() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Historial y auditoría"
        descripcion="Registro inmutable: quién solicitó, qué cliente, qué aplicación, qué cambios, duración y resultado. Se replica al módulo de Auditoría vía evento."
      />
      <SectionCard titulo={`${auditLog.length} registros`} descripcion="Se conservan con soft delete y retención configurable (RGPD)">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="text-right">Duración</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLog.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs whitespace-nowrap">{fmtDateTime(a.fecha)}</TableCell>
                  <TableCell className="text-sm">{a.actor}</TableCell>
                  <TableCell className="font-mono text-xs">{a.accion}</TableCell>
                  <TableCell className="text-sm">{a.entidad}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.tenantId}</TableCell>
                  <TableCell className="max-w-72 text-xs text-muted-foreground">{a.detalle}</TableCell>
                  <TableCell className="text-right text-xs">{fmtDuration(a.duracionMs)}</TableCell>
                  <TableCell>
                    <StatusPill tono={a.resultado === "ok" ? "exito" : "error"}>{a.resultado === "ok" ? "OK" : "Error"}</StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
