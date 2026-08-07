/**
 * API Management — Repositorios (única capa con acceso a datos).
 * Ninguna otra capa debe consultar la base de datos directamente.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import type { ApiKeyStatus, ApiLogLevel, ApiUserStatus } from "../domain/types";

import { ApiError } from "./errors.server";

export interface ApiKeyRecord {
  id: string;
  name: string;
  applicationName: string;
  companyName: string;
  contactEmail: string;
  keyPrefix: string;
  status: ApiKeyStatus;
  permissions: string[];
  allowedVersions: string[];
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  expiresAt: string | null;
}

export interface VersionRecord {
  code: string;
  status: "active" | "deprecated" | "disabled";
  sunsetDate: string | null;
  title: string;
}

export interface ApiUserRecord {
  id: string;
  email: string;
  fullName: string;
  status: ApiUserStatus;
  externalId: string | null;
  phone: string | null;
  metadata: Record<string, unknown>;
  statusReason: string | null;
  suspendedUntil: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function fail(context: string, error: { message: string } | null): never {
  console.error(`[api-management] ${context}: ${error?.message ?? "error desconocido"}`);
  throw ApiError.internal();
}

/* ------------------------------ Versiones ------------------------------ */

export async function findVersion(code: string): Promise<VersionRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("api_versions")
    .select("code, status, sunset_date, title")
    .eq("code", code)
    .maybeSingle();
  if (error) fail("findVersion", error);
  if (!data) return null;
  return {
    code: data.code,
    status: data.status,
    sunsetDate: data.sunset_date,
    title: data.title,
  };
}

export async function listVersions(): Promise<VersionRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("api_versions")
    .select("code, status, sunset_date, title")
    .order("code");
  if (error) fail("listVersions", error);
  return (data ?? []).map((row) => ({
    code: row.code,
    status: row.status,
    sunsetDate: row.sunset_date,
    title: row.title,
  }));
}

/* ------------------------------ API Keys ------------------------------- */

export async function findApiKeyByHash(hash: string): Promise<ApiKeyRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select(
      "id, name, application_name, company_name, contact_email, key_prefix, status, permissions, allowed_versions, rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day, expires_at",
    )
    .eq("key_hash", hash)
    .maybeSingle();
  if (error) fail("findApiKeyByHash", error);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    applicationName: data.application_name,
    companyName: data.company_name,
    contactEmail: data.contact_email,
    keyPrefix: data.key_prefix,
    status: data.status,
    permissions: data.permissions ?? [],
    allowedVersions: data.allowed_versions ?? [],
    rateLimitPerMinute: data.rate_limit_per_minute,
    rateLimitPerHour: data.rate_limit_per_hour,
    rateLimitPerDay: data.rate_limit_per_day,
    expiresAt: data.expires_at,
  };
}

export async function markKeyUsed(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error(`[api-management] markKeyUsed: ${error.message}`);
}

export async function markKeyExpired(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("api_keys").update({ status: "expired" }).eq("id", id);
  if (error) console.error(`[api-management] markKeyExpired: ${error.message}`);
}

/* --------------------------- Límites de uso ---------------------------- */

export async function registerRateHit(
  apiKeyId: string,
  kind: "minute" | "hour" | "day",
  windowStart: Date,
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("api_register_hit", {
    _api_key_id: apiKeyId,
    _kind: kind,
    _window_start: windowStart.toISOString(),
  });
  if (error) {
    console.error(`[api-management] registerRateHit: ${error.message}`);
    return 0;
  }
  return data ?? 0;
}

/* ------------------------------ Logs ---------------------------------- */

export interface RequestLogInput {
  requestId: string;
  endpoint: string;
  apiVersion: string | null;
  httpMethod: string;
  applicationName: string | null;
  apiKeyId: string | null;
  apiKeyPrefix: string | null;
  apiUserId: string | null;
  sourceIp: string | null;
  durationMs: number;
  statusCode: number;
  outcome: string;
  message: string;
  requestBytes: number;
  responseBytes: number;
  level: ApiLogLevel;
}

