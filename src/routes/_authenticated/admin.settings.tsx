import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getApiSettings, saveApiSettings } from "@/modules/api-management/admin/admin.functions";
import { PageHeader } from "@/modules/api-management/admin/ui";
import {
  API_LOG_LEVELS,
  API_LOG_LEVEL_LABEL,
  type ApiLogLevel,
} from "@/modules/api-management/domain/types";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

type Settings = {
  apiKeyTtlDays: number;
  jwtTtlMinutes: number;
  defaultLimitPerMinute: number;
  defaultLimitPerHour: number;
  defaultLimitPerDay: number;
  lockoutPolicy: string;
  logRetentionDays: number;
  auditRetentionDays: number;
  minLogLevel: ApiLogLevel;
  maxResponseMs: number;
  allowHardDeleteUsers: boolean;
};

const NUMBER_FIELDS: Array<{ key: keyof Settings; label: string; hint?: string }> = [
  { key: "apiKeyTtlDays", label: "Caducidad de claves (días)" },
  { key: "jwtTtlMinutes", label: "Vigencia de tokens (minutos)" },
  { key: "defaultLimitPerMinute", label: "Límite por defecto / minuto" },
  { key: "defaultLimitPerHour", label: "Límite por defecto / hora" },
  { key: "defaultLimitPerDay", label: "Límite por defecto / día" },
  { key: "logRetentionDays", label: "Retención de logs (días)" },
  { key: "auditRetentionDays", label: "Retención de auditoría (días)" },
  { key: "maxResponseMs", label: "Objetivo de respuesta (ms)" },
];

function SettingsPage() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getApiSettings);
  const save = useServerFn(saveApiSettings);
  const query = useQuery({ queryKey: ["admin", "settings"], queryFn: () => fetchSettings() });
  const [form, setForm] = useState<Settings | null>(null);

  useEffect(() => {
    if (query.data) setForm(query.data as Settings);
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (input: Settings) => save({ data: input }),
    onSuccess: () => {
      toast.success("Configuración guardada");
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración global"
        description="Valores por defecto de seguridad, límites de uso, retención de registros y políticas de borrado."
        actions={
          <Button disabled={!form || mutation.isPending} onClick={() => form && mutation.mutate(form)}>
            {mutation.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        }
      />

      {!form ? (
        <p className="text-sm text-muted-foreground">Cargando configuración…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NUMBER_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2 rounded-lg border border-border bg-card p-4">
              <Label>{field.label}</Label>
              <Input
                type="number"
                value={String(form[field.key])}
                onChange={(event) =>
                  setForm({ ...form, [field.key]: Number(event.target.value) } as Settings)
                }
              />
            </div>
          ))}

          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <Label>Política de bloqueo</Label>
            <Input
              value={form.lockoutPolicy}
              onChange={(event) => setForm({ ...form, lockoutPolicy: event.target.value })}
            />
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <Label>Nivel mínimo de registro</Label>
            <Select
              value={form.minLogLevel}
              onValueChange={(value) => setForm({ ...form, minLogLevel: value as ApiLogLevel })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {API_LOG_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {API_LOG_LEVEL_LABEL[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div>
              <Label>Permitir borrado definitivo</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Si está desactivado, los usuarios solo se marcan como eliminados.
              </p>
            </div>
            <Switch
              checked={form.allowHardDeleteUsers}
              onCheckedChange={(checked) => setForm({ ...form, allowHardDeleteUsers: checked })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
