import { createFileRoute } from "@tanstack/react-router";

const VERSION = "v1";

export const Route = createFileRoute("/api/public/v1/users/$id/permissions")({
  server: {
    handlers: {
      GET: async (args) => {
        const { usersPermissions } = await import(
          "@/modules/api-management/server/controllers.server"
        );
        return usersPermissions(VERSION).GET(args as never);
      },
    },
  },
});
