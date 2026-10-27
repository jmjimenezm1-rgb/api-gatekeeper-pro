import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, getUsageAlerts } from "@/modules/api-management/admin/admin.functions";
import type { UsageAlert, UsageWindow } from "@/modules/api-management/domain/usage-alerts";

const WINDOW_LABEL: Record<UsageWindow, string> = { minute: "minuto", hour: "hora", day: "día" };
import {
  BarList,
  DataTable,
  formatDateTime,
  Metric,
  PageHeader,
  StateBadge,
  toneForStatus,
} from "@/modules/api-management/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: DashboardPage,
});

type RecentLog = {
  occurred_at: string;
  endpoint: string;
  api_version: string | null;
  status_code: number | null;
  duration_ms: number | null;
  application_name: string | null;
  level: string;
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DashboardPage() {
  const fetchDashboard = useServerFn(getDashboard);
  const fetchAlerts = useServerFn(getUsageAlerts);
  const alerts = useQuery({
    queryKey: ["admin", "usage-alerts"],
    queryFn: () => fetchAlerts() as Promise<unknown> as Promise<UsageAlert[]>,
    refetchInterval: 30_000,
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fetchDashboard(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de control"
        description="Actividad de la API en los últimos 7 días: volumen, errores, rendimiento y estado de claves y versiones."
      />

      <Panel title="Alertas de uso (claves al 80% o más de su límite)">
        {!alerts.data?.length ? (
          <p className="text-sm text-muted-foreground">Ninguna clave cerca de su límite.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.data.map((alert) => (
              <li
                key={`${alert.apiKeyId}-${alert.window}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  <span className="font-medium">{alert.keyName}</span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">{alert.keyPrefix}</span>
                </span>
                <span className="flex items-center gap-2">
                  {alert.hits}/{alert.limit} por {WINDOW_LABEL[alert.window]}
                  <StateBadge
                    label={alert.severity === "exceeded" ? "Límite superado" : `${alert.percent}%`}
                    tone={alert.severity === "exceeded" ? "danger" : "warn"}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Cargando métricas…</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Llamadas" value={data.totalCalls} hint="Últimos 7 días" />
            <Metric label="Errores" value={data.totalErrors} hint={`${data.errorRate}% del total`} />
            <Metric label="Tiempo medio" value={`${data.avgResponseMs} ms`} />
            <Metric
              label="Versiones activas"
              value={data.versions.filter((version) => version.status === "active").length}
              hint={`${data.versions.length} definidas`}
            />
          </section>


          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Llamadas por versión">
              <BarList items={data.callsByVersion} />
            </Panel>
            <Panel title="Llamadas por aplicación">
              <BarList items={data.callsByApplication} />
            </Panel>
            <Panel title="Endpoints más usados">
              <BarList items={data.callsByEndpoint} />
            </Panel>
            <Panel title="Errores por código HTTP">
              <BarList items={data.errorsByCode} emptyLabel="Sin errores registrados" />
            </Panel>
            <Panel title="Claves por estado">
              <BarList items={data.keysByStatus} />
            </Panel>
            <Panel title="Usuarios por estado">
              <BarList items={data.usersByStatus} />
            </Panel>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Últimas peticiones</h2>
            <DataTable<RecentLog>
              rows={data.recent as RecentLog[]}
              rowKey={(row, index) => `${row.occurred_at}-${index}`}
              empty="Todavía no se han registrado peticiones"
              columns={[
                { header: "Fecha", cell: (row) => formatDateTime(row.occurred_at) },
                { header: "Endpoint", cell: (row) => row.endpoint },
                { header: "Versión", cell: (row) => row.api_version ?? "—" },
                { header: "Aplicación", cell: (row) => row.application_name ?? "—" },
                { header: "Estado", cell: (row) => row.status_code ?? "—" },
                { header: "Duración", cell: (row) => `${row.duration_ms ?? 0} ms` },
                {
                  header: "Nivel",
                  cell: (row) => <StateBadge label={row.level} tone={toneForStatus(row.level)} />,
                },
              ]}
            />
          </section>
        </>
      )}
    </div>
  );
}
