import { createFileRoute } from "@tanstack/react-router";

const VERSION = "v2";

export const Route = createFileRoute("/api/public/v2/users/$id/roles")({
  server: {
    handlers: {
      GET: async (args) => {
        const { usersRoles } = await import("@/modules/api-management/server/controllers.server");
        return usersRoles(VERSION).GET(args as never);
      },
      PUT: async (args) => {
        const { usersRoles } = await import("@/modules/api-management/server/controllers.server");
        return usersRoles(VERSION).PUT(args as never);
      },
    },
  },
});
