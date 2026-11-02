import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{titulo}</h2>
        {descripcion ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{descripcion}</p> : null}
      </div>
      {acciones ? <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div> : null}
    </div>
  );
}

export function StatCard({
  etiqueta,
  valor,
  ayuda,
  tono = "neutro",
}: {
  etiqueta: string;
  valor: string | number;
  ayuda?: string;
  tono?: "neutro" | "exito" | "aviso" | "error" | "info";
}) {
  const tonos: Record<string, string> = {
    neutro: "text-foreground",
    exito: "text-success",
    aviso: "text-warning",
    error: "text-destructive",
    info: "text-info",
  };
  return (
    <div className="surface p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{etiqueta}</p>
      <p className={cn("mt-2 font-display text-2xl font-semibold", tonos[tono])}>{valor}</p>
      {ayuda ? <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  );
}

export function SectionCard({
  titulo,
  descripcion,
  acciones,
  children,
  className,
}: {
  titulo?: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface overflow-hidden", className)}>
      {titulo ? (
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3.5 md:px-5">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{titulo}</h3>
            {descripcion ? <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p> : null}
          </div>
          {acciones}
        </header>
      ) : null}
      {children}
    </section>
  );
}

const pillTones: Record<string, string> = {
  exito: "bg-success/12 text-success ring-success/25",
  aviso: "bg-warning/15 text-warning-foreground ring-warning/40",
  error: "bg-destructive/12 text-destructive ring-destructive/25",
  info: "bg-info/12 text-info ring-info/25",
  neutro: "bg-muted text-muted-foreground ring-border",
};

export function StatusPill({
  children,
  tono = "neutro",
  className,
}: {
  children: ReactNode;
  tono?: keyof typeof pillTones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        pillTones[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const provisioningStatusMeta: Record<string, { label: string; tono: keyof typeof pillTones }> = {
  pendiente: { label: "Pendiente", tono: "neutro" },
  en_proceso: { label: "En proceso", tono: "info" },
  esperando_validacion: { label: "Esperando validación", tono: "aviso" },
  completado: { label: "Completado", tono: "exito" },
  completado_parcial: { label: "Completado parcial", tono: "aviso" },
  error: { label: "Error", tono: "error" },
  cancelado: { label: "Cancelado", tono: "neutro" },
  revertido: { label: "Revertido", tono: "neutro" },
};

export function EmptyState({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-medium">{titulo}</p>
      {descripcion ? <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p> : null}
    </div>
  );
}
