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
  deleteRole,
  listRolesAndPermissions,
  saveRole,
} from "@/modules/api-management/admin/admin.functions";
import { DataTable, PageHeader, StateBadge } from "@/modules/api-management/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  component: RolesPage,
});

type RoleRow = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
};

type FormState = { id?: string; name: string; description: string; permissions: string[] };

const EMPTY: FormState = { name: "", description: "", permissions: [] };

function RolesPage() {
  const queryClient = useQueryClient();
  const fetchCatalog = useServerFn(listRolesAndPermissions);
  const save = useServerFn(saveRole);
  const remove = useServerFn(deleteRole);
  const catalog = useQuery({ queryKey: ["admin", "roles"], queryFn: () => fetchCatalog() });
  const [form, setForm] = useState<FormState | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });

  const saveMutation = useMutation({
    mutationFn: (input: FormState) => save({ data: input }),
    onSuccess: () => {
      toast.success("Rol guardado");
      setForm(null);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Rol eliminado");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const permissions = catalog.data?.permissions ?? [];
  const modules = [...new Set(permissions.map((permission) => permission.module))].sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles y permisos"
        description="Define roles reutilizables y el conjunto de permisos granulares que otorgan. Los roles del sistema no se pueden eliminar."
        actions={<Button onClick={() => setForm(EMPTY)}>Nuevo rol</Button>}
      />

      <DataTable<RoleRow>
        rows={(catalog.data?.roles ?? []) as RoleRow[]}
        rowKey={(row) => row.id}
        empty="No hay roles definidos"
        columns={[
          {
            header: "Rol",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.description || "—"}</p>
              </div>
            ),
          },
          {
            header: "Tipo",
            cell: (row) =>
              row.isSystem ? (
                <StateBadge label="Sistema" tone="warn" />
              ) : (
                <StateBadge label="Personalizado" tone="muted" />
              ),
          },
          {
            header: "Permisos",
            cell: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.permissions.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Ninguno</span>
                ) : (
                  row.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {permission}
                    </span>
                  ))
                )}
              </div>
            ),
          },
          {
            header: "Acciones",
            cell: (row) => (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      id: row.id,
                      name: row.name,
                      description: row.description,
                      permissions: row.permissions,
                    })
                  }
                >
                  Editar
                </Button>
                {row.isSystem ? null : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el rol "${row.name}"?`)) {
                        deleteMutation.mutate(row.id);
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Catálogo de permisos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div key={module} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {module}
              </p>
              <ul className="mt-2 space-y-1">
                {permissions
                  .filter((permission) => permission.module === module)
                  .map((permission) => (
                    <li key={permission.code} className="text-sm">
                      <span className="font-mono text-xs">{permission.code}</span>
                      <span className="block text-xs text-muted-foreground">
                        {permission.description}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar rol" : "Nuevo rol"}</DialogTitle>
            <DialogDescription>
              Selecciona los permisos que otorga este rol a los usuarios asignados.
            </DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Permisos</Label>
                <div className="grid max-h-64 gap-2 overflow-y-auto rounded-md border border-border p-3">
                  {permissions.map((permission) => (
                    <label key={permission.code} className="flex items-start gap-2 text-sm">
                      <Checkbox
                        checked={form.permissions.includes(permission.code)}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            permissions: checked
                              ? [...form.permissions, permission.code]
                              : form.permissions.filter((code) => code !== permission.code),
                          })
                        }
                      />
                      <span>
                        <span className="font-mono text-xs">{permission.code}</span>
                        <span className="block text-xs text-muted-foreground">
                          {permission.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button disabled={saveMutation.isPending} onClick={() => form && saveMutation.mutate(form)}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