export async function insertRequestLog(input: RequestLogInput): Promise<void> {
  const { error } = await supabaseAdmin.from("api_request_logs").insert({
    request_id: input.requestId,
    endpoint: input.endpoint,
    api_version: input.apiVersion,
    http_method: input.httpMethod,
    application_name: input.applicationName,
    api_key_id: input.apiKeyId,
    api_key_prefix: input.apiKeyPrefix,
    api_user_id: input.apiUserId,
    source_ip: input.sourceIp,
    duration_ms: input.durationMs,
    status_code: input.statusCode,
    outcome: input.outcome,
    message: input.message,
    request_bytes: input.requestBytes,
    response_bytes: input.responseBytes,
    level: input.level,
  });
  if (error) console.error(`[api-management] insertRequestLog: ${error.message}`);
}

/* ----------------------------- Auditoría ------------------------------ */

export interface AuditInput {
  actorType: "api" | "admin" | "system";
  actorId?: string | null;
  actorLabel?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  applicationName?: string | null;
  apiVersion?: string | null;
  requestId?: string | null;
}

export async function insertAudit(input: AuditInput): Promise<void> {
  const { error } = await supabaseAdmin.from("api_audit_logs").insert({
    actor_type: input.actorType,
    actor_id: input.actorId ?? null,
    actor_label: input.actorLabel ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    old_value: (input.oldValue ?? null) as never,
    new_value: (input.newValue ?? null) as never,
    reason: input.reason ?? null,
    application_name: input.applicationName ?? null,
    api_version: input.apiVersion ?? null,
    request_id: input.requestId ?? null,
  });
  if (error) console.error(`[api-management] insertAudit: ${error.message}`);
}

/* ---------------------------- Usuarios API ---------------------------- */

const USER_COLUMNS =
  "id, email, full_name, status, external_id, phone, metadata, status_reason, suspended_until, deleted_at, created_at, updated_at";

function mapUser(row: Record<string, unknown>): ApiUserRecord {
  return {
    id: row['id'] as string,
    email: row['email'] as string,
    fullName: (row['full_name'] as string) ?? "",
    status: row['status'] as ApiUserStatus,
    externalId: (row['external_id'] as string | null) ?? null,
    phone: (row['phone'] as string | null) ?? null,
    metadata: (row['metadata'] as Record<string, unknown>) ?? {},
    statusReason: (row['status_reason'] as string | null) ?? null,
    suspendedUntil: (row['suspended_until'] as string | null) ?? null,
    deletedAt: (row['deleted_at'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

export async function listApiUsers(params: {
  page: number;
  pageSize: number;
  status?: ApiUserStatus;
  search?: string;
}): Promise<{ items: ApiUserRecord[]; total: number }> {
  let query = supabaseAdmin
    .from("api_users")
    .select(USER_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.search) {
    const term = params.search.replace(/[%,()]/g, "");
    query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  }

  const from = (params.page - 1) * params.pageSize;
  const { data, error, count } = await query.range(from, from + params.pageSize - 1);
  if (error) fail("listApiUsers", error);
  return { items: (data ?? []).map(mapUser), total: count ?? 0 };
}

export async function getApiUser(id: string): Promise<ApiUserRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("api_users")
    .select(USER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("getApiUser", error);
  return data ? mapUser(data) : null;
}

export async function findApiUserByEmail(email: string): Promise<ApiUserRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("api_users")
    .select(USER_COLUMNS)
    .ilike("email", email)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) fail("findApiUserByEmail", error);
  return data ? mapUser(data) : null;
}

export async function insertApiUser(values: {
  email: string;
  fullName: string;
  status: ApiUserStatus;
  externalId?: string | null;
  phone?: string | null;
  metadata: Record<string, unknown>;
  createdByApiKey?: string | null;
}): Promise<ApiUserRecord> {
  const { data, error } = await supabaseAdmin
    .from("api_users")
    .insert({
      email: values.email,
      full_name: values.fullName,
      status: values.status,
      external_id: values.externalId ?? null,
      phone: values.phone ?? null,
      metadata: values.metadata as never,
      created_by_api_key: values.createdByApiKey ?? null,
    })
    .select(USER_COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505" || error.code === "23P01" || error.code === "23000" || error.code === "23514") {
      throw ApiError.conflict("Ya existe un usuario con ese email");
    }
    if (error.code === "23505" || error.message.includes("duplicate")) {
      throw ApiError.conflict("Ya existe un usuario con ese email");
    }
    fail("insertApiUser", error);
  }
  return mapUser(data as Record<string, unknown>);
}

export async function updateApiUser(
  id: string,
  values: Record<string, unknown>,
): Promise<ApiUserRecord> {
  const { data, error } = await supabaseAdmin
    .from("api_users")
    .update(values as never)
    .eq("id", id)
    .select(USER_COLUMNS)
    .single();
  if (error) fail("updateApiUser", error);
  return mapUser(data as Record<string, unknown>);
}

export async function hardDeleteApiUser(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("api_users").delete().eq("id", id);
  if (error) fail("hardDeleteApiUser", error);
}

/* --------------------------- Roles y permisos -------------------------- */

export interface RoleRecord {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export async function listRoles(): Promise<RoleRecord[]> {
  const [roles, links] = await Promise.all([
    supabaseAdmin.from("api_roles").select("id, name, description, is_system").order("name"),
    supabaseAdmin.from("api_role_permissions").select("role_id, permission_code"),
  ]);
  if (roles.error) fail("listRoles", roles.error);
  if (links.error) fail("listRolePermissions", links.error);

  const byRole = new Map<string, string[]>();
  for (const link of links.data ?? []) {
    const list = byRole.get(link.role_id) ?? [];
    list.push(link.permission_code);
    byRole.set(link.role_id, list);
  }

  return (roles.data ?? []).map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.is_system,
    permissions: (byRole.get(role.id) ?? []).sort(),
  }));
}

