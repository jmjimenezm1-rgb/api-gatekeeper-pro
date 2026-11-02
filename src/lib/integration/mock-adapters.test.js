import { describe, expect, test } from "bun:test";
import { mockPorts } from "./mock-adapters";
import { currentTenant } from "../domain/seed";

describe("demo support flow", () => {
  test("a created ticket and its reply read back from the adapter", async () => {
    const ticket = await mockPorts.support.createTicket({ tenantId: currentTenant.id, asunto: "Exportación de prueba", aplicacion: "FlowDesk", prioridad: "alta", cuerpo: "Falla la exportación" });
    expect(ticket.estado).toBe("abierta");
    const updated = await mockPorts.support.reply({ tenantId: currentTenant.id, ticketId: ticket.id, cuerpo: "Adjunto información adicional" });
    expect(updated.estado).toBe("en_curso");
    const list = await mockPorts.support.listTickets(currentTenant.id);
    expect(list.find((item) => item.id === ticket.id)?.mensajes.map((message) => message.cuerpo)).toEqual(["Falla la exportación", "Adjunto información adicional"]);
  });
  test("replying to a nonexistent ticket rejects", async () => {
    await expect(mockPorts.support.reply({ tenantId: currentTenant.id, ticketId: "missing-ticket", cuerpo: "Respuesta" })).rejects.toThrow("Incidencia no encontrada");
  });
});