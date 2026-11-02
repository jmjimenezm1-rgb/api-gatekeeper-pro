import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, SectionCard, StatCard, StatusPill } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applications, currentTenant, portalUsers as seedUsers } from "@/lib/domain/seed";
import type { PortalRole, PortalUser } from "@/lib/domain/types";
import { fmtDateTime } from "@/lib/format";
import { roleLabels, rolePermissions } from "@/lib/portal/permissions";
import { publish } from "@/lib/integration/event-bus";

export const Route = createFileRoute("/_authenticated/portal/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios y accesos — Portal del Cliente" },
      { name: "description", content: "Invita usuarios, asigna roles y controla el acceso a cada aplicación contratada por tu empresa." },
      { property: "og:title", content: "Usuarios y accesos — Portal del Cliente" },
      { property: "og:description", content: "Gestión de usuarios, roles y permisos del tenant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalUsuarios,
});

const estadoTono = { activo: "exito", invitado: "aviso", desactivado: "neutro" } as const;
const roles = Object.keys(roleLabels) as PortalRole[];

function PortalUsuarios() {
  const [usuarios, setUsuarios] = useState<PortalUser[]>(seedUsers);
  const [busqueda, setBusqueda] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<PortalRole>("usuario_estandar");

  const filtrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase()),
  );

  function invitar() {
    if (!email.includes("@")) {
      toast.error("Introduce un correo válido");
      return;
    }
    const nuevo: PortalUser = {
      id: `us_${Math.random().toString(36).slice(2, 7)}`,
      nombre: email.split("@")[0]!,
      email,
      rol,
      estado: "invitado",
      mfa: false,
      ultimoAcceso: null,
      aplicaciones: [],
    };
    setUsuarios((prev) => [nuevo, ...prev]);
    publish("portal.usuario.invitado", nuevo, { emisor: "portal-cliente", tenantId: currentTenant.id });
    toast.success(`Invitación enviada a ${email}`);
    setEmail("");
  }

  function alternarEstado(id: string) {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, estado: u.estado === "desactivado" ? "activo" : "desactivado" } : u)),
    );
  }

  function cambiarRol(id: string, nuevoRol: PortalRole) {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u)));
    publish("portal.usuario.rol.cambiado", { id, rol: nuevoRol }, { emisor: "portal-cliente", tenantId: currentTenant.id });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Usuarios y accesos"
        descripcion={`Máximo ${currentTenant.limites.usuarios} usuarios en el plan ${currentTenant.plan}. Los cambios de rol se publican como eventos para el módulo de Usuarios.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard etiqueta="Usuarios activos" valor={usuarios.filter((u) => u.estado === "activo").length} ayuda={`de ${currentTenant.limites.usuarios} disponibles`} />
        <StatCard etiqueta="Invitaciones pendientes" valor={usuarios.filter((u) => u.estado === "invitado").length} tono="aviso" />
        <StatCard etiqueta="Con doble factor" valor={usuarios.filter((u) => u.mfa).length} ayuda={`${usuarios.length} en total`} tono="info" />
        <StatCard etiqueta="Desactivados" valor={usuarios.filter((u) => u.estado === "desactivado").length} />
      </div>

      <SectionCard titulo="Invitar a un usuario" descripcion="Recibirá un correo para crear su contraseña y activar el doble factor">
        <div className="flex flex-col gap-3 p-4 sm:flex-row md:px-5">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.example" type="email" className="sm:max-w-xs" />
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as PortalRole)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm sm:max-w-56"
            aria-label="Rol del nuevo usuario"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>
          <Button onClick={invitar}>Enviar invitación</Button>
        </div>
      </SectionCard>

      <SectionCard
        titulo="Usuarios de la empresa"
        acciones={<Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o correo" className="h-8 w-48 text-xs" />}
      >
        {filtrados.length === 0 ? (
          <EmptyState titulo="Sin resultados" descripcion="Prueba con otro nombre o correo." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium md:px-5">Usuario</th>
                  <th className="px-4 py-2.5 font-medium">Rol</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">Aplicaciones</th>
                  <th className="px-4 py-2.5 font-medium">Último acceso</th>
                  <th className="px-4 py-2.5 font-medium text-right md:px-5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrados.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 md:px-5">
                      <p className="font-medium">{u.nombre}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRol(u.id, e.target.value as PortalRole)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        aria-label={`Rol de ${u.nombre}`}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-muted-foreground">{rolePermissions[u.rol].length} permisos</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tono={estadoTono[u.estado]}>{u.estado}</StatusPill>
                      {u.mfa ? <p className="mt-1 text-[11px] text-muted-foreground">2FA activo</p> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.aplicaciones.length
                        ? u.aplicaciones.map((id) => applications.find((a) => a.id === id)?.nombre).join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.ultimoAcceso ? fmtDateTime(u.ultimoAcceso) : "Nunca"}</td>
                    <td className="px-4 py-3 text-right md:px-5">
                      <Button variant="outline" size="sm" onClick={() => alternarEstado(u.id)}>
                        {u.estado === "desactivado" ? "Reactivar" : "Desactivar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard titulo="Matriz de permisos por rol" descripcion="Configurable por el administrador de empresa">
        <div className="overflow-x-auto p-4 md:px-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <div key={r} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{roleLabels[r]}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {rolePermissions[r].map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
