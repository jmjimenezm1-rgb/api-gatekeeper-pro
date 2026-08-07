/**
 * API Management — Validación de entrada (zod).
 * Compartido entre la capa HTTP pública y la UI de administración.
 */
import { z } from "zod";

import { API_KEY_STATUSES, API_USER_STATUSES, API_VERSION_STATUSES } from "./types";

const trimmedString = (max: number) => z.string().trim().max(max);

export const emailSchema = trimmedString(255)
  .min(3, "Email obligatorio")
  .email("Email no válido");

export const permissionCodeSchema = trimmedString(64).regex(
  /^[a-z0-9]+\.[a-z0-9_]+$/,
  "Formato de permiso no válido (ejemplo: usuarios.leer)",
);

export const createApiUserSchema = z.object({
  email: emailSchema,
  fullName: trimmedString(120).default(""),
  phone: trimmedString(40).optional(),
  externalId: trimmedString(120).optional(),
  status: z.enum(API_USER_STATUSES).default("pending"),
  metadata: z.record(z.unknown()).default({}),
  roles: z.array(trimmedString(80)).max(20).default([]),
});
export type CreateApiUserInput = z.infer<typeof createApiUserSchema>;

export const updateApiUserSchema = z
  .object({
    email: emailSchema.optional(),
    fullName: trimmedString(120).optional(),
    phone: trimmedString(40).optional(),
    externalId: trimmedString(120).optional(),
    metadata: z.record(z.unknown()).optional(),
    reason: trimmedString(500).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No se ha indicado ningún campo a modificar",
  });

export const changeApiUserStatusSchema = z.object({
  status: z.enum(API_USER_STATUSES),
  reason: trimmedString(500).optional(),
  suspendedUntil: z.string().datetime().optional(),
});

export const setApiUserRolesSchema = z.object({
  roles: z.array(trimmedString(80)).max(20),
  reason: trimmedString(500).optional(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(API_USER_STATUSES).optional(),
  search: trimmedString(120).optional(),
});

export const createApiKeySchema = z.object({
  name: trimmedString(120).min(2, "Nombre obligatorio"),
  applicationName: trimmedString(120).default(""),
  companyName: trimmedString(120).default(""),
  contactPerson: trimmedString(120).default(""),
  contactEmail: z.union([emailSchema, z.literal("")]).default(""),
  permissions: z.array(permissionCodeSchema).max(100).default([]),
  allowedVersions: z.array(trimmedString(10)).max(20).default([]),
  rateLimitPerMinute: z.coerce.number().int().min(1).max(100_000),
  rateLimitPerHour: z.coerce.number().int().min(1).max(5_000_000),
  rateLimitPerDay: z.coerce.number().int().min(1).max(50_000_000),
  expiresInDays: z.coerce.number().int().min(1).max(3650).optional(),
});
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export const apiKeyStatusActionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(API_KEY_STATUSES),
  reason: trimmedString(500).optional(),
});

export const upsertVersionSchema = z.object({
  id: z.string().uuid().optional(),
  code: trimmedString(10).regex(/^v[0-9]+$/, "Formato esperado: v1, v2, v3…"),
  title: trimmedString(120).default(""),
  status: z.enum(API_VERSION_STATUSES),
  sunsetDate: z.string().optional().nullable(),
  notes: trimmedString(1000).optional().nullable(),
});

export const upsertRoleSchema = z.object({
  id: z.string().uuid().optional(),
  name: trimmedString(80).min(2, "Nombre obligatorio"),
  description: trimmedString(300).default(""),
  permissions: z.array(permissionCodeSchema).max(200).default([]),
});

export const settingsSchema = z.object({
  apiKeyTtlDays: z.coerce.number().int().min(1).max(3650),
  jwtTtlMinutes: z.coerce.number().int().min(1).max(10_080),
  defaultLimitPerMinute: z.coerce.number().int().min(1).max(100_000),
  defaultLimitPerHour: z.coerce.number().int().min(1).max(5_000_000),
  defaultLimitPerDay: z.coerce.number().int().min(1).max(50_000_000),
  lockoutPolicy: trimmedString(120),
  logRetentionDays: z.coerce.number().int().min(1).max(3650),
  auditRetentionDays: z.coerce.number().int().min(1).max(7300),
  minLogLevel: z.enum(["info", "warning", "error", "critical"]),
  maxResponseMs: z.coerce.number().int().min(50).max(120_000),
  allowHardDeleteUsers: z.boolean(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
