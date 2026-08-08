import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listManagedUsers,
  setManagedUserStatus,
} from "@/modules/api-management/admin/admin.functions";
import {
  DataTable,
  formatDateTime,
  PageHeader,
  StateBadge,
  toneForStatus,
} from "@/modules/api-management/admin/ui";
import {
  API_USER_STATUSES,
  API_USER_STATUS_LABEL,
  type ApiUserStatus,
} from "@/modules/api-management/domain/types";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  status: ApiUserStatus;
  external_id: string | null;
  phone: string | null;
  status_reason: string | null;
  created_at: string;
  roles: string[];
};

function UsersPage() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listManagedUsers);
  const changeStatus = useServerFn(setManagedUserStatus);
  const users = useQuery({ queryKey: ["admin", "api-users"], queryFn: () => fetchUsers() });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ApiUserStatus>("all");

  const mutation = useMutation({
    mutationFn: (input: { id: string; status: ApiUserStatus }) => changeStatus({ data: input }),
    onSuccess: () => {
      toast.success("Estado del usuario actualizado");
      void queryClient.invalidateQueries({ queryKey: ["admin", "api-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = ((users.data ?? []) as unknown as UserRow[]).filter((row) => {
    const matchesStatus = status === "all" || row.status === status;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      row.email.toLowerCase().includes(term) ||
      (row.full_name ?? "").toLowerCase().includes(term) ||
      (row.external_id ?? "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios de la API"
        description="Usuarios externos creados a través de la API pública. Se pueden activar, suspender, bloquear o marcar como eliminados; cada cambio queda auditado."
      />

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Buscar por email, nombre o ID externo"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {API_USER_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {API_USER_STATUS_LABEL[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable<UserRow>
        rows={rows}
        rowKey={(row) => row.id}
        empty="No hay usuarios registrados"
        columns={[
          {
            header: "Usuario",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          { header: "ID externo", cell: (row) => row.external_id ?? "—" },
          { header: "Teléfono", cell: (row) => row.phone ?? "—" },
          {
            header: "Roles",
            cell: (row) => (
              <span className="text-xs">{row.roles.length ? row.roles.join(", ") : "—"}</span>
            ),
          },
          {
            header: "Estado",
            cell: (row) => (
              <StateBadge label={API_USER_STATUS_LABEL[row.status] ?? row.status} tone={toneForStatus(row.status)} />
            ),
          },
          {
            header: "Motivo",
            cell: (row) => (
              <span className="text-xs text-muted-foreground">{row.status_reason ?? "—"}</span>
            ),
          },
          { header: "Creado", cell: (row) => formatDateTime(row.created_at) },
          {
            header: "Cambiar estado",
            cell: (row) => (
              <Select
                value={row.status}
                onValueChange={(value) =>
                  mutation.mutate({ id: row.id, status: value as ApiUserStatus })
                }
              >
                <SelectTrigger className="h-8 w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {API_USER_STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {API_USER_STATUS_LABEL[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
      />
    </div>
  );
}
