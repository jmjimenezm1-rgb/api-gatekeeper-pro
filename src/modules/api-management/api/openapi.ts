/**
 * API Management — Generador de especificación OpenAPI 3.1.
 * Puro y sin dependencias de servidor: se usa tanto en la ruta pública
 * /api/public/openapi.json como en el visor de documentación del panel.
 */
import { API_ERROR_CATALOG } from "../domain/types";

import { endpointsForVersion, type EndpointDefinition } from "./registry";

export interface OpenApiOptions {
  serverUrl: string;
  versions: Array<{ code: string; status: string; sunsetDate?: string | null; title?: string }>;
}

function operationFor(endpoint: EndpointDefinition, version: string) {
  const parameters = [
    ...(endpoint.pathParams ?? []).map((param) => ({
      name: param.name,
      in: "path" as const,
      required: true,
      description: param.description,
      schema: { type: "string" },
    })),
    ...(endpoint.queryParams ?? []).map((param) => ({
      name: param.name,
      in: "query" as const,
      required: param.required ?? false,
      description: param.description,
      schema: { type: "string" },
    })),
  ];

  return {
    tags: [endpoint.module],
    operationId: `${endpoint.operationId}_${version}`,
    summary: endpoint.summary,
    description: `${endpoint.description}\n\nPermiso requerido: ${endpoint.permission ?? "ninguno (solo API Key válida)"}.`,
    security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
    "x-required-permission": endpoint.permission,
    parameters,
    ...(endpoint.requestExample
      ? {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object" },
                example: endpoint.requestExample,
              },
            },
          },
        }
      : {}),
    responses: {
      "200": {
        description: "Operación correcta",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessEnvelope" },
            ...(endpoint.responseExample ? { example: endpoint.responseExample } : {}),
          },
        },
      },
      "401": errorResponse("Falta la API Key o no es válida"),
      "403": errorResponse("Clave sin permisos, suspendida, revocada o expirada"),
      "404": errorResponse("Recurso o versión no encontrada"),
      "422": errorResponse("Datos de entrada no válidos"),
      "429": errorResponse("Límite de llamadas superado"),
      "500": errorResponse("Error interno"),
    },
  };
}

function errorResponse(description: string) {
  return {
    description,
    content: {
      "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
    },
  };
}

export function buildOpenApiDocument(options: OpenApiOptions) {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const version of options.versions) {
    for (const endpoint of endpointsForVersion(version.code)) {
      const fullPath = `/api/public/${version.code}${endpoint.path}`;
      paths[fullPath] = paths[fullPath] ?? {};
      paths[fullPath]![endpoint.method.toLowerCase()] = operationFor(endpoint, version.code);
    }
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "API Management — API pública",
      version: options.versions.map((version) => version.code).join(", ") || "v1",
      description: [
        "API REST segura, versionada y auditada para la gestión de usuarios, roles y permisos.",
        "",
        "## Autenticación",
        "Todas las peticiones requieren la cabecera `x-api-key` con una API Key activa.",
        "Opcionalmente se acepta `Authorization: Bearer <token>` para ampliaciones futuras con JWT.",
        "",
        "## Versionado",
        options.versions
          .map(
            (version) =>
              `- \`${version.code}\` — estado: ${version.status}${version.sunsetDate ? `, retirada prevista: ${version.sunsetDate}` : ""}`,
          )
          .join("\n"),
        "",
        "## Límites de uso",
        "Cada API Key dispone de límites configurables por minuto, hora y día. Al superarlos se devuelve `429` con el código `RATE_LIMITED`.",
        "",
        "## Códigos de error",
        API_ERROR_CATALOG.map((entry) => `- \`${entry.code}\` (${entry.status}): ${entry.meaning}`).join("\n"),
      ].join("\n"),
    },
    servers: [{ url: options.serverUrl, description: "Servidor actual" }],
    tags: [
      { name: "usuarios", description: "Gestión de usuarios" },
      { name: "roles", description: "Roles parametrizables" },
      { name: "permisos", description: "Catálogo de permisos" },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        SuccessEnvelope: {
          type: "object",
          required: ["success", "data", "requestId", "timestamp", "version"],
          properties: {
            success: { type: "boolean", const: true },
            data: {},
            requestId: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            version: { type: "string" },
          },
        },
        ErrorEnvelope: {
          type: "object",
          required: ["success", "errorCode", "message", "requestId", "timestamp", "version"],
          properties: {
            success: { type: "boolean", const: false },
            errorCode: { type: "string", enum: API_ERROR_CATALOG.map((entry) => entry.code) },
            message: { type: "string" },
            requestId: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            version: { type: "string" },
            details: {},
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths,
  };
}
