/**
 * API Management — Pasarela HTTP.
 *
 * Envuelve cada endpoint público: valida versión, API Key, permisos y
 * límites de uso; normaliza la respuesta; y registra log y tiempos.
 * Ningún endpoint debe implementar esta lógica por su cuenta.
 */
import { randomUUID } from "node:crypto";

import { API_ERROR_CODES, type ApiEnvelope, type ApiLogLevel } from "../domain/types";

import { ApiError } from "./errors.server";
import { extractApiKey, hashApiKey } from "./keys.server";
import {
  findApiKeyByHash,
  findVersion,
  insertRequestLog,
  markKeyExpired,
  markKeyUsed,
  registerRateHit,
  type ApiKeyRecord,
} from "./repositories.server";

export interface ApiRequestContext {
  requestId: string;
  version: string;
  apiKey: ApiKeyRecord;
  request: Request;
  params: Record<string, string>;
  /** Cuerpo JSON validado o null si no hay cuerpo. */
  body: unknown;
  /** Parámetros de consulta. */
  query: URLSearchParams;
}

export interface HandlerResult {
  status?: number;
  data: unknown;
}

export interface EndpointOptions {
  version: string;
  endpoint: string;
  permission: string | null;
  handler: (context: ApiRequestContext) => Promise<HandlerResult>;
}

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function levelForStatus(status: number): ApiLogLevel {
  if (status >= 500) return "critical";
  if (status >= 400) return "error";
  return "info";
}

function windowStart(kind: "minute" | "hour" | "day"): Date {
  const now = new Date();
  if (kind === "minute") now.setSeconds(0, 0);
  if (kind === "hour") now.setMinutes(0, 0, 0);
  if (kind === "day") now.setHours(0, 0, 0, 0);
  return now;
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("cf-connecting-ip") ?? null;
}

async function enforceRateLimits(apiKey: ApiKeyRecord): Promise<void> {
  const limits: Array<[("minute" | "hour" | "day"), number]> = [
    ["minute", apiKey.rateLimitPerMinute],
    ["hour", apiKey.rateLimitPerHour],
    ["day", apiKey.rateLimitPerDay],
  ];
  for (const [kind, limit] of limits) {
    const hits = await registerRateHit(apiKey.id, kind, windowStart(kind));
    if (hits > limit) {
      throw ApiError.rateLimited(`Límite de ${limit} llamadas por ${kind === "minute" ? "minuto" : kind === "hour" ? "hora" : "día"} superado`);
    }
  }
}

async function authenticate(request: Request, version: string): Promise<ApiKeyRecord> {
  const raw = extractApiKey(request);
  if (!raw) throw ApiError.unauthorized("Falta la cabecera x-api-key");
  if (raw.length > 200) throw ApiError.unauthorized();

  const apiKey = await findApiKeyByHash(hashApiKey(raw));
  if (!apiKey) throw ApiError.unauthorized();

  if (apiKey.status === "revoked") {
    throw new ApiError(API_ERROR_CODES.KEY_REVOKED, 403, "La API Key ha sido revocada");
  }
  if (apiKey.status === "suspended") {
    throw new ApiError(API_ERROR_CODES.KEY_SUSPENDED, 403, "La API Key está suspendida");
  }
  if (apiKey.expiresAt && new Date(apiKey.expiresAt).getTime() < Date.now()) {
    if (apiKey.status !== "expired") await markKeyExpired(apiKey.id);
    throw new ApiError(API_ERROR_CODES.KEY_EXPIRED, 403, "La API Key ha expirado");
  }
  if (apiKey.status === "expired") {
    throw new ApiError(API_ERROR_CODES.KEY_EXPIRED, 403, "La API Key ha expirado");
  }
  if (apiKey.allowedVersions.length > 0 && !apiKey.allowedVersions.includes(version)) {
    throw ApiError.forbidden(`La API Key no tiene acceso a la versión ${version}`);
  }
  return apiKey;
}

