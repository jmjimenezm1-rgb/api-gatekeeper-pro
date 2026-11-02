import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard, StatusPill } from "@/components/common/ui-bits";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNotifications, markNotificationsRead } from "@/lib/portal/notifications";
import { notificationPreferences } from "@/lib/domain/seed";
import { fmtDateTime } from "@/lib/format";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/_authenticated/portal/notificaciones")({
  head: () => pageMeta("Notificaciones — Portal del Cliente Nexora", "Avisos, renovaciones, alertas y preferencias de comunicación de tu empresa."),
  component: Notificaciones,
});

const tono = { alerta: "error", renovacion: "aviso", incidencia: "info", cambio: "info", aviso: "neutro", mensaje: "neutro" } as const;

const prefs = [
  ["renovaciones", "Renovaciones y vencimientos"],
  ["consumo", "Alertas de consumo y límites"],
  ["incidencias", "Actualizaciones de incidencias"],
  ["facturacion", "Facturación y pagos"],
  ["productoNovedades", "Novedades de producto"],
] as const;

function Notificaciones() {
  const [estado, setEstado] = useState(notificationPreferences);
  const notifications = useNotifications();
  const sinLeer = notifications.filter((item) => !item.leida).length;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Notificaciones" descripcion="Mensajes, alertas, renovaciones, cambios e incidencias de tu empresa." />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" titulo={`${sinLeer} sin leer`} acciones={<Button variant="outline" size="sm" disabled={sinLeer === 0} onClick={() => markNotificationsRead()}><Check aria-hidden />Marcar todas leídas</Button>}>
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id} className="flex flex-wrap items-start gap-3 px-4 py-3.5 md:px-5">
                <div className="min-w-0 flex-1">
                  <p className={n.leida ? "text-sm" : "text-sm font-semibold"}>{n.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.cuerpo}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(n.fecha)}</p>
                </div>
                <StatusPill tono={tono[n.tipo]}>{n.tipo}</StatusPill>
                {!n.leida ? <Button variant="ghost" size="icon" aria-label={`Marcar como leída: ${n.titulo}`} title="Marcar como leída" onClick={() => markNotificationsRead(n.id)}><Check aria-hidden /></Button> : null}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard titulo="Preferencias" descripcion="Se sincronizan con el módulo de Notificaciones vía API">
          <ul className="divide-y divide-border">
            {prefs.map(([clave, etiqueta]) => (
              <li key={clave} className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
                <span className="text-sm">{etiqueta}</span>
                <Switch
                  checked={estado[clave]}
                  aria-label={etiqueta}
                  onCheckedChange={(v) => {
                    setEstado((s) => ({ ...s, [clave]: v }));
                    toast.success("Preferencia actualizada", { description: etiqueta });
                  }}
                />
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
