/**
 * Bus de eventos en memoria (sustituible por Kafka/RabbitMQ/EventBridge).
 * Los módulos nunca se llaman entre sí directamente: publican y consumen eventos.
 */

export interface DomainEvent<T = unknown> {
  id: string;
  nombre: string;
  emisor: string;
  tenantId?: string;
  correlationId: string;
  fecha: string;
  payload: T;
}

type Handler = (event: DomainEvent) => void;

const handlers = new Map<string, Set<Handler>>();
const log: DomainEvent[] = [];

export function publish<T>(
  nombre: string,
  payload: T,
  meta: { emisor: string; tenantId?: string; correlationId?: string } = { emisor: "app" },
): DomainEvent<T> {
  const event: DomainEvent<T> = {
    id: `ev_${Math.random().toString(36).slice(2, 10)}`,
    nombre,
    emisor: meta.emisor,
    ...(meta.tenantId ? { tenantId: meta.tenantId } : {}),
    correlationId: meta.correlationId ?? `corr_${Math.random().toString(36).slice(2, 10)}`,
    fecha: new Date().toISOString(),
    payload,
  };
  log.unshift(event as DomainEvent);
  handlers.get(nombre)?.forEach((h) => h(event as DomainEvent));
  handlers.get("*")?.forEach((h) => h(event as DomainEvent));
  return event;
}

export function subscribe(nombre: string, handler: Handler): () => void {
  const set = handlers.get(nombre) ?? new Set<Handler>();
  set.add(handler);
  handlers.set(nombre, set);
  return () => set.delete(handler);
}

export function eventLog(limite = 50): DomainEvent[] {
  return log.slice(0, limite);
}
