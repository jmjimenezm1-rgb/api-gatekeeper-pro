/**
 * Puertos (interfaces) de los módulos que aún no existen.
 * Aprovisionamiento y Portal del Cliente solo dependen de estas interfaces:
 * para integrar la plataforma real basta sustituir la implementación mock
 * en `src/lib/integration/mock-adapters.ts` sin tocar la lógica interna.
 */

import type { DocumentItem, Invoice, Subscription, Ticket, UsagePoint } from "../domain/types";

export interface SubscriptionsPort {
  listByTenant(tenantId: string): Promise<Subscription[]>;
  requestChange(input: {
    tenantId: string;
    aplicacionId: string;
    tipo: "ampliacion" | "reduccion" | "alta" | "baja";
    licencias?: number;
    nota?: string;
  }): Promise<{ referencia: string; estado: "recibida" }>;
}

export interface BillingPort {
  listInvoices(tenantId: string): Promise<Invoice[]>;
  getInvoicePdfUrl(tenantId: string, invoiceId: string): Promise<string>;
  getPaymentMethod(tenantId: string): Promise<{ tipo: string; detalle: string; predeterminado: boolean }>;
}

export interface SupportPort {
  listTickets(tenantId: string): Promise<Ticket[]>;
  createTicket(input: { tenantId: string; asunto: string; aplicacion: string; prioridad: Ticket["prioridad"]; cuerpo: string }): Promise<Ticket>;
  reply(input: { tenantId: string; ticketId: string; cuerpo: string; adjuntos?: string[] }): Promise<Ticket>;
}

export interface DocumentsPort {
  list(tenantId: string): Promise<DocumentItem[]>;
  getPdfUrl(tenantId: string, documentId: string): Promise<string>;
}

export interface UsagePort {
  series(tenantId: string, rango: "dia" | "mes"): Promise<UsagePoint[]>;
}

export interface CrmPort {
  notifyProvisioningResult(input: { tenantId: string; referencia: string; resultado: string }): Promise<void>;
}

export interface AuditPort {
  record(input: { actor: string; accion: string; entidad: string; tenantId: string; detalle: string }): Promise<void>;
}

export interface AccountingPort {
  postProvisioningEvent(input: { tenantId: string; referencia: string; importe?: number }): Promise<void>;
}

export interface PlatformPorts {
  subscriptions: SubscriptionsPort;
  billing: BillingPort;
  support: SupportPort;
  documents: DocumentsPort;
  usage: UsagePort;
  crm: CrmPort;
  audit: AuditPort;
  accounting: AccountingPort;
}
