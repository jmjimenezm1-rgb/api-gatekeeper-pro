/**
 * API Management — Funciones de servidor del panel de administración.
 *
 * Todas requieren sesión autenticada y rol `admin`. El acceso a datos se
 * realiza con el cliente del usuario, por lo que las políticas de la base
 * de datos siguen aplicándose como segunda capa de defensa.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  apiKeyStatusActionSchema,
  createApiKeySchema,
  settingsSchema,
  upsertRoleSchema,
  upsertVersionSchema,
} from "../domain/schemas";
import type {
  ApiKeyStatus,
  ApiLogLevel,
  ApiUserStatus,
  ApiVersionStatus,
} from "../domain/types";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonRecord = Record<string, JsonValue>;

type SupabaseCtx = { supabase: any; userId: string; claims: Record<string, unknown> };

async function assertAdmin(context: SupabaseCtx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("No se ha podido verificar el rol del usuario");
  if (!data) throw new Error("Se requiere rol de administrador");
  return context;
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, label: string): T {
  if (result.error) {
    console.error(`[api-management/admin] ${label}: ${result.error.message}`);
    throw new Error("No se ha podido completar la operación");
  }
  return result.data as T;
}

async function writeAudit(
  context: SupabaseCtx,
  entry: {
    action: string;
    entityType: string;
    entityId?: string | null;
    oldValue?: unknown;
    newValue?: unknown;
    reason?: string | null;
  },
) {
  const { insertAudit } = await import("../server/repositories.server");
  await insertAudit({
    actorType: "admin",
    actorId: context.userId,
    actorLabel: (context.claims['email'] as string) ?? context.userId,
    applicationName: "Panel de administración",
    ...entry,
  });
}

/* ----------------------------- Panel general --------------------------- */

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as SupabaseCtx;
    const { data } = await ctx.supabase.rpc("has_role", {
      _user_id: ctx.userId,
      _role: "admin",
    });
    return {
      userId: ctx.userId,
      email: (ctx.claims['email'] as string) ?? "",
      isAdmin: Boolean(data),
    };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const logs = unwrap<
      Array<{
        occurred_at: string;
        endpoint: string;
        api_version: string | null;
        status_code: number | null;
        duration_ms: number | null;
        application_name: string | null;
        api_key_prefix: string | null;
        level: ApiLogLevel;
        message: string | null;
      }>
    >(
      await ctx.supabase
        .from("api_request_logs")
        .select(
          "occurred_at, endpoint, api_version, status_code, duration_ms, application_name, api_key_prefix, level, message",
        )
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false })
        .limit(1000),
      "dashboard.logs",
    );

    const keys = unwrap<Array<{ status: ApiKeyStatus }>>(
      await ctx.supabase.from("api_keys").select("status"),
      "dashboard.keys",
    );
    const users = unwrap<Array<{ status: ApiUserStatus }>>(
      await ctx.supabase.from("api_users").select("status"),
      "dashboard.users",
    );
    const versions = unwrap<Array<{ code: string; status: ApiVersionStatus }>>(
      await ctx.supabase.from("api_versions").select("code, status"),
      "dashboard.versions",
    );

    const tally = <T extends string>(items: Array<Record<string, unknown>>, field: string) => {
      const map = new Map<T, number>();
      for (const item of items) {
        const key = (item[field] ?? "—") as T;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
    };

    const errors = logs.filter((log) => (log.status_code ?? 0) >= 400);
    const durations = logs.map((log) => log.duration_ms ?? 0).filter((value) => value > 0);
    const byDay = new Map<string, number>();
    for (const log of logs) {
      const day = log.occurred_at.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    return {
      totalCalls: logs.length,
      totalErrors: errors.length,
      errorRate: logs.length ? Math.round((errors.length / logs.length) * 1000) / 10 : 0,
      avgResponseMs: durations.length
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
        : 0,
      callsByVersion: tally(logs, "api_version"),
      callsByApplication: tally(logs, "application_name").slice(0, 8),
      callsByEndpoint: tally(logs, "endpoint").slice(0, 8),
      callsByKey: tally(logs, "api_key_prefix").slice(0, 8),
      errorsByCode: tally(errors, "status_code"),
      callsByDay: [...byDay.entries()]
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      keysByStatus: tally(keys, "status"),
      usersByStatus: tally(users, "status"),
      versions,
      recent: logs.slice(0, 10),
    };
  });

