import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { provisioningRequests, portalUsers, subscriptions, invoices } from "@/lib/domain/seed";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paginas = [
  { label: "Aprovisionamiento · Panel", to: "/aprovisionamiento" },
  { label: "Aprovisionamiento · Solicitudes", to: "/aprovisionamiento/solicitudes" },
  { label: "Aprovisionamiento · Motor de reglas", to: "/aprovisionamiento/reglas" },
  { label: "Aprovisionamiento · Conectores", to: "/aprovisionamiento/conectores" },
  { label: "Aprovisionamiento · Historial y auditoría", to: "/aprovisionamiento/historial" },
  { label: "Portal · Inicio", to: "/portal" },
  { label: "Portal · Usuarios", to: "/portal/usuarios" },
  { label: "Portal · Aplicaciones", to: "/portal/aplicaciones" },
  { label: "Portal · Consumo", to: "/portal/consumo" },
  { label: "Portal · Facturación", to: "/portal/facturacion" },
  { label: "Portal · Documentación", to: "/portal/documentos" },
  { label: "Portal · Soporte", to: "/portal/soporte" },
  { label: "Portal · Perfil de empresa", to: "/portal/perfil" },
  { label: "Portal · Seguridad", to: "/portal/seguridad" },
  { label: "Portal · Notificaciones", to: "/portal/notificaciones" },
  { label: "Contratos de integración", to: "/integraciones" },
] as const;

export function GlobalSearch({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar páginas, solicitudes, usuarios, facturas…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {paginas.map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Solicitudes de aprovisionamiento">
          {provisioningRequests.map((r) => (
            <CommandItem
              key={r.id}
              value={`${r.referencia} ${r.organizacion} ${r.aplicacion}`}
              onSelect={() => go(`/aprovisionamiento/solicitudes/${r.id}`)}
            >
              {r.referencia} · {r.organizacion} · {r.aplicacion}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Usuarios del cliente">
          {portalUsers.map((u) => (
            <CommandItem key={u.id} value={`${u.nombre} ${u.email}`} onSelect={() => go("/portal/usuarios")}>
              {u.nombre} · {u.email}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Aplicaciones y facturas">
          {subscriptions.map((s) => (
            <CommandItem key={s.id} value={s.aplicacion} onSelect={() => go("/portal/aplicaciones")}>
              {s.aplicacion} · {s.licenciasUsadas}/{s.licenciasTotales} licencias
            </CommandItem>
          ))}
          {invoices.map((i) => (
            <CommandItem key={i.id} value={i.numero} onSelect={() => go("/portal/facturacion")}>
              {i.numero} · {i.estado}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
