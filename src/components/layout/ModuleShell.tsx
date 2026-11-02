import { PlatformBar } from "./PlatformBar";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, Bell, ChevronLeft, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/portal/notifications";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface ModuleShellProps {
  moduleName: string;
  moduleTag: string;
  nav: NavItem[];
  context: { titulo: string; subtitulo: string };
  children: React.ReactNode;
}

function NavList({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Navegación del módulo" className="flex flex-col gap-1">
      {nav.map((item) => {
        const esInicio = item.to === "/" || item.to === "/portal" || item.to === "/aprovisionamiento";
        const activo = pathname === item.to || (!esInicio && pathname.startsWith(`${item.to}/`));
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
              activo
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-[11px] font-semibold text-sidebar-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function ModuleShell({ moduleName, moduleTag, nav, context, children }: ModuleShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const unread = useNotifications().filter((item) => !item.leida).length;

  const aside = (
    <div className="flex h-full flex-col bg-sidebar p-4 text-sidebar-foreground">
      <Link to="/" className="mb-6 flex items-center gap-3 rounded-md px-1 py-1">
        <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary font-display text-base font-bold text-sidebar-primary-foreground">
          N
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold">{moduleName}</span>
          <span className="block truncate text-xs text-sidebar-foreground/60">{moduleTag}</span>
        </span>
      </Link>
      <NavList nav={nav} onNavigate={() => setNavigationOpen(false)} />
      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs text-sidebar-foreground/80">
          <p className="font-medium text-sidebar-accent-foreground">Servicios externos simulados</p>
          <p className="mt-1">Facturación, CRM, Soporte y BI responden desde la capa mock.</p>
          <Link to="/integraciones" className="mt-2 inline-flex items-center gap-1 text-sidebar-primary underline-offset-2 hover:underline">
            Ver contratos de API
          </Link>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className="size-3.5" aria-hidden /> Cambiar de módulo
        </Link>
      </div>
    </div>
  );

  return (
    <div className="onboarding-scope min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{aside}</aside>

      <div className="flex min-w-0 flex-col">
        <PlatformBar />
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-6">
          <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir navegación">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
              <SheetTitle className="sr-only">Navegación</SheetTitle>
              {aside}
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold md:text-lg">{context.titulo}</h1>
            <p className="truncate text-xs text-muted-foreground">{context.subtitulo}</p>
          </div>

          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 text-muted-foreground md:flex"
          >
            <Search className="size-4" aria-hidden /> Buscar
            <kbd className="ml-2 rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="md:hidden" aria-label="Buscar">
            <Search className="size-5" />
          </Button>
          <Link to="/portal/notificaciones" aria-label="Notificaciones" className="relative rounded-md p-2 hover:bg-muted">
            <Bell className="size-5" aria-hidden />
            {unread > 0 ? <Badge className="absolute -top-0.5 -right-0.5 size-4 justify-center rounded-full p-0 text-[10px]">{unread}</Badge> : null}
          </Link>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:py-8">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