export const getUsageAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const { computeUsageAlerts } = await import("../domain/usage-alerts");
    const now = new Date();
    const minute = new Date(now); minute.setSeconds(0, 0);
    const hour = new Date(now); hour.setMinutes(0, 0, 0);
    const day = new Date(now); day.setHours(0, 0, 0, 0);
    const keys = unwrap<any[]>(
      await ctx.supabase
        .from("api_keys")
        .select("id, name, key_prefix, rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day")
        .eq("status", "active"),
      "alerts.keys",
    );
    const counters = unwrap<any[]>(
      await ctx.supabase
        .from("api_rate_counters")
        .select("api_key_id, window_kind, window_start, hits")
        .gte("window_start", day.toISOString()),
      "alerts.counters",
    );
    const current = counters.filter((counter) => {
      const start = new Date(counter.window_start).getTime();
      const expected =
        counter.window_kind === "minute" ? minute : counter.window_kind === "hour" ? hour : day;
      return start === expected.getTime();
    });
    return computeUsageAlerts(keys, current) as unknown as JsonRecord[];
  });

/* -------------------------------- API Keys ----------------------------- */

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    return unwrap<JsonRecord[]>(
      await ctx.supabase
        .from("api_keys")
        .select(
          "id, name, application_name, company_name, contact_person, contact_email, key_prefix, key_last4, status, permissions, allowed_versions, rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day, expires_at, last_used_at, suspended_reason, created_at",
        )
        .order("created_at", { ascending: false }),
      "listApiKeys",
    );
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createApiKeySchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const { generateApiKey } = await import("../server/keys.server");
    const generated = generateApiKey();

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 86_400_000).toISOString()
      : null;

    const created = unwrap<{ id: string }>(
      await ctx.supabase
        .from("api_keys")
        .insert({
          name: data.name,
          application_name: data.applicationName,
          company_name: data.companyName,
          contact_person: data.contactPerson,
          contact_email: data.contactEmail,
          key_prefix: generated.prefix,
          key_last4: generated.last4,
          key_hash: generated.hash,
          permissions: data.permissions,
          allowed_versions: data.allowedVersions,
          rate_limit_per_minute: data.rateLimitPerMinute,
          rate_limit_per_hour: data.rateLimitPerHour,
          rate_limit_per_day: data.rateLimitPerDay,
          expires_at: expiresAt,
          created_by: ctx.userId,
        })
        .select("id")
        .single(),
      "createApiKey",
    );

    await writeAudit(ctx, {
      action: "apikey.create",
      entityType: "api_key",
      entityId: created.id,
      newValue: { name: data.name, permissions: data.permissions, expiresAt },
    });

    // El valor completo se devuelve una única vez.
    return { id: created.id, secret: generated.raw };
  });

export const regenerateApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const { generateApiKey } = await import("../server/keys.server");
    const generated = generateApiKey();

    unwrap(
      await ctx.supabase
        .from("api_keys")
        .update({
          key_hash: generated.hash,
          key_prefix: generated.prefix,
          key_last4: generated.last4,
          status: "active",
          suspended_reason: null,
        })
        .eq("id", data.id)
        .select("id")
        .single(),
      "regenerateApiKey",
    );

    await writeAudit(ctx, {
      action: "apikey.regenerate",
      entityType: "api_key",
      entityId: data.id,
      newValue: { keyPrefix: generated.prefix },
    });

    return { id: data.id, secret: generated.raw };
  });

export const setApiKeyStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => apiKeyStatusActionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const before = unwrap<{ status: ApiKeyStatus }>(
      await ctx.supabase.from("api_keys").select("status").eq("id", data.id).single(),
      "setApiKeyStatus.before",
    );

    unwrap(
      await ctx.supabase
        .from("api_keys")
        .update({ status: data.status, suspended_reason: data.reason ?? null })
        .eq("id", data.id)
        .select("id")
        .single(),
      "setApiKeyStatus",
    );

    await writeAudit(ctx, {
      action: `apikey.status.${data.status}`,
      entityType: "api_key",
      entityId: data.id,
      oldValue: { status: before.status },
      newValue: { status: data.status },
      reason: data.reason ?? null,
    });

    return { ok: true };
  });

export const deleteApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const before = unwrap<{ name: string; status: ApiKeyStatus }>(
      await ctx.supabase.from("api_keys").select("name, status").eq("id", data.id).single(),
      "deleteApiKey.before",
    );
    const result = await ctx.supabase.from("api_keys").delete().eq("id", data.id);
    if (result.error) throw new Error("No se ha podido eliminar la clave");

    await writeAudit(ctx, {
      action: "apikey.delete",
      entityType: "api_key",
      entityId: data.id,
      oldValue: before,
      newValue: null,
    });
    return { ok: true };
  });

