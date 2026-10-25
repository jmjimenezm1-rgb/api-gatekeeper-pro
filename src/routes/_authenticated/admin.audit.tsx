import { downloadCsv } from "@/lib/csv";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAuditLogs } from "@/modules/api-management/admin/admin.functions";
import { DataTable, formatDateTime, PageHeader, StateBadge } from "@/modules/api-management/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditPage,
});

type AuditRow = {
  id: string;
  occurred_at: string;
  actor_type: string;
  actor_label: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  reason: string | null;
  application_name: string | null;
};

function Snippet({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <code className="block max-w-[260px] truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
      {JSON.stringify(value)}
    </code>
  );
}

function AuditPage() {
  const fetchAudit = useServerFn(listAuditLogs);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const audit = useQuery({
    queryKey: ["admin", "audit", applied],
    queryFn: () => fetchAudit({ data: { ...(applied ? { search: applied } : {}), limit: 300 } }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        description="Registro inmutable de cambios: quién hizo qué, sobre qué entidad, con el valor anterior y el nuevo."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={!audit.data?.length}
            onClick={() =>
              downloadCsv(
                `auditoria-${new Date().toISOString().slice(0, 10)}.csv`,
                (audit.data ?? []) as unknown as Record<string, unknown>[],
              )
            }
          >
            Exportar CSV
          </Button>
        }
      />

      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(search);
        }}
      >
        <Input
          className="max-w-xs"
          placeholder="Buscar acción, entidad o autor"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      <DataTable<AuditRow>
        rows={(audit.data ?? []) as unknown as AuditRow[]}
        rowKey={(row) => row.id}
        empty="Sin eventos de auditoría"
        columns={[
          { header: "Fecha", cell: (row) => formatDateTime(row.occurred_at) },
          {
            header: "Autor",
            cell: (row) => (
              <div>
                <p className="text-sm">{row.actor_label ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{row.actor_type}</p>
              </div>
            ),
          },
          { header: "Acción", cell: (row) => <StateBadge label={row.action} tone="muted" /> },
          {
            header: "Entidad",
            cell: (row) => (
              <div className="text-xs">
                <p>{row.entity_type}</p>
                <p className="font-mono text-muted-foreground">{row.entity_id ?? "—"}</p>
              </div>
            ),
          },
          { header: "Antes", cell: (row) => <Snippet value={row.old_value} /> },
          { header: "Después", cell: (row) => <Snippet value={row.new_value} /> },
          {
            header: "Motivo",
            cell: (row) => <span className="text-xs text-muted-foreground">{row.reason ?? "—"}</span>,
          },
          { header: "Origen", cell: (row) => row.application_name ?? "—" },
        ]}
      />
    </div>
  );
}
