import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
  listApiVersions,
  listRolesAndPermissions,
  regenerateApiKey,
  setApiKeyStatus,
} from "@/modules/api-management/admin/admin.functions";
import {
  DataTable,
  formatDateTime,
  PageHeader,
  StateBadge,
  toneForStatus,
} from "@/modules/api-management/admin/ui";
import { API_KEY_STATUSES, API_KEY_STATUS_LABEL, maskKey } from "@/modules/api-management/domain/types";

export const Route = createFileRoute("/_authenticated/admin/keys")({
  component: KeysPage,
});

type KeyRow = {
  id: string;
  name: string;
  application_name: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  key_prefix: string;
  key_last4: string;
  status: string;
  permissions: string[];
  allowed_versions: string[];
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  expires_at: string | null;
  last_used_at: string | null;
  suspended_reason: string | null;
};

const EMPTY_FORM = {
  name: "",
  applicationName: "",
  companyName: "",
  contactPerson: "",
  contactEmail: "",
  rateLimitPerMinute: 60,
  rateLimitPerHour: 1000,
  rateLimitPerDay: 10000,
  expiresInDays: 365,
};

function KeysPage() {
  const queryClient = useQueryClient();
  const fetchKeys = useServerFn(listApiKeys);
  const fetchVersions = useServerFn(listApiVersions);
  const fetchRoles = useServerFn(listRolesAndPermissions);
  const create = useServerFn(createApiKey);
  const regenerate = useServerFn(regenerateApiKey);
  const changeStatus = useServerFn(setApiKeyStatus);
  const remove = useServerFn(deleteApiKey);

  const keys = useQuery({ queryKey: ["admin", "keys"], queryFn: () => fetchKeys() });
  const versions = useQuery({ queryKey: ["admin", "versions"], queryFn: () => fetchVersions() });
  const catalog = useQuery({ queryKey: ["admin", "roles"], queryFn: () => fetchRoles() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allowedVersions, setAllowedVersions] = useState<string[]>([]);
  const [secret, setSecret] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "keys"] });

  const createMutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          ...form,
          permissions,
          allowedVersions,
          expiresInDays: form.expiresInDays || undefined,
        },
      }),
    onSuccess: (result) => {
      setSecret(result.secret);
      setOpen(false);
      setForm(EMPTY_FORM);
      setPermissions([]);
      setAllowedVersions([]);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) => regenerate({ data: { id } }),
    onSuccess: (result) => {
      setSecret(result.secret);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: string; reason?: string }) =>
      changeStatus({ data: input as never }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Clave eliminada");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const permissionCatalog = catalog.data?.permissions ?? [];
  const versionCodes = ((versions.data ?? []) as Array<{ code: string }>).map((v) => v.code);

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Emisión, rotación y control del ciclo de vida de las claves de acceso, con permisos, versiones autorizadas y límites de uso."
        actions={<Button onClick={() => setOpen(true)}>Nueva API Key</Button>}
      />

      <DataTable<KeyRow>
        rows={(keys.data ?? []) as unknown as KeyRow[]}
        rowKey={(row) => row.id}
        empty="No hay claves emitidas"
        columns={[
          {
            header: "Clave",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {maskKey(row.key_prefix, row.key_last4)}
                </p>
              </div>
            ),
          },
          {
            header: "Aplicación",
            cell: (row) => (
              <div className="text-sm">
                <p>{row.application_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{row.company_name || "—"}</p>
              </div>
            ),
          },
          {
            header: "Contacto",
            cell: (row) => (
              <div className="text-sm">
                <p>{row.contact_person || "—"}</p>
                <p className="text-xs text-muted-foreground">{row.contact_email || "—"}</p>
              </div>
            ),
          },
          {
            header: "Estado",
            cell: (row) => (
              <StateBadge
                label={API_KEY_STATUS_LABEL[row.status as keyof typeof API_KEY_STATUS_LABEL] ?? row.status}
                tone={toneForStatus(row.status)}
              />
            ),
          },
          {
            header: "Límites",
            cell: (row) => (
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {row.rate_limit_per_minute}/min · {row.rate_limit_per_hour}/h ·{" "}
                {row.rate_limit_per_day}/día
              </span>
            ),
          },
          {
            header: "Permisos",
            cell: (row) => <span className="text-xs">{row.permissions.length}</span>,
          },
          {
            header: "Versiones",
            cell: (row) => (
              <span className="text-xs">
                {row.allowed_versions.length ? row.allowed_versions.join(", ") : "Todas"}
              </span>
            ),
          },
          { header: "Expira", cell: (row) => formatDateTime(row.expires_at) },
          { header: "Último uso", cell: (row) => formatDateTime(row.last_used_at) },
          {
            header: "Acciones",
            cell: (row) => (
              <div className="flex flex-wrap items-center gap-1">
                <Select
                  value={row.status}
                  onValueChange={(status) => statusMutation.mutate({ id: row.id, status })}
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_KEY_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {API_KEY_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateMutation.mutate(row.id)}
                >
                  Rotar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar la clave "${row.name}"?`)) {
                      deleteMutation.mutate(row.id);
                    }
                  }}
                >
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva API Key</DialogTitle>
            <DialogDescription>
              El valor completo de la clave se muestra una única vez tras crearla.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <TextField
              label="Aplicación"
              value={form.applicationName}
              onChange={(v) => setForm({ ...form, applicationName: v })}
            />
            <TextField
              label="Empresa"
              value={form.companyName}
              onChange={(v) => setForm({ ...form, companyName: v })}
            />
            <TextField
              label="Persona de contacto"
              value={form.contactPerson}
              onChange={(v) => setForm({ ...form, contactPerson: v })}
            />
            <TextField
              label="Email de contacto"
              value={form.contactEmail}
              onChange={(v) => setForm({ ...form, contactEmail: v })}
            />
            <NumberField
              label="Días hasta expirar"
              value={form.expiresInDays}
              onChange={(v) => setForm({ ...form, expiresInDays: v })}
            />
            <NumberField
              label="Límite / minuto"
              value={form.rateLimitPerMinute}
              onChange={(v) => setForm({ ...form, rateLimitPerMinute: v })}
            />
            <NumberField
              label="Límite / hora"
              value={form.rateLimitPerHour}
              onChange={(v) => setForm({ ...form, rateLimitPerHour: v })}
            />
            <NumberField
              label="Límite / día"
              value={form.rateLimitPerDay}
              onChange={(v) => setForm({ ...form, rateLimitPerDay: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Permisos</Label>
            <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
              {permissionCatalog.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay permisos definidos.</p>
              ) : (
                permissionCatalog.map((permission) => (
                  <label key={permission.code} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={permissions.includes(permission.code)}
                      onCheckedChange={(checked) =>
                        setPermissions((prev) =>
                          checked ? [...prev, permission.code] : prev.filter((p) => p !== permission.code),
                        )
                      }
                    />
                    <span>
                      <span className="font-mono text-xs">{permission.code}</span>
                      <span className="block text-xs text-muted-foreground">
                        {permission.description}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Versiones autorizadas (vacío = todas)</Label>
            <div className="flex flex-wrap gap-3 rounded-md border border-border p-3">
              {versionCodes.map((code) => (
                <label key={code} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={allowedVersions.includes(code)}
                    onCheckedChange={(checked) =>
                      setAllowedVersions((prev) =>
                        checked ? [...prev, code] : prev.filter((v) => v !== code),
                      )
                    }
                  />
                  {code}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creando…" : "Crear clave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={secret !== null} onOpenChange={() => setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guarda esta clave ahora</DialogTitle>
            <DialogDescription>
              No volverá a mostrarse. Envíala al consumidor por un canal seguro.
            </DialogDescription>
          </DialogHeader>
          <code className="block break-all rounded-md bg-muted p-3 font-mono text-sm">{secret}</code>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (secret) void navigator.clipboard.writeText(secret);
                toast.success("Clave copiada");
              }}
            >
              Copiar
            </Button>
            <Button onClick={() => setSecret(null)}>Hecho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
