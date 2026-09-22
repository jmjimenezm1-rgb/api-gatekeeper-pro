import { createFileRoute } from "@tanstack/react-router";

/** Comprobación de estado pública: no requiere API Key. */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        let database: "ok" | "unavailable" = "ok";
        let versions: string[] = [];

        try {
          const { listVersions } = await import(
            "@/modules/api-management/server/repositories.server"
          );
          versions = (await listVersions())
            .filter((version) => version.status !== "disabled")
            .map((version) => version.code);
        } catch {
          database = "unavailable";
        }

        return new Response(
          JSON.stringify({
            success: database === "ok",
            data: {
              status: database === "ok" ? "healthy" : "degraded",
              database,
              versions,
            },
            timestamp: new Date().toISOString(),
          }),
          {
            status: database === "ok" ? 200 : 503,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
              "access-control-allow-origin": "*",
            },
          },
        );
      },
    },
  },
});
