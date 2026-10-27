/** Diagnóstico con IA de peticiones fallidas (pasarela de IA de Lovable). */
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createRunIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
    const response = await fetch(input, { ...init, headers });
    runId ??= response.headers.get(RUN_ID_HEADER)?.trim() || undefined;
    return response;
  };
}

const INSTRUCTIONS = `Eres un experto en la API pública v2 de una plataforma de gestión de API.
Reglas de la API: autenticación con cabecera x-api-key; respuestas envueltas en {success, data | errorCode, message, requestId, timestamp, version}.
Códigos de error: UNAUTHORIZED (401, falta o clave inválida), KEY_REVOKED/KEY_SUSPENDED/KEY_EXPIRED (403), FORBIDDEN (403, falta permiso o la clave no permite la versión v2), RATE_LIMITED (429, límite por minuto/hora/día), VALIDATION_ERROR (400/422, cuerpo inválido o JSON mal formado, cuerpo > 100 KB), NOT_FOUND (404), VERSION_NOT_FOUND (404), VERSION_DISABLED (410), METHOD_NOT_ALLOWED (405), INTERNAL_ERROR (500).
Endpoints v2: GET/POST /users, GET/PATCH/DELETE /users/{id}, GET/PATCH /users/{id}/status, GET/PUT /users/{id}/roles, GET /users/{id}/permissions, GET/POST /roles, GET /permissions, GET /versions. Base: /api/public/v2.
Responde en español, en Markdown breve, con secciones: "Qué ha pasado", "Causas probables" (ordenadas por probabilidad) y "Cómo solucionarlo" (pasos concretos, con ejemplo corregido si aplica). Si la clave aparece en el texto, no la repitas.`;

export async function explainFailedRequest(input: { request: string; response: string }) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("La IA no está configurada");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: createRunIdFetch(),
  });
  let failure: unknown = null;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: INSTRUCTIONS,
    messages: [
      {
        role: "user",
        content: `Petición:\n${input.request}\n\nRespuesta:\n${input.response}`,
      },
    ],
    maxRetries: 0,
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  } as Parameters<typeof streamText>[0]);
  const text = await result.text;
  if (failure || !text) {
    const status = (failure as { statusCode?: number } | null)?.statusCode;
    console.error("[api-management] diagnose", failure);
    if (status === 402) throw new Error("No quedan créditos de IA. Añade créditos para seguir usando el diagnóstico.");
    if (status === 429) throw new Error("Demasiadas peticiones a la IA. Espera un momento y vuelve a intentarlo.");
    if (status === 403) throw new Error("El acceso a la IA está bloqueado para este espacio de trabajo.");
    throw new Error("No se ha podido generar el diagnóstico");
  }
  return text;
}