/* -------------------------------- Versiones ---------------------------- */

export const listApiVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    return unwrap<JsonRecord[]>(
      await ctx.supabase
        .from("api_versions")
        .select("id, code, title, status, sunset_date, notes, created_at")
        .order("code"),
      "listApiVersions",
    );
  });

export const saveApiVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertVersionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const values = {
      code: data.code,
      title: data.title,
      status: data.status,
      sunset_date: data.sunsetDate || null,
      notes: data.notes || null,
    };

    if (data.id) {
      unwrap(
        await ctx.supabase.from("api_versions").update(values).eq("id", data.id).select("id").single(),
        "saveApiVersion.update",
      );
      await writeAudit(ctx, {
        action: "version.update",
        entityType: "api_version",
        entityId: data.id,
        newValue: values,
      });
      return { id: data.id };
    }

    const created = unwrap<{ id: string }>(
      await ctx.supabase.from("api_versions").insert(values).select("id").single(),
      "saveApiVersion.insert",
    );
    await writeAudit(ctx, {
      action: "version.create",
      entityType: "api_version",
      entityId: created.id,
      newValue: values,
    });
    return created;
  });

/* --------------------------- Usuarios gestionados ---------------------- */

export const listManagedUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const users = unwrap<JsonRecord[]>(
      await ctx.supabase
        .from("api_users")
        .select(
          "id, email, full_name, status, external_id, phone, status_reason, suspended_until, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      "listManagedUsers",
    );
    const links = unwrap<Array<{ api_user_id: string; role_id: string }>>(
      await ctx.supabase.from("api_user_roles").select("api_user_id, role_id"),
      "listManagedUsers.roles",
    );
    const roles = unwrap<Array<{ id: string; name: string }>>(
      await ctx.supabase.from("api_roles").select("id, name"),
      "listManagedUsers.roleNames",
    );
    const roleName = new Map(roles.map((role) => [role.id, role.name]));

    return users.map((user) => ({
      ...user,
      roles: links
        .filter((link) => link.api_user_id === user['id'])
        .map((link) => roleName.get(link.role_id) ?? "—"),
    }));
  });

export const setManagedUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: ApiUserStatus; reason?: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const { userService } = await import("../server/users.service.server");
    return userService.changeStatus(
      data.id,
      { status: data.status, reason: data.reason },
      {
        actorType: "admin",
        actorId: ctx.userId,
        actorLabel: (ctx.claims['email'] as string) ?? ctx.userId,
        applicationName: "Panel de administración",
      },
    );
  });

/* ------------------------------ Roles/permisos ------------------------- */

export const listRolesAndPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const roles = unwrap<Array<{ id: string; name: string; description: string; is_system: boolean }>>(
      await ctx.supabase.from("api_roles").select("id, name, description, is_system").order("name"),
      "listRoles",
    );
    const links = unwrap<Array<{ role_id: string; permission_code: string }>>(
      await ctx.supabase.from("api_role_permissions").select("role_id, permission_code"),
      "listRolePermissions",
    );
    const permissions = unwrap<Array<{ code: string; module: string; description: string }>>(
      await ctx.supabase.from("api_permissions").select("code, module, description").order("code"),
      "listPermissions",
    );

    return {
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.is_system,
        permissions: links
          .filter((link) => link.role_id === role.id)
          .map((link) => link.permission_code)
          .sort(),
      })),
      permissions,
    };
  });

export const saveRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertRoleSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);

    let roleId = data.id;
    if (roleId) {
      unwrap(
        await ctx.supabase
          .from("api_roles")
          .update({ name: data.name, description: data.description })
          .eq("id", roleId)
          .select("id")
          .single(),
        "saveRole.update",
      );
    } else {
      const created = unwrap<{ id: string }>(
        await ctx.supabase
          .from("api_roles")
          .insert({ name: data.name, description: data.description })
          .select("id")
          .single(),
        "saveRole.insert",
      );
      roleId = created.id;
    }

    const del = await ctx.supabase.from("api_role_permissions").delete().eq("role_id", roleId);
    if (del.error) throw new Error("No se han podido actualizar los permisos del rol");
    if (data.permissions.length > 0) {
      const ins = await ctx.supabase
        .from("api_role_permissions")
        .insert(data.permissions.map((code) => ({ role_id: roleId, permission_code: code })));
      if (ins.error) throw new Error("No se han podido asignar los permisos");
    }

    await writeAudit(ctx, {
      action: data.id ? "role.update" : "role.create",
      entityType: "api_role",
      entityId: roleId!,
      newValue: { name: data.name, permissions: data.permissions },
    });

    return { id: roleId };
  });

