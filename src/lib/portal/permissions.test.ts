import { describe, expect, it } from "vitest";

import { rolePermissions } from "./permissions";

describe("permisos del portal", () => {
  it("el usuario solo lectura no puede gestionar usuarios", () => {
    expect(rolePermissions.solo_lectura).not.toContain("portal.usuarios.gestionar");
  });
  it("el administrador financiero puede descargar facturas", () => {
    expect(rolePermissions.admin_financiero).toContain("portal.facturacion.descargar");
  });
  it("ningún rol de portal incluye permisos de la gestión de API", () => {
    for (const perms of Object.values(rolePermissions)) {
      expect(perms.every((p) => p.startsWith("portal."))).toBe(true);
    }
  });
});
