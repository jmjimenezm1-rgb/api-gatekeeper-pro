/**
 * API Management — Errores de dominio de la capa API.
 */
import { API_ERROR_CODES, type ApiErrorCode } from "../domain/types";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static unauthorized(message = "API Key no válida o ausente") {
    return new ApiError(API_ERROR_CODES.UNAUTHORIZED, 401, message);
  }

  static forbidden(message = "La API Key no tiene permisos para esta operación") {
    return new ApiError(API_ERROR_CODES.FORBIDDEN, 403, message);
  }

  static notFound(message = "Recurso no encontrado") {
    return new ApiError(API_ERROR_CODES.NOT_FOUND, 404, message);
  }

  static conflict(message = "El estado actual no permite la operación") {
    return new ApiError(API_ERROR_CODES.CONFLICT, 409, message);
  }

  static validation(message = "Datos de entrada no válidos", details?: unknown) {
    return new ApiError(API_ERROR_CODES.VALIDATION_ERROR, 422, message, details);
  }

  static rateLimited(message = "Límite de llamadas superado") {
    return new ApiError(API_ERROR_CODES.RATE_LIMITED, 429, message);
  }

  static internal(message = "Error interno del servidor") {
    return new ApiError(API_ERROR_CODES.INTERNAL_ERROR, 500, message);
  }
}
