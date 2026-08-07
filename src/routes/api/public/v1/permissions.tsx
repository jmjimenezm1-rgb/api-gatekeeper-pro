import { createFileRoute } from "@tanstack/react-router";

const VERSION = "v1";

export const Route = createFileRoute("/api/public/v1/permissions")({
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
