import { createFileRoute } from "@tanstack/react-router";

const VERSION = "v2";

export const Route = createFileRoute("/api/public/v2/users/$id/status")({
  server: {
    handlers: {
      GET: async (args) => {
        const { usersStatus } = await import("@/modules/api-management/server/controllers.server");
        return usersStatus(VERSION).GET(args as never);
      },
      PATCH: async (args) => {
        const { usersStatus } = await import("@/modules/api-management/server/controllers.server");
        return usersStatus(VERSION).PATCH(args as never);
      },
    },
  },
});
