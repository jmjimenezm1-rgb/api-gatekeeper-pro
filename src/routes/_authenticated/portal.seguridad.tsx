import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard, StatCard, StatusPill } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { accessLog, currentTenant, portalUsers, sessions as seedSessions } from "@/lib/domain/seed";
import { fmtDateTime } from "@/lib/format";
import { publish } from "@/lib/integration/event-bus";

export const Route = createFileRoute("/_authenticated/portal/seguridad")({
  head: () => ({
    meta: [
      { title: "Seguridad — Portal del Cliente" },
      { name: "description", content: "Doble factor, sesiones activas, política de contraseñas y registro de accesos de tu empresa." },
      { property: "og:title", content: "Seguridad — Portal del Cliente" },
      { property: "og:description", content: "Controles de seguridad y trazabilidad de accesos del tenant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalSeguridad,
});

const metodos = { password: "Contraseña", sso_google: "SSO Google", sso_microsoft: "SSO Microsoft", saml: "SAML" } as const;

function PortalSeguridad() {
  const [sesiones, setSesiones] = useState(seedSessions);
  const [mfaObligatorio, setMfaObligatorio] = useState(false);
  const [ssoUnico, setSsoUnico] = useState(false);

  function cerrar(id: string) {
    setSesiones((prev) => prev.filter((s) => s.id !== id));
    publish("portal.sesion.revocada", { id }, { emisor: "portal-cliente", tenantId: currentTenant.id });
    toast.success("Sesión cerrada");
  }

  function cerrarTodas() {
    setSesiones((prev) => prev.filter((s) => s.actual));
    toast.success("Se han cerrado el resto de sesiones");
  }

  const sinMfa = portalUsers.filter((u) => u.estado === "activo" && !u.mfa);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Seguridad" descripcion="Políticas aplicadas exclusivamente a tu empresa. Toda acción queda registrada en Auditoría." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard etiqueta="Sesiones activas" valor={sesiones.length} />
        <StatCard etiqueta="Usuarios sin 2FA" valor={sinMfa.length} tono={sinMfa.length ? "aviso" : "exito"} />
        <StatCard etiqueta="Accesos fallidos (7 días)" valor={accessLog.filter((a) => a.resultado === "fallido").length} tono="error" />
        <StatCard etiqueta="Método principal" valor="SSO Google" tono="info" />
      </div>

      <SectionCard titulo="Políticas de acceso">
        <ul className="divide-y divide-border">
          <li className="flex items-center gap-4 px-4 py-3.5 md:px-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Exigir doble factor a todos los usuarios</p>
              <p className="text-xs text-muted-foreground">{sinMfa.length} usuarios deberán configurarlo en su próximo acceso.</p>
            </div>
            <Switch
              checked={mfaObligatorio}
              onCheckedChange={(v) => {
                setMfaObligatorio(v);
                publish("portal.seguridad.mfa_obligatorio", { activo: v }, { emisor: "portal-cliente", tenantId: currentTenant.id });
              }}
              aria-label="Exigir doble factor"
            />
          </li>
          <li className="flex items-center gap-4 px-4 py-3.5 md:px-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Permitir solo inicio de sesión único (SSO)</p>
              <p className="text-xs text-muted-foreground">Desactiva el acceso con contraseña para el dominio corporativo.</p>
            </div>
            <Switch checked={ssoUnico} onCheckedChange={setSsoUnico} aria-label="Solo SSO" />
          </li>
          <li className="flex flex-wrap items-center gap-4 px-4 py-3.5 md:px-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Política de contraseñas</p>
              <p className="text-xs text-muted-foreground">Mínimo 12 caracteres, caducidad 180 días, sin reutilizar las 5 últimas.</p>
            </div>
            <StatusPill tono="exito">activa</StatusPill>
          </li>
        </ul>
      </SectionCard>

      <SectionCard
        titulo="Sesiones activas"
        acciones={
          <Button size="sm" variant="outline" onClick={cerrarTodas}>
            Cerrar las demás
          </Button>
        }
      >
        <ul className="divide-y divide-border">
          {sesiones.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 md:px-5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {s.dispositivo} {s.actual ? <StatusPill tono="info" className="ml-2">esta sesión</StatusPill> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.ubicacion} · {s.ip} · inicio {fmtDateTime(s.inicio)}
                </p>
              </div>
              {s.actual ? null : (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cerrar(s.id)}>
                  Cerrar
                </Button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard titulo="Registro de accesos" descripcion="Últimos intentos de inicio de sesión de tu empresa">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium md:px-5">Fecha</th>
                <th className="px-4 py-2.5 font-medium">Usuario</th>
                <th className="px-4 py-2.5 font-medium">IP</th>
                <th className="px-4 py-2.5 font-medium">Método</th>
                <th className="px-4 py-2.5 font-medium md:px-5">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accessLog.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 text-xs text-muted-foreground md:px-5">{fmtDateTime(a.fecha)}</td>
                  <td className="px-4 py-3">{a.usuario}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.ip}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{metodos[a.metodo]}</td>
                  <td className="px-4 py-3 md:px-5">
                    <StatusPill tono={a.resultado === "ok" ? "exito" : "error"}>{a.resultado}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
