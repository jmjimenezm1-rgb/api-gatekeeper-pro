import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "API Management — Plataforma de gestión de API" },
      {
        name: "description",
        content:
          "Plataforma de gestión de API: claves, versionado, roles, permisos, límites de uso, logs y auditoría con panel de administración en español.",
      },
      { property: "og:title", content: "API Management — Plataforma de gestión de API" },
      {
        property: "og:description",
        content:
          "Gobierna tu API: claves con permisos, versionado, límites de uso, trazabilidad completa y documentación OpenAPI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    title: "Claves de API con permisos",
    body: "Emisión, rotación, suspensión y revocación de claves con permisos y límites por minuto, hora y día.",
  },
  {
    title: "Versionado real",
    body: "Rutas /api/public/v1/* con estados activa, obsoleta o deshabilitada y fecha de retirada.",
  },
  {
    title: "Usuarios, roles y permisos",
    body: "Gestión de usuarios externos, asignación de roles y consulta de permisos efectivos.",
  },
  {
    title: "Trazabilidad y auditoría",
    body: "Registro de cada petición con requestId, duración y resultado, más auditoría inmutable de cambios.",
  },
];

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Plataforma interna
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Gestión profesional de tu API
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Autenticación por API Key, versionado, control de acceso por roles y permisos, límites de
          uso, logs y auditoría. Todo gobernado desde un panel de administración.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/admin">Entrar al panel</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/api/public/openapi.json" target="_blank" rel="noreferrer">
              Ver especificación OpenAPI
            </a>
          </Button>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