async function assertVersion(version: string): Promise<void> {
  const record = await findVersion(version);
  if (!record) {
    throw new ApiError(API_ERROR_CODES.VERSION_NOT_FOUND, 404, `Versión ${version} no encontrada`);
  }
  if (record.status === "disabled") {
    throw new ApiError(
      API_ERROR_CODES.VERSION_DISABLED,
      410,
      `La versión ${version} está deshabilitada`,
    );
  }
}

async function readJsonBody(request: Request): Promise<{ body: unknown; bytes: number }> {
  if (request.method === "GET" || request.method === "DELETE") return { body: null, bytes: 0 };
  const text = await request.text();
  if (!text) return { body: null, bytes: 0 };
  if (text.length > 100_000) throw ApiError.validation("El cuerpo de la petición es demasiado grande");
  try {
    return { body: JSON.parse(text), bytes: text.length };
  } catch {
    throw ApiError.validation("El cuerpo de la petición no es JSON válido");
  }
}

/**
 * Crea un manejador HTTP con toda la seguridad, trazabilidad y formato
 * de respuesta del módulo API Management aplicados.
 */
export function createApiEndpoint(options: EndpointOptions) {
  return async ({
    request,
    params,
  }: {
    request: Request;
    params: Record<string, string>;
  }): Promise<Response> => {
    const startedAt = Date.now();
    const requestId = `req_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
    const url = new URL(request.url);
    let apiKey: ApiKeyRecord | null = null;
    let requestBytes = 0;

    const respond = async (envelope: ApiEnvelope<unknown>, status: number, outcome: string) => {
      const payload = JSON.stringify(envelope);
      await insertRequestLog({
        requestId,
        endpoint: options.endpoint,
        apiVersion: options.version,
        httpMethod: request.method,
        applicationName: apiKey?.applicationName ?? null,
        apiKeyId: apiKey?.id ?? null,
        apiKeyPrefix: apiKey?.keyPrefix ?? null,
        apiUserId: null,
        sourceIp: clientIp(request),
        durationMs: Date.now() - startedAt,
        statusCode: status,
        outcome,
        message: envelope.success ? "OK" : envelope.message,
        requestBytes,
        responseBytes: payload.length,
        level: levelForStatus(status),
      });
      return new Response(payload, { status, headers: JSON_HEADERS });
    };

    try {
      await assertVersion(options.version);
      apiKey = await authenticate(request, options.version);
      await enforceRateLimits(apiKey);

      if (options.permission && !apiKey.permissions.includes(options.permission)) {
        throw ApiError.forbidden(`Se requiere el permiso ${options.permission}`);
      }

      const parsed = await readJsonBody(request);
      requestBytes = parsed.bytes;

      const result = await options.handler({
        requestId,
        version: options.version,
        apiKey,
        request,
        params,
        body: parsed.body,
        query: url.searchParams,
      });

      void markKeyUsed(apiKey.id);

      return await respond(
        {
          success: true,
          data: result.data,
          requestId,
          timestamp: new Date().toISOString(),
          version: options.version,
        },
        result.status ?? 200,
        "success",
      );
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : (console.error(`[api-management] ${requestId}`, error), ApiError.internal());

      return await respond(
        {
          success: false,
          errorCode: apiError.code,
          message: apiError.message,
          requestId,
          timestamp: new Date().toISOString(),
          version: options.version,
          ...(apiError.details ? { details: apiError.details } : {}),
        },
        apiError.status,
        "error",
      );
    }
  };
}

/** Manejador uniforme para métodos no soportados en una ruta existente. */
export function methodNotAllowed(version: string) {
  return async (): Promise<Response> =>
    new Response(
      JSON.stringify({
        success: false,
        errorCode: API_ERROR_CODES.METHOD_NOT_ALLOWED,
        message: "Método no permitido",
        requestId: `req_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
        timestamp: new Date().toISOString(),
        version,
      }),
      { status: 405, headers: JSON_HEADERS },
    );
}
