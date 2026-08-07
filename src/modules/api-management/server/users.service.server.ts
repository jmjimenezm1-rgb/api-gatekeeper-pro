/**
 * API Management — Servicio de usuarios.
 * Contiene las reglas de negocio; no habla HTTP ni SQL directamente.
 */
import {
  changeApiUserStatusSchema,
  createApiUserSchema,
  listQuerySchema,
  setApiUserRolesSchema,
  updateApiUserSchema,
} from "../domain/schemas";
import type { ApiUserStatus } from "../domain/types";

import { ApiError } from "./errors.server";
import {
  findApiUserByEmail,
  getApiUser,
  getSettings,
  getUserRoleIds,
  hardDeleteApiUser,
  insertApiUser,
  insertAudit,
  listApiUsers,
  listRoles,
  replaceUserRoles,
  updateApiUser,
  type ApiUserRecord,
  type RoleRecord,
} from "./repositories.server";

export interface ActorInfo {
  actorType: "api" | "admin" | "system";
  actorId?: string | null;
  actorLabel?: string | null;
  applicationName?: string | null;
  apiVersion?: string | null;
  requestId?: string | null;
}

interface UserDto {
  id: string;
  email: string;
  fullName: string;
  status: ApiUserStatus;
  externalId: string | null;
  phone: string | null;
  metadata: Record<string, unknown>;
  statusReason: string | null;
  suspendedUntil: string | null;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

function parse<T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: unknown; error?: { issues: unknown } } }, value: unknown): T {
  const result = schema.safeParse(value ?? {});
  if (!result.success) throw ApiError.validation("Datos de entrada no válidos", result.error?.issues);
  return result.data as T;
}

async function decorate(user: ApiUserRecord, roles: RoleRecord[]): Promise<UserDto> {
  const roleIds = await getUserRoleIds(user.id);
  const assigned = roles.filter((role) => roleIds.includes(role.id));
  const permissions = [...new Set(assigned.flatMap((role) => role.permissions))].sort();
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    externalId: user.externalId,
    phone: user.phone,
    metadata: user.metadata,
    statusReason: user.statusReason,
    suspendedUntil: user.suspendedUntil,
    roles: assigned.map((role) => role.name),
    permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function requireUser(id: string): Promise<ApiUserRecord> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw ApiError.validation("Identificador no válido");
  const user = await getApiUser(id);
  if (!user || user.status === "deleted") throw ApiError.notFound("Usuario no encontrado");
  return user;
}

function resolveRoleIds(names: string[], roles: RoleRecord[]): string[] {
  return names.map((name) => {
    const role = roles.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase());
    if (!role) throw ApiError.validation(`El rol "${name}" no existe`);
    return role.id;
  });
}

