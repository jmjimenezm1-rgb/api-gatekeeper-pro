import { createFileRoute } from "@tanstack/react-router";

const VERSION = "v2";

export const Route = createFileRoute("/api/public/v2/users")({
  server: {
    handlers: {
      GET: async (args) => {
        const { usersCollection } = await import(
          "@/modules/api-management/server/controllers.server"
        );
        return usersCollection(VERSION).GET(args as never);
      },
      POST: async (args) => {
        const { usersCollection } = await import(
          "@/modules/api-management/server/controllers.server"
        );
        return usersCollection(VERSION).POST(args as never);
      },
    },
  },
});
