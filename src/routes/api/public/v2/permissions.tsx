import { createFileRoute } from "@tanstack/react-router";

const VERSION = "v2";

export const Route = createFileRoute("/api/public/v2/permissions")({
  server: {
    handlers: {
      GET: async (args) => {
        const { permissionsCollection } = await import(
          "@/modules/api-management/server/controllers.server"
        );
        return permissionsCollection(VERSION).GET(args as never);
      },
    },
  },
});
