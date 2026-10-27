import { describe, expect, it } from "vitest";

import { computeUsageAlerts } from "./usage-alerts";

const key = {
  id: "k1",
  name: "Demo",
  key_prefix: "amk_x",
  rate_limit_per_minute: 100,
  rate_limit_per_hour: 1000,
  rate_limit_per_day: 10000,
};

describe("computeUsageAlerts", () => {
  it("no avisa por debajo del 80%", () => {
    expect(computeUsageAlerts([key], [{ api_key_id: "k1", window_kind: "minute", hits: 79 }])).toEqual([]);
  });
  it("avisa al llegar al 80%", () => {
    const [alert] = computeUsageAlerts([key], [{ api_key_id: "k1", window_kind: "hour", hits: 800 }]);
    expect(alert?.severity).toBe("warning");
    expect(alert?.percent).toBe(80);
  });
  it("marca como superado al alcanzar el límite", () => {
    const [alert] = computeUsageAlerts([key], [{ api_key_id: "k1", window_kind: "day", hits: 10000 }]);
    expect(alert?.severity).toBe("exceeded");
  });
});