export async function listPermissions(): Promise<
  Array<{ code: string; module: string; description: string }>
> {
  const { data, error } = await supabaseAdmin
    .from("api_permissions")
    .select("code, module, description")
    .order("code");
  if (error) fail("listPermissions", error);
  return data ?? [];
}

export async function getUserRoleIds(apiUserId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("api_user_roles")
    .select("role_id")
    .eq("api_user_id", apiUserId);
  if (error) fail("getUserRoleIds", error);
  return (data ?? []).map((row) => row.role_id);
}

export async function replaceUserRoles(apiUserId: string, roleIds: string[]): Promise<void> {
  const del = await supabaseAdmin.from("api_user_roles").delete().eq("api_user_id", apiUserId);
  if (del.error) fail("replaceUserRoles.delete", del.error);
  if (roleIds.length === 0) return;
  const ins = await supabaseAdmin
    .from("api_user_roles")
    .insert(roleIds.map((roleId) => ({ api_user_id: apiUserId, role_id: roleId })));
  if (ins.error) fail("replaceUserRoles.insert", ins.error);
}

export async function insertRole(values: {
  name: string;
  description: string;
  permissions: string[];
}): Promise<RoleRecord> {
  const { data, error } = await supabaseAdmin
    .from("api_roles")
    .insert({ name: values.name, description: values.description })
    .select("id, name, description, is_system")
    .single();
  if (error) {
    if (error.message.includes("duplicate")) throw ApiError.conflict("Ya existe un rol con ese nombre");
    fail("insertRole", error);
  }
  const role = data!;
  if (values.permissions.length > 0) {
    const link = await supabaseAdmin
      .from("api_role_permissions")
      .insert(values.permissions.map((code) => ({ role_id: role.id, permission_code: code })));
    if (link.error) fail("insertRole.permissions", link.error);
  }
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.is_system,
    permissions: values.permissions,
  };
}

/* --------------------------- Configuración ---------------------------- */

export interface SettingsRecord {
  apiKeyTtlDays: number;
  jwtTtlMinutes: number;
  defaultLimitPerMinute: number;
  defaultLimitPerHour: number;
  defaultLimitPerDay: number;
  lockoutPolicy: string;
  logRetentionDays: number;
  auditRetentionDays: number;
  minLogLevel: ApiLogLevel;
  maxResponseMs: number;
  allowHardDeleteUsers: boolean;
}

export async function getSettings(): Promise<SettingsRecord> {
  const { data, error } = await supabaseAdmin
    .from("api_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error) fail("getSettings", error);
  if (!data) throw ApiError.internal("Configuración no inicializada");
  return {
    apiKeyTtlDays: data.api_key_ttl_days,
    jwtTtlMinutes: data.jwt_ttl_minutes,
    defaultLimitPerMinute: data.default_limit_per_minute,
    defaultLimitPerHour: data.default_limit_per_hour,
    defaultLimitPerDay: data.default_limit_per_day,
    lockoutPolicy: data.lockout_policy,
    logRetentionDays: data.log_retention_days,
    auditRetentionDays: data.audit_retention_days,
    minLogLevel: data.min_log_level,
    maxResponseMs: data.max_response_ms,
    allowHardDeleteUsers: data.allow_hard_delete_users,
  };
}
