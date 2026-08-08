/**
 * API Management — Componentes compartidos del panel de administración.
 */
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

const TONE_CLASS: Record<string, string> = {
  ok: "border-transparent bg-primary/10 text-primary",
  warn: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "border-transparent bg-destructive/10 text-destructive",
  muted: "border-transparent bg-muted text-muted-foreground",
};

export function StateBadge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: keyof typeof TONE_CLASS;
}) {
  return <Badge className={cn("font-medium", TONE_CLASS[tone])}>{label}</Badge>;
}

export function toneForStatus(status: string): keyof typeof TONE_CLASS {
  if (["active", "activa", "activo", "info", "success"].includes(status)) return "ok";
  if (["pending", "suspended", "deprecated", "warning"].includes(status)) return "warn";
  if (["revoked", "expired", "blocked", "deleted", "disabled", "error", "critical"].includes(status))
    return "danger";
  return "muted";
}

export function DataTable<T>({
  columns,
  rows,
  empty = "Sin registros",
  rowKey,
}: {
  columns: Array<{ header: string; cell: (row: T) => ReactNode; className?: string }>;
  rows: T[];
  empty?: string;
  rowKey: (row: T, index: number) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.header} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={rowKey(row, index)}>
                {columns.map((column) => (
                  <TableCell key={column.header} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function formatDateTime(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export function formatDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", { dateStyle: "medium" });
}

export function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function BarList({
  items,
  emptyLabel = "Sin datos en el periodo",
}: {
  items: Array<{ key: string | number; count: number }>;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.count));
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={String(item.key)} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-foreground">{String(item.key)}</span>
            <span className="tabular-nums text-muted-foreground">{item.count}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
