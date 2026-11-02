import { useSyncExternalStore } from "react";
import { notifications as seed, currentTenant } from "../domain/seed";
import { publish } from "../integration/event-bus";

let items = seed;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useNotifications() {
  return useSyncExternalStore(subscribe, () => items, () => seed);
}
export function markNotificationsRead(id?: string) {
  items = items.map((item) => !id || item.id === id ? { ...item, leida: true } : item);
  publish("portal.notificaciones.leidas", { ids: id ? [id] : items.map((item) => item.id) }, { emisor: "portal-cliente", tenantId: currentTenant.id });
  listeners.forEach((listener) => listener());
}