/**
 * API Management — Servicio de roles y permisos.
 */
import { upsertRoleSchema } from "../domain/schemas";

import { ApiError } from "./errors.server";
import { insertAudit, insertRole, listPermissions, listRoles } from "./repositories.server";
import type { ActorInfo } from "./users.service.server";

export const roleService = {
  async list() {
    const roles = await listRoles();
    return {
      items: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions,
      })),
      total: roles.length,
    };
  },

  async create(payload: unknown, actor: ActorInfo) {
    const parsed = upsertRoleSchema.safeParse(payload ?? {});
    if (!parsed.success) throw ApiError.validation("Datos de rol no válidos", parsed.error.issues);

    const catalog = await listPermissions();
    const codes = new Set(catalog.map((permission) => permission.code));
    for (const code of parsed.data.permissions) {
      if (!codes.has(code)) throw ApiError.validation(`El permiso "${code}" no existe`);
    }

    const role = await insertRole({
      name: parsed.data.name,
      description: parsed.data.description,
      permissions: parsed.data.permissions,
    });

    await insertAudit({
      ...actor,
      action: "role.create",
      entityType: "api_role",
      entityId: role.id,
      newValue: { name: role.name, permissions: role.permissions },
    });

    return role;
  },
};

export const permissionService = {
  async list() {
    const permissions = await listPermissions();
    const modules = [...new Set(permissions.map((permission) => permission.module))].sort();
    return {
      items: permissions,
      modules,
      total: permissions.length,
    };
  },
};
