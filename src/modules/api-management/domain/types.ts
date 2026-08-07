/**
 * API Management — Dominio (tipos compartidos cliente/servidor).
 *
 * Este archivo NO debe importar nada del servidor. Contiene únicamente
 * tipos, constantes y utilidades puras reutilizables por la UI de
 * administración y por la capa HTTP de la API pública.
 */

export const API_KEY_STATUSES = ["active", "suspended", "revoked", "expired"] as const;
export type ApiKeyStatus = (typeof API_KEY_STATUSES)[number];

export const API_USER_STATUSES = [
  "active",
  "suspended",
  "pending",
  "blocked",
  "deleted",
] as const;
export type ApiUserStatus = (typeof API_USER_STATUSES)[number];

export const API_VERSION_STATUSES = ["active", "deprecated", "disabled"] as const;
export type ApiVersionStatus = (typeof API_VERSION_STATUSES)[number];

export const API_LOG_LEVELS = ["info", "warning", "error", "critical"] as const;
export type ApiLogLevel = (typeof API_LOG_LEVELS)[number];

export const API_KEY_STATUS_LABEL: Record<ApiKeyStatus, string> = {
  active: "Activa",
  suspended: "Suspendida",
  revoked: "Revocada",
  expired: "Expirada",
};

export const API_USER_STATUS_LABEL: Record<ApiUserStatus, string> = {
  active: "Activo",
  suspended: "Suspendido",
  pending: "Pendiente de activación",
  blocked: "Bloqueado",
  deleted: "Eliminado",
};

export const API_VERSION_STATUS_LABEL: Record<ApiVersionStatus, string> = {
  active: "Activa",
  deprecated: "Obsoleta",
  disabled: "Deshabilitada",
};

export const API_LOG_LEVEL_LABEL: Record<ApiLogLevel, string> = {
  info: "Información",
  warning: "Advertencia",
  error: "Error",
  critical: "Crítico",
};

/** Códigos de error normalizados devueltos por la API pública. */
export const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  KEY_SUSPENDED: "KEY_SUSPENDED",
  KEY_REVOKED: "KEY_REVOKED",
  KEY_EXPIRED: "KEY_EXPIRED",
  VERSION_DISABLED: "VERSION_DISABLED",
  VERSION_NOT_FOUND: "VERSION_NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export const API_ERROR_CATALOG: Array<{ code: ApiErrorCode; status: number; meaning: string }> = [
  { code: "UNAUTHORIZED", status: 401, meaning: "Falta la cabecera x-api-key o la clave no existe." },
  { code: "FORBIDDEN", status: 403, meaning: "La clave no tiene el permiso requerido por el endpoint." },
  { code: "KEY_SUSPENDED", status: 403, meaning: "La API Key está suspendida temporalmente." },
  { code: "KEY_REVOKED", status: 403, meaning: "La API Key ha sido revocada de forma permanente." },
  { code: "KEY_EXPIRED", status: 403, meaning: "La API Key ha expirado." },
  { code: "VERSION_DISABLED", status: 410, meaning: "La versión de API solicitada está deshabilitada." },
  { code: "VERSION_NOT_FOUND", status: 404, meaning: "La versión de API solicitada no existe." },
  { code: "RATE_LIMITED", status: 429, meaning: "Se ha superado el límite de llamadas configurado." },
  { code: "VALIDATION_ERROR", status: 422, meaning: "El cuerpo o los parámetros no cumplen el contrato." },
  { code: "NOT_FOUND", status: 404, meaning: "El recurso solicitado no existe." },
  { code: "CONFLICT", status: 409, meaning: "El recurso ya existe o el estado no permite la operación." },
  { code: "METHOD_NOT_ALLOWED", status: 405, meaning: "Método HTTP no soportado por el endpoint." },
  { code: "INTERNAL_ERROR", status: 500, meaning: "Error interno. Se registra con un requestId para soporte." },
];

/** Sobre de respuesta uniforme para todas las respuestas de la API. */
export interface ApiEnvelopeSuccess<T> {
  success: true;
  data: T;
  requestId: string;
  timestamp: string;
  version: string;
}

export interface ApiEnvelopeError {
  success: false;
  errorCode: ApiErrorCode;
  message: string;
  requestId: string;
  timestamp: string;
  version: string;
  details?: unknown;
}

export type ApiEnvelope<T> = ApiEnvelopeSuccess<T> | ApiEnvelopeError;

export function maskKey(prefix: string, last4: string): string {
  return `${prefix}${"•".repeat(16)}${last4}`;
}
