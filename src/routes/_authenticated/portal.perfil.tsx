import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentTenant, portalUsers } from "@/lib/domain/seed";
import type { Locale } from "@/lib/domain/types";
import { fmtDate } from "@/lib/format";
import { publish } from "@/lib/integration/event-bus";
import { roleLabels } from "@/lib/portal/permissions";

export const Route = createFileRoute("/_authenticated/portal/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil y empresa — Portal del Cliente" },
      { name: "description", content: "Datos de la empresa, contacto principal, idioma y zona horaria del entorno de tu organización." },
      { property: "og:title", content: "Perfil y empresa — Portal del Cliente" },
      { property: "og:description", content: "Datos de empresa y preferencias regionales del tenant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalPerfil,
});

const locales: Locale[] = ["es-ES", "en-GB", "ca-ES", "pt-PT"];
const zonas = ["Europe/Madrid", "Europe/London", "Atlantic/Canary", "Europe/Lisbon"];

function PortalPerfil() {
  const admin = portalUsers.find((u) => u.rol === "admin_empresa")!;
  const [form, setForm] = useState({
    organizacion: currentTenant.organizacion,
    cif: currentTenant.cif,
    contacto: admin.email,
    telefono: "+34 932 000 100",
    direccion: "Carrer de la Marina 120, 08018 Barcelona",
    locale: currentTenant.locale as Locale,
    zonaHoraria: currentTenant.zonaHoraria,
  });

  function guardar() {
    publish("portal.perfil.actualizado", form, { emisor: "portal-cliente", tenantId: currentTenant.id });
    toast.success("Datos enviados al módulo de Clientes", { description: "Quedan pendientes de validación." });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Perfil y empresa"
        descripcion="Los cambios no se aplican en local: se publican como evento para que el módulo de Clientes los valide."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" titulo="Datos de la empresa">
          <div className="grid gap-4 p-4 sm:grid-cols-2 md:px-5">
            <div className="space-y-1.5">
              <Label htmlFor="organizacion">Razón social</Label>
              <Input id="organizacion" value={form.organizacion} onChange={(e) => setForm({ ...form, organizacion: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cif">CIF / NIF</Label>
              <Input id="cif" value={form.cif} onChange={(e) => setForm({ ...form, cif: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="direccion">Dirección fiscal</Label>
              <Input id="direccion" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contacto">Contacto principal</Label>
              <Input id="contacto" type="email" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="locale">Idioma</Label>
              <select
                id="locale"
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value as Locale })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zona">Zona horaria</Label>
              <select
                id="zona"
                value={form.zonaHoraria}
                onChange={(e) => setForm({ ...form, zonaHoraria: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {zonas.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button onClick={guardar}>Guardar cambios</Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard titulo="Resumen del entorno">
          <dl className="space-y-3 p-4 text-sm md:px-5">
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Identificador de tenant</dt>
              <dd className="mt-0.5 font-mono text-xs">{currentTenant.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Plan</dt>
              <dd className="mt-0.5 font-medium">{currentTenant.plan}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Alta en plataforma</dt>
              <dd className="mt-0.5 font-medium">{fmtDate(currentTenant.creadoEn)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Tu rol</dt>
              <dd className="mt-0.5 font-medium">{roleLabels[admin.rol]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Límites</dt>
              <dd className="mt-0.5 text-muted-foreground">
                {currentTenant.limites.usuarios} usuarios · {currentTenant.limites.almacenamientoGb} GB ·{" "}
                {currentTenant.limites.llamadasApiMes.toLocaleString("es-ES")} llamadas/mes
              </dd>
            </div>
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}
