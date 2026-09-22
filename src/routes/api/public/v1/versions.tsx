import { createFileRoute } from "@tanstack/react-router";

const VERSION = "v1";

export const Route = createFileRoute("/api/public/v1/versions")({
  server: {
    handlers: {
      GET: async (args) => {
        const { versionsCollection } = await import(
          "@/modules/api-management/server/controllers.server"
        );
        return versionsCollection(VERSION).GET(args as never);
      },
    },
  },
});