export const userService = {
  async list(query: URLSearchParams) {
    const params = parse<{ page: number; pageSize: number; status?: ApiUserStatus; search?: string }>(
      listQuerySchema,
      Object.fromEntries(query.entries()),
    );
    const [{ items, total }, roles] = await Promise.all([listApiUsers(params), listRoles()]);
    const decorated = await Promise.all(items.map((item) => decorate(item, roles)));
    return { items: decorated, page: params.page, pageSize: params.pageSize, total };
  },

  async get(id: string) {
    const user = await requireUser(id);
    return decorate(user, await listRoles());
  },

  async status(id: string) {
    const user = await requireUser(id);
    return {
      id: user.id,
      status: user.status,
      statusReason: user.statusReason,
      suspendedUntil: user.suspendedUntil,
      updatedAt: user.updatedAt,
    };
  },

  async create(payload: unknown, actor: ActorInfo) {
    const input = parse<{
      email: string;
      fullName: string;
      phone?: string;
      externalId?: string;
      status: ApiUserStatus;
      metadata: Record<string, unknown>;
      roles: string[];
    }>(createApiUserSchema, payload);

    if (input.status === "deleted") throw ApiError.validation("No se puede crear un usuario eliminado");
    if (await findApiUserByEmail(input.email)) {
      throw ApiError.conflict("Ya existe un usuario con ese email");
    }

    const roles = await listRoles();
    const roleIds = resolveRoleIds(input.roles, roles);

    const created = await insertApiUser({
      email: input.email,
      fullName: input.fullName,
      status: input.status,
      externalId: input.externalId ?? null,
      phone: input.phone ?? null,
      metadata: input.metadata,
      createdByApiKey: actor.actorType === "api" ? (actor.actorId ?? null) : null,
    });

    if (roleIds.length > 0) await replaceUserRoles(created.id, roleIds);

    await insertAudit({
      ...actor,
      action: "user.create",
      entityType: "api_user",
      entityId: created.id,
      newValue: { email: created.email, status: created.status, roles: input.roles },
    });

    return decorate(created, roles);
  },

  async update(id: string, payload: unknown, actor: ActorInfo) {
    const before = await requireUser(id);
    const input = parse<Record<string, unknown>>(updateApiUserSchema, payload);
    const { reason, ...fields } = input;

    if (typeof fields['email'] === "string") {
      const existing = await findApiUserByEmail(fields['email']);
      if (existing && existing.id !== id) throw ApiError.conflict("Ya existe un usuario con ese email");
    }

    const columnMap: Record<string, string> = {
      email: "email",
      fullName: "full_name",
      phone: "phone",
      externalId: "external_id",
      metadata: "metadata",
    };
    const values: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      const column = columnMap[key];
      if (column) values[column] = value;
    }
    if (Object.keys(values).length === 0) throw ApiError.validation("Nada que modificar");

    const after = await updateApiUser(id, values);

    await insertAudit({
      ...actor,
      action: "user.update",
      entityType: "api_user",
      entityId: id,
      oldValue: {
        email: before.email,
        fullName: before.fullName,
        phone: before.phone,
        externalId: before.externalId,
        metadata: before.metadata,
      },
      newValue: {
        email: after.email,
        fullName: after.fullName,
        phone: after.phone,
        externalId: after.externalId,
        metadata: after.metadata,
      },
      reason: typeof reason === "string" ? reason : null,
    });

    return decorate(after, await listRoles());
  },

  async changeStatus(id: string, payload: unknown, actor: ActorInfo) {
    const before = await requireUser(id);
    const input = parse<{ status: ApiUserStatus; reason?: string; suspendedUntil?: string }>(
      changeApiUserStatusSchema,
      payload,
    );

    if (input.status === "deleted") {
      return this.remove(id, input.reason ?? null, actor);
    }

    const after = await updateApiUser(id, {
      status: input.status,
      status_reason: input.reason ?? null,
      suspended_until: input.status === "suspended" ? (input.suspendedUntil ?? null) : null,
    });

    await insertAudit({
      ...actor,
      action: `user.status.${input.status}`,
      entityType: "api_user",
      entityId: id,
      oldValue: { status: before.status },
      newValue: { status: after.status, suspendedUntil: after.suspendedUntil },
      reason: input.reason ?? null,
    });

    return {
      id: after.id,
      status: after.status,
      statusReason: after.statusReason,
      suspendedUntil: after.suspendedUntil,
    };
  },

  async remove(id: string, reason: string | null, actor: ActorInfo) {
    const before = await requireUser(id);
    const settings = await getSettings();

    if (settings.allowHardDeleteUsers) {
      await insertAudit({
        ...actor,
        action: "user.delete.hard",
        entityType: "api_user",
        entityId: id,
        oldValue: { email: before.email, status: before.status },
        newValue: null,
        reason,
      });
      await hardDeleteApiUser(id);
      return { id, status: "deleted" as const, hardDeleted: true };
    }

    const after = await updateApiUser(id, {
      status: "deleted",
      status_reason: reason,
      deleted_at: new Date().toISOString(),
    });

    await insertAudit({
      ...actor,
      action: "user.delete.soft",
      entityType: "api_user",
      entityId: id,
      oldValue: { status: before.status },
      newValue: { status: after.status },
      reason,
    });

    return { id, status: after.status, hardDeleted: false };
  },

  async roles(id: string) {
    const user = await requireUser(id);
    const roles = await listRoles();
    const roleIds = await getUserRoleIds(user.id);
    return {
      id: user.id,
      roles: roles
        .filter((role) => roleIds.includes(role.id))
        .map((role) => ({ id: role.id, name: role.name, description: role.description })),
    };
  },

  async permissions(id: string) {
    const dto = await this.get(id);
    return { id: dto.id, roles: dto.roles, permissions: dto.permissions };
  },

  async setRoles(id: string, payload: unknown, actor: ActorInfo) {
    const user = await requireUser(id);
    const input = parse<{ roles: string[]; reason?: string }>(setApiUserRolesSchema, payload);
    const roles = await listRoles();
    const roleIds = resolveRoleIds(input.roles, roles);
    const previousIds = await getUserRoleIds(user.id);

    await replaceUserRoles(user.id, roleIds);

    await insertAudit({
      ...actor,
      action: "user.roles.replace",
      entityType: "api_user",
      entityId: user.id,
      oldValue: { roles: roles.filter((r) => previousIds.includes(r.id)).map((r) => r.name) },
      newValue: { roles: input.roles },
      reason: input.reason ?? null,
    });

    return decorate(user, roles);
  },
};
