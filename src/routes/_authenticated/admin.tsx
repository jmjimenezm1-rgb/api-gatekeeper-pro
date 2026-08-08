import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccess } from "@/modules/api-management/admin/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/admin", label: "Panel", exact: true },
  { to: "/admin/keys", label: "API Keys" },
  { to: "/admin/versions", label: "Versiones" },
  { to: "/admin/users", label: "Usuarios" },
  { to: "/admin/roles", label: "Roles y permisos" },
  { to: "/admin/logs", label: "Logs" },
  { to: "/admin/audit", label: "Auditoría" },
  { to: "/admin/settings", label: "Configuración" },
  { to: "/admin/docs", label: "Documentación" },
];

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchAccess = useServerFn(getMyAccess);
  const { data: access } = useQuery({ queryKey: ["admin", "access"], queryFn: () => fetchAccess() });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/admin" className="text-sm font-semibold tracking-tight text-foreground">
            API Management
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{access?.email}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {access?.isAdmin ? "Administrador" : "Consulta"}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Salir
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-primary/10 data-[status=active]:font-medium data-[status=active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {access && !access.isAdmin ? (
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Tu cuenta tiene permisos de consulta. Las operaciones de escritura requieren rol de
            administrador.
          </p>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
