/**
 * Capa de simulación (mock services) de los módulos externos.
 * Cada adaptador implementa un puerto de `ports.ts` con latencia simulada.
 */

import {
  documents as seedDocuments,
  invoices as seedInvoices,
  subscriptions as seedSubscriptions,
  tickets as seedTickets,
  usageSeries,
} from "../domain/seed";
import type { Ticket } from "../domain/types";
import { publish } from "./event-bus";
import type { PlatformPorts } from "./ports";
import { createDemoPdf } from "./demo-pdf";

const wait = (ms = 220) => new Promise<void>((r) => setTimeout(r, ms));

let tickets: Ticket[] = seedTickets.map((t) => ({ ...t, mensajes: [...t.mensajes] }));

export const mockPorts: PlatformPorts = {
  subscriptions: {
    async listByTenant() {
      await wait();
      return seedSubscriptions;
    },
    async requestChange(input) {
      await wait();
      const referencia = `SUS-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      publish("suscripciones.cambio.solicitado", { ...input, referencia }, { emisor: "portal-cliente", tenantId: input.tenantId });
      return { referencia, estado: "recibida" };
    },
  },
  billing: {
    async listInvoices() {
      await wait();
      return seedInvoices;
    },
    async getInvoicePdfUrl(tenantId, invoiceId) {
      await wait(120);
      const invoice = seedInvoices.find((item) => item.id === invoiceId);
      if (!invoice) throw new Error("Factura no encontrada");
      return createDemoPdf(`Factura ${invoice.numero}`, [
        `Empresa: ${tenantId}`, `Fecha: ${invoice.fecha}`, `Vencimiento: ${invoice.vencimiento}`,
        `Base: ${invoice.importe.toFixed(2)} EUR`, `Impuestos: ${invoice.impuestos.toFixed(2)} EUR`,
        `Total: ${(invoice.importe + invoice.impuestos).toFixed(2)} EUR`,
        `Estado: ${invoice.estado}`, `Metodo de pago: ${invoice.metodoPago}`,
      ]);
    },
    async getPaymentMethod() {
      await wait(120);
      return { tipo: "Domiciliación SEPA", detalle: "ES·· 4471", predeterminado: true };
    },
  },
  support: {
    async listTickets() {
      await wait();
      return tickets;
    },
    async createTicket(input) {
      await wait();
      const nuevo: Ticket = {
        id: `tk_${Math.random().toString(36).slice(2, 8)}`,
        referencia: `SOP-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
        asunto: input.asunto,
        aplicacion: input.aplicacion,
        prioridad: input.prioridad,
        estado: "abierta",
        creadaEn: new Date().toISOString(),
        mensajes: [
          { id: "m1", autor: "Tú", interno: false, fecha: new Date().toISOString(), cuerpo: input.cuerpo, adjuntos: [] },
        ],
      };
      tickets = [nuevo, ...tickets];
      publish("soporte.incidencia.creada", nuevo, { emisor: "portal-cliente", tenantId: input.tenantId });
      return nuevo;
    },
    async reply(input) {
      await wait(160);
      tickets = tickets.map((t) =>
        t.id === input.ticketId
          ? {
              ...t,
              estado: "en_curso",
              mensajes: [
                ...t.mensajes,
                {
                  id: `m${t.mensajes.length + 1}`,
                  autor: "Tú",
                  interno: false,
                  fecha: new Date().toISOString(),
                  cuerpo: input.cuerpo,
                  adjuntos: input.adjuntos ?? [],
                },
              ],
            }
          : t,
      );
      const ticket = tickets.find((t) => t.id === input.ticketId);
      if (!ticket) throw new Error("Incidencia no encontrada");
      return ticket;
    },
  },
  documents: {
    async list() {
      await wait();
      return seedDocuments;
    },
    async getPdfUrl(tenantId, documentId) {
      const item = seedDocuments.find((document) => document.id === documentId);
      if (!item) throw new Error("Documento no encontrado");
      return createDemoPdf(item.nombre, [
        `Empresa: ${tenantId}`, `Categoria: ${item.tipo}`, `Actualizado: ${item.actualizadoEn}`,
        "Este archivo demuestra la descarga del portal. El documento original lo proporcionara el servicio de Contratos.",
      ]);
    },
  },
  usage: {
    async series() {
      await wait();
      return usageSeries;
    },
  },
  crm: {
    async notifyProvisioningResult(input) {
      publish("crm.aprovisionamiento.resultado", input, { emisor: "aprovisionamiento", tenantId: input.tenantId });
    },
  },
  audit: {
    async record(input) {
      publish("auditoria.registro", input, { emisor: "core", tenantId: input.tenantId });
    },
  },
  accounting: {
    async postProvisioningEvent(input) {
      publish("contabilidad.apunte.solicitado", input, { emisor: "aprovisionamiento", tenantId: input.tenantId });
    },
  },
};

/** Punto único de inyección: cambiar aquí por los adaptadores reales. */
export const platform: PlatformPorts = mockPorts;