export const deleteRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const before = unwrap<{ name: string; is_system: boolean }>(
      await ctx.supabase.from("api_roles").select("name, is_system").eq("id", data.id).single(),
      "deleteRole.before",
    );
    if (before.is_system) throw new Error("Los roles del sistema no se pueden eliminar");
    const result = await ctx.supabase.from("api_roles").delete().eq("id", data.id);
    if (result.error) throw new Error("No se ha podido eliminar el rol");
    await writeAudit(ctx, {
      action: "role.delete",
      entityType: "api_role",
      entityId: data.id,
      oldValue: before,
      newValue: null,
    });
    return { ok: true };
  });

/* --------------------------------- Logs -------------------------------- */

export const listRequestLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { level?: ApiLogLevel; search?: string; limit?: number }) => input ?? {})
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    let query = ctx.supabase
      .from("api_request_logs")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 500));
    if (data.level) query = query.eq("level", data.level);
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, "");
      query = query.or(`endpoint.ilike.%${term}%,application_name.ilike.%${term}%,request_id.ilike.%${term}%`);
    }
    return unwrap<JsonRecord[]>(await query, "listRequestLogs");
  });

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string; limit?: number }) => input ?? {})
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    let query = ctx.supabase
      .from("api_audit_logs")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 500));
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, "");
      query = query.or(`action.ilike.%${term}%,entity_type.ilike.%${term}%,actor_label.ilike.%${term}%`);
    }
    return unwrap<JsonRecord[]>(await query, "listAuditLogs");
  });

/* ----------------------------- Configuración --------------------------- */

export const getApiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const row = unwrap<JsonRecord>(
      await ctx.supabase.from("api_settings").select("*").eq("id", true).single(),
      "getApiSettings",
    );
    return {
      apiKeyTtlDays: row['api_key_ttl_days'] as number,
      jwtTtlMinutes: row['jwt_ttl_minutes'] as number,
      defaultLimitPerMinute: row['default_limit_per_minute'] as number,
      defaultLimitPerHour: row['default_limit_per_hour'] as number,
      defaultLimitPerDay: row['default_limit_per_day'] as number,
      lockoutPolicy: row['lockout_policy'] as string,
      logRetentionDays: row['log_retention_days'] as number,
      auditRetentionDays: row['audit_retention_days'] as number,
      minLogLevel: row['min_log_level'] as ApiLogLevel,
      maxResponseMs: row['max_response_ms'] as number,
      allowHardDeleteUsers: row['allow_hard_delete_users'] as boolean,
    };
  });

export const saveApiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    unwrap(
      await ctx.supabase
        .from("api_settings")
        .update({
          api_key_ttl_days: data.apiKeyTtlDays,
          jwt_ttl_minutes: data.jwtTtlMinutes,
          default_limit_per_minute: data.defaultLimitPerMinute,
          default_limit_per_hour: data.defaultLimitPerHour,
          default_limit_per_day: data.defaultLimitPerDay,
          lockout_policy: data.lockoutPolicy,
          log_retention_days: data.logRetentionDays,
          audit_retention_days: data.auditRetentionDays,
          min_log_level: data.minLogLevel,
          max_response_ms: data.maxResponseMs,
          allow_hard_delete_users: data.allowHardDeleteUsers,
        })
        .eq("id", true)
        .select("id")
        .single(),
      "saveApiSettings",
    );
    await writeAudit(ctx, {
      action: "settings.update",
      entityType: "api_settings",
      entityId: "global",
      newValue: data,
    });
    return { ok: true };
  });

/* ------------------------- Diagnóstico con IA -------------------------- */

const diagnoseInputSchema = z.object({
  request: z.string().trim().min(1, "Pega la petición fallida").max(20_000),
  response: z.string().trim().min(1, "Pega la respuesta recibida").max(20_000),
});

export const diagnoseFailedRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => diagnoseInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = await assertAdmin(context as unknown as SupabaseCtx);
    const { explainFailedRequest } = await import("../server/diagnose.server");
    const explanation = await explainFailedRequest({
      request: data.request,
      response: data.response,
    });
    await writeAudit(ctx, {
      action: "diagnose.request",
      entityType: "request_log",
      entityId: null,
      newValue: { requestLength: data.request.length, responseLength: data.response.length },
    });
    return { explanation };
  });
