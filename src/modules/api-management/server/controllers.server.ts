/**
 * API Management — Controladores HTTP de la API pública.
 *
 * Cada controlador es una fábrica parametrizada por versión: publicar una
 * nueva versión consiste en crear las rutas de `/api/public/vN` que llaman
 * a estas mismas fábricas (o a variantes específicas de esa versión), sin
 * modificar la pasarela ni los servicios.
 */
import { createApiEndpoint, type ApiRequestContext } from "./gateway.server";
import { permissionService, roleService } from "./roles.service.server";
import { userService, type ActorInfo } from "./users.service.server";

type RouteArgs = { request: Request; params: Record<string, string> };

function actorFrom(context: ApiRequestContext): ActorInfo {
  return {
    actorType: "api",
    actorId: context.apiKey.id,
    actorLabel: `${context.apiKey.name} (${context.apiKey.keyPrefix}…)`,
    applicationName: context.apiKey.applicationName || context.apiKey.name,
    apiVersion: context.version,
    requestId: context.requestId,
  };
}

export function usersCollection(version: string) {
  const list = createApiEndpoint({
    version,
    endpoint: "/users",
    permission: "usuarios.leer",
    handler: async (context) => ({ data: await userService.list(context.query) }),
  });

  const create = createApiEndpoint({
    version,
    endpoint: "/users",
    permission: "usuarios.crear",
    handler: async (context) => ({
      status: 201,
      data: await userService.create(context.body, actorFrom(context)),
    }),
  });

  return {
    GET: (args: RouteArgs) => list(args),
    POST: (args: RouteArgs) => create(args),
  };
}

export function usersItem(version: string) {
  const get = createApiEndpoint({
    version,
    endpoint: "/users/{id}",
    permission: "usuarios.leer",
    handler: async (context) => ({ data: await userService.get(context.params['id']!) }),
  });

  const update = createApiEndpoint({
    version,
    endpoint: "/users/{id}",
    permission: "usuarios.modificar",
    handler: async (context) => ({
      data: await userService.update(context.params['id']!, context.body, actorFrom(context)),
    }),
  });

  const remove = createApiEndpoint({
    version,
    endpoint: "/users/{id}",
    permission: "usuarios.eliminar",
    handler: async (context) => ({
      data: await userService.remove(context.params['id']!, null, actorFrom(context)),
    }),
  });

  return {
    GET: (args: RouteArgs) => get(args),
    PATCH: (args: RouteArgs) => update(args),
    DELETE: (args: RouteArgs) => remove(args),
  };
}

export function usersStatus(version: string) {
  const get = createApiEndpoint({
    version,
    endpoint: "/users/{id}/status",
    permission: "usuarios.leer",
    handler: async (context) => ({ data: await userService.status(context.params['id']!) }),
  });

  const change = createApiEndpoint({
    version,
    endpoint: "/users/{id}/status",
    permission: "usuarios.modificar",
    handler: async (context) => ({
      data: await userService.changeStatus(context.params['id']!, context.body, actorFrom(context)),
    }),
  });

  return {
    GET: (args: RouteArgs) => get(args),
    PATCH: (args: RouteArgs) => change(args),
  };
}

export function usersRoles(version: string) {
  const get = createApiEndpoint({
    version,
    endpoint: "/users/{id}/roles",
    permission: "usuarios.leer",
    handler: async (context) => ({ data: await userService.roles(context.params['id']!) }),
  });

  const replace = createApiEndpoint({
    version,
    endpoint: "/users/{id}/roles",
    permission: "usuarios.modificar",
    handler: async (context) => ({
      data: await userService.setRoles(context.params['id']!, context.body, actorFrom(context)),
    }),
  });

  return {
    GET: (args: RouteArgs) => get(args),
    PUT: (args: RouteArgs) => replace(args),
  };
}

export function usersPermissions(version: string) {
  const get = createApiEndpoint({
    version,
    endpoint: "/users/{id}/permissions",
    permission: "usuarios.leer",
    handler: async (context) => ({ data: await userService.permissions(context.params['id']!) }),
  });
  return { GET: (args: RouteArgs) => get(args) };
}

export function rolesCollection(version: string) {
  const list = createApiEndpoint({
    version,
    endpoint: "/roles",
    permission: "roles.leer",
    handler: async () => ({ data: await roleService.list() }),
  });

  const create = createApiEndpoint({
    version,
    endpoint: "/roles",
    permission: "roles.gestionar",
    handler: async (context) => ({
      status: 201,
      data: await roleService.create(context.body, actorFrom(context)),
    }),
  });

  return {
    GET: (args: RouteArgs) => list(args),
    POST: (args: RouteArgs) => create(args),
  };
}

export function permissionsCollection(version: string) {
  const list = createApiEndpoint({
    version,
    endpoint: "/permissions",
    permission: "permisos.leer",
    handler: async () => ({ data: await permissionService.list() }),
  });
  return { GET: (args: RouteArgs) => list(args) };
}

export function versionsCollection(version: string) {
  const list = createApiEndpoint({
    version,
    endpoint: "/versions",
    permission: null,
    handler: async () => {
      const { listVersions } = await import("./repositories.server");
      const versions = await listVersions();
      return {
        data: {
          items: versions.map((item) => ({
            code: item.code,
            title: item.title,
            status: item.status,
            sunsetDate: item.sunsetDate,
          })),
          total: versions.length,
        },
      };
    },
  });
  return { GET: (args: RouteArgs) => list(args) };
}
