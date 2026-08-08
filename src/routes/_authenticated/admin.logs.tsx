import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listRequestLogs } from "@/modules/api-management/admin/admin.functions";
import {
  DataTable,
  formatDateTime,
  PageHeader,
  StateBadge,
  toneForStatus,
} from "@/modules/api-management/admin/ui";
import {
  API_LOG_LEVELS,
  API_LOG_LEVEL_LABEL,
  type ApiLogLevel,
} from "@/modules/api-management/domain/types";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  component: LogsPage,
});

type LogRow = {
  id: string;
  request_id: string;
  occurred_at: string;
  endpoint: string;
  api_version: string | null;
  http_method: string;
  application_name: string | null;
  api_key_prefix: string | null;
  source_ip: string | null;
  duration_ms: number | null;
  status_code: number | null;
  outcome: string | null;
  message: string | null;
  level: ApiLogLevel;
};

function LogsPage() {
  const fetchLogs = useServerFn(listRequestLogs);
  const [level, setLevel] = useState<"all" | ApiLogLevel>("all");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState({ search: "" });

  const logs = useQuery({
    queryKey: ["admin", "logs", level, applied.search],
    queryFn: () =>
      fetchLogs({
        data: {
          ...(level === "all" ? {} : { level }),
          ...(applied.search ? { search: applied.search } : {}),
          limit: 300,
        },
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de peticiones"
        description="Trazabilidad de cada llamada: identificador de petición, endpoint, versión, aplicación, duración y resultado."
      />

      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied({ search });
        }}
      >
        <Input
          className="max-w-xs"
          placeholder="Buscar endpoint, aplicación o requestId"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={level} onValueChange={(value) => setLevel(value as typeof level)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            {API_LOG_LEVELS.map((item) => (
              <SelectItem key={item} value={item}>
                {API_LOG_LEVEL_LABEL[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      <DataTable<LogRow>
        rows={(logs.data ?? []) as unknown as LogRow[]}
        rowKey={(row) => row.id}
        empty="Sin peticiones registradas"
        columns={[
          { header: "Fecha", cell: (row) => formatDateTime(row.occurred_at) },
          {
            header: "Petición",
            cell: (row) => <span className="font-mono text-xs">{row.request_id}</span>,
          },
          {
            header: "Endpoint",
            cell: (row) => (
              <span className="text-xs">
                {row.http_method} {row.endpoint}
              </span>
            ),
          },
          { header: "Versión", cell: (row) => row.api_version ?? "—" },
          { header: "Aplicación", cell: (row) => row.application_name ?? "—" },
          { header: "Clave", cell: (row) => row.api_key_prefix ?? "—" },
          { header: "IP", cell: (row) => row.source_ip ?? "—" },
          { header: "HTTP", cell: (row) => row.status_code ?? "—" },
          { header: "Duración", cell: (row) => `${row.duration_ms ?? 0} ms` },
          {
            header: "Nivel",
            cell: (row) => (
              <StateBadge label={API_LOG_LEVEL_LABEL[row.level] ?? row.level} tone={toneForStatus(row.level)} />
            ),
          },
          {
            header: "Mensaje",
            cell: (row) => (
              <span className="text-xs text-muted-foreground">{row.message ?? "—"}</span>
            ),
          },
        ]}
      />
    </div>
  );
}
