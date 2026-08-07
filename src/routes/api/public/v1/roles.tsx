import { createFileRoute } from "@tanstack/react-router";

const VERSION = "v1";

export const Route = createFileRoute("/api/public/v1/roles")({
  server: {
    handlers: {
      GET: async (args) => {
        const { rolesCollection } = await import(
          "@/modules/api-management/server/controllers.server"
        );
        return rolesCollection(VERSION).GET(args as never);
      },
      POST: async (args) => {
        const { rolesCollection } = await import(
          "@/modules/api-management/server/controllers.server"
        );
        return rolesCollection(VERSION).POST(args as never);
      },
    },
  },
});
