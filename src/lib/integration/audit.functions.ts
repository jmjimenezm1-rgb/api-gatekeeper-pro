/**
 * Adaptador común de auditoría: los módulos de Onboarding (aprovisionamiento,
 * portal) registran en la misma auditoría de API Gatekeeper. El actor se toma
 * siempre de la sesión verificada, nunca del navegador.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  accion: z.string().trim().min(1).max(120),
  entidad: z.string().trim().min(1).max(120),
  tenantId: z.string().trim().max(80),
  detalle: z.string().trim().max(1000),
  modulo: z.enum(["aprovisionamiento", "portal", "integraciones"]).default("aprovisionamiento"),
});

export const recordPlatformAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { insertAudit } = await import("@/modules/api-management/server/repositories.server");
    const email = typeof context.claims["email"] === "string" ? (context.claims["email"] as string) : null;
    await insertAudit({
      actorType: "admin",
      actorId: context.userId,
      actorLabel: email,
      action: `${data.modulo}.${data.accion}`,
      entityType: data.modulo,
      entityId: data.entidad,
      newValue: { tenantId: data.tenantId, detalle: data.detalle },
      applicationName: "Onboarding Hub",
    });
    return { ok: true };
  });
