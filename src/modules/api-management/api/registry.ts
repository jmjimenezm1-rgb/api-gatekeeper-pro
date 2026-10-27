/**
 * API Management — Registro de endpoints.
 *
 * Punto único de extensión: cualquier módulo de la aplicación registra aquí
 * sus endpoints y quedan automáticamente incluidos en la documentación
 * OpenAPI, en el listado de permisos requeridos y en el panel de
 * administración, sin tocar la infraestructura existente.
 */

export interface EndpointDefinition {
  /** Módulo funcional propietario del endpoint. */
  module: string;
  /** Versiones en las que está publicado. */
  versions: string[];
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Ruta relativa a /api/public/{version}. */
  path: string;
  operationId: string;
  summary: string;
  description: string;
  /** Permiso requerido, o null si solo requiere API Key válida. */
  permission: string | null;
  pathParams?: Array<{ name: string; description: string }>;
  queryParams?: Array<{ name: string; description: string; required?: boolean }>;
  requestExample?: unknown;
  responseExample?: unknown;
}

export const API_ENDPOINTS: EndpointDefinition[] = [
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "GET",
    path: "/users",
    operationId: "listUsers",
    summary: "Listar usuarios",
    description: "Devuelve la lista paginada de usuarios gestionados por la plataforma.",
    permission: "usuarios.leer",
    queryParams: [
      { name: "page", description: "Página (por defecto 1)" },
      { name: "pageSize", description: "Tamaño de página, máximo 100" },
      { name: "status", description: "Filtro por estado del usuario" },
      { name: "search", description: "Búsqueda por email o nombre" },
    ],
    responseExample: {
      success: true,
      data: {
        items: [
          {
            id: "1f2e...",
            email: "ana@empresa.com",
            fullName: "Ana Pérez",
            status: "active",
            roles: ["Supervisor"],
          },
        ],
        page: 1,
        pageSize: 25,
        total: 1,
      },
      requestId: "req_9c1f...",
      timestamp: "2026-01-01T10:00:00.000Z",
      version: "v1",
    },
  },
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "POST",
    path: "/users",
    operationId: "createUser",
    summary: "Alta de usuario",
    description: "Crea un usuario. Si no se indica estado se crea como pendiente de activación.",
    permission: "usuarios.crear",
    requestExample: {
      email: "ana@empresa.com",
      fullName: "Ana Pérez",
      status: "pending",
      roles: ["Empleado"],
      metadata: { centro: "Madrid" },
    },
    responseExample: { success: true, data: { id: "1f2e...", status: "pending" } },
  },
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "GET",
    path: "/users/{id}",
    operationId: "getUser",
    summary: "Consultar usuario",
    description: "Devuelve el detalle de un usuario, incluidos sus roles y permisos efectivos.",
    permission: "usuarios.leer",
    pathParams: [{ name: "id", description: "Identificador interno del usuario" }],
  },
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "PATCH",
    path: "/users/{id}",
    operationId: "updateUser",
    summary: "Modificar usuario",
    description: "Modifica los datos del usuario. Genera registro de auditoría con valor anterior y nuevo.",
    permission: "usuarios.modificar",
    pathParams: [{ name: "id", description: "Identificador interno del usuario" }],
    requestExample: { fullName: "Ana Pérez Gómez", reason: "Corrección de apellidos" },
  },
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "DELETE",
    path: "/users/{id}",
    operationId: "deleteUser",
    summary: "Dar de baja definitiva",
    description:
      "Baja definitiva del usuario. Por defecto es una baja lógica; el borrado físico solo se ejecuta si la configuración lo permite.",
    permission: "usuarios.eliminar",
    pathParams: [{ name: "id", description: "Identificador interno del usuario" }],
  },
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "GET",
    path: "/users/{id}/status",
    operationId: "getUserStatus",
    summary: "Consultar estado del usuario",
    description: "Devuelve el estado actual del usuario y el motivo del último cambio.",
    permission: "usuarios.leer",
    pathParams: [{ name: "id", description: "Identificador interno del usuario" }],
  },
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "PATCH",
    path: "/users/{id}/status",
    operationId: "changeUserStatus",
    summary: "Suspender, reactivar o bloquear usuario",
    description:
      "Cambia el estado del usuario. Estados admitidos: active, suspended, pending, blocked, deleted.",
    permission: "usuarios.modificar",
    pathParams: [{ name: "id", description: "Identificador interno del usuario" }],
    requestExample: { status: "suspended", reason: "Impago" },
  },
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "GET",
    path: "/users/{id}/roles",
    operationId: "getUserRoles",
    summary: "Consultar roles del usuario",
    description: "Lista los roles asignados al usuario.",
    permission: "usuarios.leer",
    pathParams: [{ name: "id", description: "Identificador interno del usuario" }],
  },
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "PUT",
    path: "/users/{id}/roles",
    operationId: "setUserRoles",
    summary: "Modificar roles del usuario",
    description: "Sustituye el conjunto de roles del usuario por el indicado.",
    permission: "usuarios.modificar",
    pathParams: [{ name: "id", description: "Identificador interno del usuario" }],
    requestExample: { roles: ["Supervisor", "Empleado"], reason: "Promoción interna" },
  },
  {
    module: "usuarios",
    versions: ["v1", "v2"],
    method: "GET",
    path: "/users/{id}/permissions",
    operationId: "getUserPermissions",
    summary: "Consultar permisos efectivos",
    description: "Devuelve los permisos efectivos del usuario, derivados de sus roles.",
    permission: "usuarios.leer",
    pathParams: [{ name: "id", description: "Identificador interno del usuario" }],
  },
  {
    module: "roles",
    versions: ["v1", "v2"],
    method: "GET",
    path: "/roles",
    operationId: "listRoles",
    summary: "Listar roles",
    description: "Devuelve todos los roles parametrizados con sus permisos.",
    permission: "roles.leer",
  },
  {
    module: "roles",
    versions: ["v1", "v2"],
    method: "POST",
    path: "/roles",
    operationId: "createRole",
    summary: "Crear rol",
    description: "Crea un rol nuevo con la combinación de permisos indicada.",
    permission: "roles.gestionar",
    requestExample: { name: "Auditor", description: "Solo lectura", permissions: ["usuarios.leer"] },
  },
  {
    module: "versiones",
    versions: ["v1", "v2"],
    method: "GET",
    path: "/versions",
    operationId: "listVersions",
    summary: "Listar versiones de la API",
    description:
      "Devuelve las versiones publicadas, su estado y la fecha de retirada prevista. Solo requiere una API Key válida.",
    permission: null,
    responseExample: {
      success: true,
      data: { items: [{ code: "v1", title: "Versión 1", status: "active", sunsetDate: null }], total: 1 },
    },
  },
  {
    module: "permisos",
    versions: ["v1", "v2"],
    method: "GET",
    path: "/permissions",
    operationId: "listPermissions",
    summary: "Listar permisos",
    description: "Catálogo completo de permisos disponibles, agrupados por módulo.",
    permission: "permisos.leer",
  },
];

export function endpointsForVersion(version: string): EndpointDefinition[] {
  return API_ENDPOINTS.filter((endpoint) => endpoint.versions.includes(version));
}
