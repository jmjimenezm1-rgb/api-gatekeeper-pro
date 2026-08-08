import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso interno — API Management" },
      {
        name: "description",
        content:
          "Acceso al panel de administración de la plataforma de gestión de API: claves, versiones, roles y auditoría.",
      },
      { property: "og:title", content: "Acceso interno — API Management" },
      {
        property: "og:description",
        content: "Inicia sesión para administrar claves, versiones, roles y auditoría de la API.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/admin", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/admin", replace: true });
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setSentConfirmation(true);
      toast.success("Cuenta creada. Revisa tu correo para confirmarla.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">API Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acceso restringido al equipo de administración.
          </p>
        </div>

        {sentConfirmation ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <h2 className="text-base font-semibold text-foreground">Confirma tu correo</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hemos enviado un enlace de confirmación a <strong>{email}</strong>. Al abrirlo podrás
              acceder al panel.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="signin" className="rounded-lg border border-border bg-card p-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="mt-4 space-y-4" onSubmit={handleSignIn}>
                <Field id="signin-email" label="Correo" type="email" value={email} onChange={setEmail} />
                <Field
                  id="signin-password"
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Accediendo…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="mt-4 space-y-4" onSubmit={handleSignUp}>
                <Field id="signup-email" label="Correo" type="email" value={email} onChange={setEmail} />
                <Field
                  id="signup-password"
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <p className="text-xs text-muted-foreground">
                  La primera cuenta registrada obtiene el rol de administrador; las siguientes
                  quedan como consulta hasta que un administrador las promocione.
                </p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando…" : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete={type === "password" ? "current-password" : "email"}
        required
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
