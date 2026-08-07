import { createFileRoute } from "@tanstack/react-router";

const VERSION = "v1";

export const Route = createFileRoute("/api/public/v1/users/$id/")({
  server: {
    handlers: {
      GET: async (args) => {
        const { usersItem } = await import("@/modules/api-management/server/controllers.server");
        return usersItem(VERSION).GET(args as never);
      },
      PATCH: async (args) => {
        const { usersItem } = await import("@/modules/api-management/server/controllers.server");
        return usersItem(VERSION).PATCH(args as never);
      },
      DELETE: async (args) => {
        const { usersItem } = await import("@/modules/api-management/server/controllers.server");
        return usersItem(VERSION).DELETE(args as never);
      },
    },
  },
});
