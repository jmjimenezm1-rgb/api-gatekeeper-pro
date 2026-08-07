import { createFileRoute } from "@tanstack/react-router";

/** Especificación OpenAPI 3.1 pública, generada a partir del registro de endpoints. */
export const Route = createFileRoute("/api/public/openapi.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { buildOpenApiDocument } = await import("@/modules/api-management/api/openapi");
        const { listVersions } = await import(
          "@/modules/api-management/server/repositories.server"
        );

        const versions = (await listVersions()).filter((version) => version.status !== "disabled");
        const document = buildOpenApiDocument({
          serverUrl: new URL(request.url).origin,
          versions: versions.map((version) => ({
            code: version.code,
            status: version.status,
            sunsetDate: version.sunsetDate,
            title: version.title,
          })),
        });

        return new Response(JSON.stringify(document, null, 2), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=60",
            "access-control-allow-origin": "*",
          },
        });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),
    },
  },
});
