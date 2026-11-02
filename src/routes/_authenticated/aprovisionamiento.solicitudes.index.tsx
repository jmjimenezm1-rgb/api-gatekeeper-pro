import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard, StatusPill, provisioningStatusMeta } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { applications, tenants } from "@/lib/domain/seed";
import type { ProvisioningOperation, SourceSystem } from "@/lib/domain/types";
import { fmtDateTime, fmtDuration } from "@/lib/format";
import { createRequest, retryRequest } from "@/lib/provisioning/store";
import { useProvisioning } from "@/lib/provisioning/use-provisioning";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/_authenticated/aprovisionamiento/solicitudes/")({
  head: () => pageMeta("Solicitudes de Aprovisionamiento — Nexora", "Consulta y filtra solicitudes por cliente, aplicación, origen, operación y estado."),
  component: Solicitudes,
});

const operaciones: ProvisioningOperation[] = [
  "alta",
  "baja",
  "modificacion",
  "suspension",
  "reactivacion",
  "ampliacion",
  "reduccion",
];
const origenes: SourceSystem[] = ["crm", "clientes", "suscripciones", "api_externa", "integraciones", "automatizaciones", "manual"];

function Solicitudes() {
  const { requests } = useProvisioning();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [operacion, setOperacion] = useState("todas");
  const [origen, setOrigen] = useState("todos");

  const filtradas = useMemo(
    () =>
      requests.filter((r) => {
        const texto = `${r.referencia} ${r.organizacion} ${r.aplicacion} ${r.solicitadoPor}`.toLowerCase();
        return (
          texto.includes(q.toLowerCase()) &&
          (estado === "todos" || r.estado === estado) &&
          (operacion === "todas" || r.operacion === operacion) &&
          (origen === "todos" || r.origen === origen)
        );
      }),
    [requests, q, estado, operacion, origen],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Solicitudes de aprovisionamiento"
        descripcion="Cada solicitud es idempotente y trazable por correlationId. El módulo no gestiona la contratación: únicamente la ejecuta."
        acciones={<NuevaSolicitud />}
      />

      <SectionCard titulo="Filtros avanzados">
        <div className="grid gap-3 px-4 py-4 md:grid-cols-4 md:px-5">
          <div className="md:col-span-1">
            <Label htmlFor="buscar" className="text-xs">
              Búsqueda
            </Label>
            <Input id="buscar" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Referencia, cliente, app…" className="mt-1.5" />
          </div>
          <FiltroSelect etiqueta="Estado" valor={estado} onChange={setEstado} opciones={["todos", ...Object.keys(provisioningStatusMeta)]} />
          <FiltroSelect etiqueta="Operación" valor={operacion} onChange={setOperacion} opciones={["todas", ...operaciones]} />
          <FiltroSelect etiqueta="Origen" valor={origen} onChange={setOrigen} opciones={["todos", ...origenes]} />
        </div>
      </SectionCard>

      <SectionCard titulo={`${filtradas.length} solicitudes`} descripcion="Ordenadas por fecha de creación">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referencia</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Operación</TableHead>
                <TableHead>Aplicación</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Duración</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((r) => {
                const meta = provisioningStatusMeta[r.estado]!;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link to="/aprovisionamiento/solicitudes/$id" params={{ id: r.id }} className="hover:underline">
                        {r.referencia}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{fmtDateTime(r.creadoEn)}</span>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{r.organizacion}</TableCell>
                    <TableCell className="capitalize">{r.operacion}</TableCell>
                    <TableCell>
                      {r.aplicacion}
                      <span className="block text-xs text-muted-foreground">{r.licencias} licencias</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.origen}</TableCell>
                    <TableCell>
                      <StatusPill tono={meta.tono}>{meta.label}</StatusPill>
                    </TableCell>
                    <TableCell className="text-right text-sm">{fmtDuration(r.duracionMs)}</TableCell>
                    <TableCell className="text-right">
                      {r.error?.reintentable ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            retryRequest(r.id);
                            toast.success(`Reintento lanzado para ${r.referencia}`);
                          }}
                        >
                          Reintentar
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" asChild>
                          <Link to="/aprovisionamiento/solicitudes/$id" params={{ id: r.id }}>
                            Detalle
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}

function FiltroSelect({
  etiqueta,
  valor,
  onChange,
  opciones,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: string[];
}) {
  return (
    <div>
      <Label className="text-xs">{etiqueta}</Label>
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger className="mt-1.5 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((o) => (
            <SelectItem key={o} value={o} className="capitalize">
              {o.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NuevaSolicitud() {
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState(tenants[0]!.id);
  const [aplicacionId, setAplicacionId] = useState(applications[0]!.id);
  const [operacion, setOperacion] = useState<ProvisioningOperation>("alta");
  const [licencias, setLicencias] = useState("10");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Aprovisionamiento manual</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva solicitud manual</DialogTitle>
          <DialogDescription>
            Equivale a <code className="text-xs">POST /api/v1/provisioning/requests</code> con origen <code className="text-xs">manual</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label className="text-xs">Cliente / tenant</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.organizacion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Aplicación</Label>
            <Select value={aplicacionId} onValueChange={setAplicacionId}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {applications.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nombre} · v{a.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Operación</Label>
              <Select value={operacion} onValueChange={(v) => setOperacion(v as ProvisioningOperation)}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operaciones.map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lic" className="text-xs">
                Licencias
              </Label>
              <Input id="lic" type="number" min={1} value={licencias} onChange={(e) => setLicencias(e.target.value)} className="mt-1.5" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              const tenant = tenants.find((t) => t.id === tenantId)!;
              const app = applications.find((a) => a.id === aplicacionId)!;
              const nueva = createRequest({
                operacion,
                origen: "manual",
                tenantId: tenant.id,
                organizacion: tenant.organizacion,
                aplicacionId: app.id,
                aplicacion: app.nombre,
                licencias: Number(licencias) || 1,
                solicitadoPor: "admin@plataforma.io",
              });
              setOpen(false);
              toast.success(`Solicitud ${nueva.referencia} creada`, { description: "Evento aprovisionamiento.solicitud.recibida publicado." });
            }}
          >
            Crear solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
