import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutDashboard, Users, AppWindow, ChartNoAxesCombined, Receipt, Files, LifeBuoy, Building2, ShieldCheck } from "lucide-react";

import { ModuleShell, type NavItem } from "@/components/layout/ModuleShell";
import { currentTenant } from "@/lib/domain/seed";
import { useNotifications } from "@/lib/portal/notifications";

const nav: NavItem[] = [
  { to: "/portal", label: "Inicio", icon: LayoutDashboard },
  { to: "/portal/usuarios", label: "Usuarios y roles", icon: Users },
  { to: "/portal/aplicaciones", label: "Aplicaciones y licencias", icon: AppWindow },
  { to: "/portal/consumo", label: "Consumo", icon: ChartNoAxesCombined },
  { to: "/portal/facturacion", label: "Facturación", icon: Receipt },
  { to: "/portal/documentos", label: "Documentos", icon: Files },
  { to: "/portal/soporte", label: "Soporte", icon: LifeBuoy },
  { to: "/portal/perfil", label: "Perfil de empresa", icon: Building2 },
  { to: "/portal/seguridad", label: "Seguridad", icon: ShieldCheck },
  { to: "/portal/notificaciones", label: "Notificaciones", icon: Bell, badge: "2" },
];

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Portal del Cliente — Nexora Platform" },
      { name: "description", content: "Área privada para autogestionar aplicaciones, usuarios, consumo, facturación, soporte y seguridad de tu empresa." },
      { property: "og:title", content: "Portal del Cliente — Nexora Platform" },
      { property: "og:description", content: "Autogestión por tenant con aislamiento estricto de datos y permisos configurables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalLayout,
});

function PortalLayout() {
  const unread = useNotifications().filter((item) => !item.leida).length;
  const portalNav = nav.map((item) => item.to === "/portal/notificaciones" ? { ...item, badge: unread ? String(unread) : "" } : item);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const context = {
    titulo: nav.find((item) => item.to === pathname)?.label ?? "Portal del Cliente",
    subtitulo: `${currentTenant.organizacion} · plan ${currentTenant.plan}`,
  };

  return (
    <ModuleShell moduleName="Portal del Cliente" moduleTag={currentTenant.organizacion} nav={portalNav} context={context}>
      <Outlet />
    </ModuleShell>
  );
}
