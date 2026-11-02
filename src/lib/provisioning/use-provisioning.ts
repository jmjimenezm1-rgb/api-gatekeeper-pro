import { useEffect, useState } from "react";

import { listRequests, listRules, metrics, onStoreChange } from "./store";

export function useProvisioning() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const off = onStoreChange(() => setTick((t) => t + 1));
    return () => {
      off();
    };
  }, []);
  void tick;
  return { requests: listRequests(), rules: listRules(), stats: metrics() };
}
