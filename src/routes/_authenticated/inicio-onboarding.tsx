import { PlatformBar } from "@/components/layout/PlatformBar";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, Building2, GitBranch, ShieldCheck, Workflow } from "lucide-react";

const titulo = "Nexora Platform — Aprovisionamiento y Portal del Cliente";
const descripcion =
  "Plataforma SaaS B2B multiempresa: automatiza el aprovisionamiento de aplicaciones y ofrece a cada cliente un portal de autogestión, con contratos de integración listos para CRM, Suscripciones y Facturación.";

export const Route = createFileRoute("/_authenticated/inicio-onboarding")({
  head: () => ({
    meta: [
      { title: titulo },
      { name: "description", content: descripcion },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descripcion },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const modulos = [
  {
    to: "/aprovisionamiento",
    icono: Workflow,
    nombre: "Módulo de Aprovisionamiento",
    resumen:
      "Convierte una contratación en una cuenta operativa: tenants, usuarios, licencias, permisos, credenciales y límites, con motor de reglas y reintentos.",
    puntos: ["Solicitudes multi-origen", "Motor de reglas sin código", "12 conectores preparados", "Auditoría completa"],
  },
  {
    to: "/portal",
    icono: Building2,
    nombre: "Portal del Cliente",
    resumen:
      "Área privada por tenant para autogestionar usuarios, aplicaciones, consumo, facturación, documentación, soporte, seguridad y notificaciones.",
    puntos: ["Aislamiento estricto por tenant", "6 perfiles configurables", "Consumo en tiempo real", "Solicitudes a Suscripciones"],
  },
];

function Index() {
  return (
    <div className="onboarding-scope min-h-screen">
      <PlatformBar />
      <header className="grid-hero border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Boxes className="size-3.5" aria-hidden /> Fase 1 · 2 de 12 módulos
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-3xl leading-tight font-semibold md:text-5xl">
            Aprovisionamiento automático y autogestión del cliente, listos para integrarse
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">{descripcion}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/aprovisionamiento"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Entrar en Aprovisionamiento <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/portal"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Entrar en el Portal del Cliente
            </Link>
            <Link
              to="/integraciones"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <GitBranch className="size-4" aria-hidden /> Contratos de integración
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-5 md:grid-cols-2">
          {modulos.map((m) => (
            <Link key={m.to} to={m.to} className="surface group flex flex-col p-6 transition-shadow hover:shadow-[var(--shadow-raised)]">
              <m.icono className="size-6 text-primary" aria-hidden />
              <h2 className="mt-4 text-lg font-semibold">{m.nombre}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{m.resumen}</p>
              <ul className="mt-4 grid gap-1.5 text-sm">
                {m.puntos.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden /> {p}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Abrir módulo <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>

        <section className="surface mt-6 p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-5 text-primary" aria-hidden /> Cómo está construido
          </h2>
          <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Multi-tenant", "Aislamiento estricto de datos por tenant y auditoría de toda acción."],
              ["API First", "Cada módulo expone su contrato REST y publica eventos de dominio."],
              ["Desacoplado", "Los módulos externos se consumen a través de puertos e interfaces."],
              ["Mock services", "CRM, Facturación, Cobros, Soporte y BI se simulan para poder demostrar hoy."],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-medium">{t}</dt>
                <dd className="mt-1 text-muted-foreground">{d}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
