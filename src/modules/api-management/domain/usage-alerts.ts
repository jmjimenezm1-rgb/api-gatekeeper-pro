/** Alertas de uso: claves que se acercan o superan sus límites. */
export type UsageWindow = "minute" | "hour" | "day";

export const USAGE_ALERT_THRESHOLD = 0.8;

export interface UsageAlert {
  apiKeyId: string;
  keyName: string;
  keyPrefix: string;
  window: UsageWindow;
  hits: number;
  limit: number;
  percent: number;
  severity: "warning" | "exceeded";
}

export interface KeyLimits {
  id: string;
  name: string;
  key_prefix: string;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
}

export function computeUsageAlerts(
  keys: KeyLimits[],
  counters: Array<{ api_key_id: string; window_kind: string; hits: number }>,
): UsageAlert[] {
  const alerts: UsageAlert[] = [];
  for (const counter of counters) {
    const key = keys.find((item) => item.id === counter.api_key_id);
    if (!key) continue;
    const window = counter.window_kind as UsageWindow;
    const limit =
      window === "minute"
        ? key.rate_limit_per_minute
        : window === "hour"
          ? key.rate_limit_per_hour
          : key.rate_limit_per_day;
    if (!limit || counter.hits < limit * USAGE_ALERT_THRESHOLD) continue;
    alerts.push({
      apiKeyId: key.id,
      keyName: key.name,
      keyPrefix: key.key_prefix,
      window,
      hits: counter.hits,
      limit,
      percent: Math.round((counter.hits / limit) * 100),
      severity: counter.hits >= limit ? "exceeded" : "warning",
    });
  }
  return alerts.sort((a, b) => b.percent - a.percent);
}
