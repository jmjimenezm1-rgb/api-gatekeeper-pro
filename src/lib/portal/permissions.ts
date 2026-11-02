import type { PortalRole } from "../domain/types";

export const roleLabels: Record<PortalRole, string> = {
  admin_empresa: "Administrador de empresa",
  admin_tecnico: "Administrador técnico",
  admin_financiero: "Administrador financiero",
  responsable_usuarios: "Responsable de usuarios",
  usuario_estandar: "Usuario estándar",
  solo_lectura: "Usuario solo lectura",
};

export const permissionKeys = [
  "portal.dashboard.ver",
  "portal.usuarios.ver",
  "portal.usuarios.gestionar",
  "portal.aplicaciones.ver",
  "portal.aplicaciones.solicitar",
  "portal.consumo.ver",
  "portal.facturacion.ver",
  "portal.facturacion.descargar",
  "portal.documentos.ver",
  "portal.soporte.ver",
  "portal.soporte.crear",
  "portal.perfil.editar",
  "portal.seguridad.gestionar",
  "portal.notificaciones.configurar",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];

export const rolePermissions: Record<PortalRole, PermissionKey[]> = {
  admin_empresa: [...permissionKeys],
  admin_tecnico: [
    "portal.dashboard.ver",
    "portal.usuarios.ver",
    "portal.usuarios.gestionar",
    "portal.aplicaciones.ver",
    "portal.aplicaciones.solicitar",
    "portal.consumo.ver",
    "portal.documentos.ver",
    "portal.soporte.ver",
    "portal.soporte.crear",
    "portal.seguridad.gestionar",
    "portal.notificaciones.configurar",
  ],
  admin_financiero: [
    "portal.dashboard.ver",
    "portal.aplicaciones.ver",
    "portal.consumo.ver",
    "portal.facturacion.ver",
    "portal.facturacion.descargar",
    "portal.documentos.ver",
    "portal.soporte.ver",
    "portal.soporte.crear",
    "portal.notificaciones.configurar",
  ],
  responsable_usuarios: [
    "portal.dashboard.ver",
    "portal.usuarios.ver",
    "portal.usuarios.gestionar",
    "portal.aplicaciones.ver",
    "portal.consumo.ver",
    "portal.documentos.ver",
    "portal.soporte.ver",
    "portal.soporte.crear",
  ],
  usuario_estandar: [
    "portal.dashboard.ver",
    "portal.aplicaciones.ver",
    "portal.documentos.ver",
    "portal.soporte.ver",
    "portal.soporte.crear",
    "portal.perfil.editar",
  ],
  solo_lectura: ["portal.dashboard.ver", "portal.aplicaciones.ver", "portal.documentos.ver", "portal.soporte.ver"],
};

export function can(rol: PortalRole, permiso: PermissionKey) {
  return rolePermissions[rol].includes(permiso);
}
