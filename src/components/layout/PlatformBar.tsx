import { Link } from "@tanstack/react-router";

/** Menú común entre módulos de la plataforma. Los menús internos no cambian. */
const MODULES = [
  { to: "/admin", label: "Gestión API" },
  { to: "/aprovisionamiento", label: "Aprovisionamiento" },
  { to: "/portal", label: "Portal cliente" },
  { to: "/integraciones", label: "Integraciones" },
] as const;

export function PlatformBar() {
  return (
    <nav
      aria-label="Módulos de la plataforma"
      className="flex gap-1 overflow-x-auto border-b border-border bg-muted/60 px-3 py-1.5 text-xs"
    >
      {MODULES.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="whitespace-nowrap rounded px-2.5 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-background data-[status=active]:font-medium data-[status=active]:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
