import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, GaugeCircle, History, Inbox, Plug, Workflow } from "lucide-react";

import { ModuleShell, type NavItem } from "@/components/layout/ModuleShell";

const nav: NavItem[] = [
  { to: "/aprovisionamiento", label: "Panel", icon: GaugeCircle },
  { to: "/aprovisionamiento/solicitudes", label: "Solicitudes", icon: Inbox, badge: "3" },
  { to: "/aprovisionamiento/reglas", label: "Motor de reglas", icon: Workflow },
  { to: "/aprovisionamiento/conectores", label: "Conectores", icon: Plug, badge: "2" },
  { to: "/aprovisionamiento/historial", label: "Historial y auditoría", icon: History },
];

const contextos: Record<string, { titulo: string; subtitulo: string }> = {
  "/aprovisionamiento": { titulo: "Panel de aprovisionamiento", subtitulo: "Estado operativo en tiempo real · 3 tenants activos" },
  "/aprovisionamiento/solicitudes": { titulo: "Solicitudes", subtitulo: "Alta, baja, modificación, suspensión, reactivación, ampliación y reducción" },
  "/aprovisionamiento/reglas": { titulo: "Motor de reglas", subtitulo: "Automatizaciones configurables sin modificar código" },
  "/aprovisionamiento/conectores": { titulo: "Conectores", subtitulo: "Identidad, directorio y pagos · todos en modo simulado" },
  "/aprovisionamiento/historial": { titulo: "Historial y auditoría", subtitulo: "Registro inmutable de operaciones y eventos publicados" },
};

export const Route = createFileRoute("/_authenticated/aprovisionamiento")({
  head: () => ({
    meta: [
      { title: "Aprovisionamiento — Nexora Platform" },
      { name: "description", content: "Automatiza el alta, baja y modificación de servicios contratados: tenants, licencias, permisos, credenciales y reglas." },
      { property: "og:title", content: "Módulo de Aprovisionamiento — Nexora Platform" },
      { property: "og:description", content: "Solicitudes multi-origen, motor de reglas, conectores y auditoría completa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProvisioningLayout,
});

function ProvisioningLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const context =
    contextos[pathname] ??
    (pathname.startsWith("/aprovisionamiento/solicitudes/")
      ? { titulo: "Detalle de solicitud", subtitulo: "Tareas ejecutadas, errores y acciones manuales" }
      : { titulo: "Aprovisionamiento", subtitulo: "Módulo 1 de la plataforma" });

  return (
    <ModuleShell moduleName="Aprovisionamiento" moduleTag="Nexora Platform · interno" nav={nav} context={context}>
      <div className="mb-6 hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
        <AlertTriangle className="size-3.5 text-warning" aria-hidden />
        Entorno de demostración: los sistemas destino responden desde la capa de simulación.
      </div>
      <Outlet />
    </ModuleShell>
  );
}
