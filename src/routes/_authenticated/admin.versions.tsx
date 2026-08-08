import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { listApiVersions, saveApiVersion } from "@/modules/api-management/admin/admin.functions";
import { DataTable, formatDate, PageHeader, StateBadge, toneForStatus } from "@/modules/api-management/admin/ui";
import {
  API_VERSION_STATUSES,
  API_VERSION_STATUS_LABEL,
  type ApiVersionStatus,
} from "@/modules/api-management/domain/types";

export const Route = createFileRoute("/_authenticated/admin/versions")({
  component: VersionsPage,
});

type VersionRow = {
  id: string;
  code: string;
  title: string;
  status: ApiVersionStatus;
  sunset_date: string | null;
  notes: string | null;
};

type FormState = {
  id?: string;
  code: string;
  title: string;
  status: ApiVersionStatus;
  sunsetDate: string;
  notes: string;
};

const EMPTY: FormState = { code: "", title: "", status: "active", sunsetDate: "", notes: "" };

function VersionsPage() {
  const queryClient = useQueryClient();
  const fetchVersions = useServerFn(listApiVersions);
  const save = useServerFn(saveApiVersion);
  const versions = useQuery({ queryKey: ["admin", "versions"], queryFn: () => fetchVersions() });
  const [form, setForm] = useState<FormState | null>(null);

  const mutation = useMutation({
    mutationFn: (input: FormState) =>
      save({
        data: {
          ...(input.id ? { id: input.id } : {}),
          code: input.code,
          title: input.title,
          status: input.status,
          sunsetDate: input.sunsetDate || null,
          notes: input.notes || null,
        },
      }),
    onSuccess: () => {
      toast.success("Versión guardada");
      setForm(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "versions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Versiones de la API"
        description="Ciclo de vida de cada versión: activa, obsoleta o deshabilitada, con fecha de retirada y notas de migración."
        actions={<Button onClick={() => setForm(EMPTY)}>Nueva versión</Button>}
      />

      <DataTable<VersionRow>
        rows={(versions.data ?? []) as unknown as VersionRow[]}
        rowKey={(row) => row.id}
        empty="No hay versiones definidas"
        columns={[
          { header: "Código", cell: (row) => <span className="font-mono">{row.code}</span> },
          { header: "Título", cell: (row) => row.title || "—" },
          {
            header: "Estado",
            cell: (row) => (
              <StateBadge
                label={API_VERSION_STATUS_LABEL[row.status] ?? row.status}
                tone={toneForStatus(row.status)}
              />
            ),
          },
          { header: "Retirada", cell: (row) => formatDate(row.sunset_date) },
          {
            header: "Notas",
            cell: (row) => <span className="text-xs text-muted-foreground">{row.notes ?? "—"}</span>,
          },
          {
            header: "Acciones",
            cell: (row) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm({
                    id: row.id,
                    code: row.code,
                    title: row.title,
                    status: row.status,
                    sunsetDate: row.sunset_date ?? "",
                    notes: row.notes ?? "",
                  })
                }
              >
                Editar
              </Button>
            ),
          },
        ]}
      />

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar versión" : "Nueva versión"}</DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  placeholder="v2"
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(status) => setForm({ ...form, status: status as ApiVersionStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_VERSION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {API_VERSION_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de retirada</Label>
                <Input
                  type="date"
                  value={form.sunsetDate}
                  onChange={(event) => setForm({ ...form, sunsetDate: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas de migración</Label>
                <Textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button
              disabled={mutation.isPending}
              onClick={() => form && mutation.mutate(form)}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
