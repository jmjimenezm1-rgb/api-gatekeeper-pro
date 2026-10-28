import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { diagnoseFailedRequest } from "@/modules/api-management/admin/admin.functions";
import { PageHeader } from "@/modules/api-management/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/diagnose")({
  component: DiagnosePage,
});

const REQUEST_PLACEHOLDER = `GET /api/public/v2/users/usr_123/permissions
x-api-key: ak_live_…`;

const RESPONSE_PLACEHOLDER = `{
  "success": false,
  "errorCode": "FORBIDDEN",
  "message": "Se requiere el permiso users:read",
  "requestId": "req_…",
  "timestamp": "2026-10-28T07:00:00.000Z",
  "version": "v2"
}`;

function DiagnosePage() {
  const runDiagnose = useServerFn(diagnoseFailedRequest);
  const [requestText, setRequestText] = useState("");
  const [responseText, setResponseText] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleDiagnose() {
    setPending(true);
    setExplanation(null);
    try {
      const result = await runDiagnose({
        data: { request: requestText, response: responseText },
      });
      setExplanation(result.explanation);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se ha podido generar el diagnóstico");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnóstico de peticiones"
        description="Pega una petición fallida de la API v2 y su respuesta. La IA explica las causas probables y cómo solucionarlas."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="diagnose-request">Petición</Label>
          <Textarea
            id="diagnose-request"
            value={requestText}
            onChange={(event) => setRequestText(event.target.value)}
            placeholder={REQUEST_PLACEHOLDER}
            className="min-h-48 font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="diagnose-response">Respuesta</Label>
          <Textarea
            id="diagnose-response"
            value={responseText}
            onChange={(event) => setResponseText(event.target.value)}
            placeholder={RESPONSE_PLACEHOLDER}
            className="min-h-48 font-mono text-xs"
          />
        </div>
      </div>

      <Button
        onClick={handleDiagnose}
        disabled={pending || !requestText.trim() || !responseText.trim()}
      >
        {pending ? "Analizando…" : "Explicar"}
      </Button>

      {explanation ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Diagnóstico</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {explanation}
          </div>
        </section>
      ) : null}
    </div>
  );
}
