import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { listApiVersions } from "@/modules/api-management/admin/admin.functions";
import { DataTable, PageHeader, StateBadge, toneForStatus } from "@/modules/api-management/admin/ui";
import { API_ERROR_CATALOG, API_VERSION_STATUS_LABEL } from "@/modules/api-management/domain/types";
import { API_ENDPOINTS } from "@/modules/api-management/api/registry";

export const Route = createFileRoute("/_authenticated/admin/docs")({
  component: DocsPage,
});

function DocsPage() {
  const fetchVersions = useServerFn(listApiVersions);
  const versions = useQuery({ queryKey: ["admin", "versions"], queryFn: () => fetchVersions() });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentación de la API"
        description="Contrato público del módulo: endpoints, permisos requeridos, códigos de error y especificación OpenAPI."
        actions={
          <Button asChild variant="outline">
            <a href="/api/public/openapi.json" target="_blank" rel="noreferrer">
              Abrir openapi.json
            </a>
          </Button>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Autenticación</h2>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <p>
            Cada petición debe incluir la cabecera <code className="font-mono">x-api-key</code> con
            una clave activa. Las respuestas usan un sobre uniforme con{" "}
            <code className="font-mono">success</code>, <code className="font-mono">requestId</code> y{" "}
            <code className="font-mono">version</code>.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">{`curl -H "x-api-key: <clave>" \\
  https://tu-dominio/api/public/v1/users?page=1&pageSize=25`}</pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Versiones publicadas</h2>
        <DataTable<{ id: string; code: string; title: string; status: string; sunset_date: string | null }>
          rows={(versions.data ?? []) as never[]}
          rowKey={(row) => row.id}
          empty="Sin versiones"
          columns={[
            { header: "Código", cell: (row) => <span className="font-mono">{row.code}</span> },
            { header: "Título", cell: (row) => row.title || "—" },
            {
              header: "Estado",
              cell: (row) => (
                <StateBadge
                  label={
                    API_VERSION_STATUS_LABEL[row.status as keyof typeof API_VERSION_STATUS_LABEL] ??
                    row.status
                  }
                  tone={toneForStatus(row.status)}
                />
              ),
            },
            { header: "Retirada", cell: (row) => row.sunset_date ?? "—" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Endpoints</h2>
        <DataTable
          rows={API_ENDPOINTS}
          rowKey={(row, index) => `${row.method}-${row.path}-${index}`}
          empty="Sin endpoints"
          columns={[
            { header: "Método", cell: (row) => <span className="font-mono text-xs">{row.method}</span> },
            { header: "Ruta", cell: (row) => <span className="font-mono text-xs">{row.path}</span> },
            { header: "Resumen", cell: (row) => <span className="text-sm">{row.summary}</span> },
            {
              header: "Permiso",
              cell: (row) => (
                <span className="font-mono text-xs">{row.permission ?? "—"}</span>
              ),
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Códigos de error</h2>
        <DataTable
          rows={API_ERROR_CATALOG}
          rowKey={(row) => row.code}
          columns={[
            { header: "Código", cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
            { header: "HTTP", cell: (row) => row.status },
            { header: "Significado", cell: (row) => <span className="text-sm">{row.meaning}</span> },
          ]}
        />
      </section>
    </div>
  );
}
