import type { ProviderTarget } from "../../types/chat";
import { featureFlags } from "../../application/config";

export type ProviderHealth = {
  target: ProviderTarget;
  label: string;
  status: "Healthy" | "Slow" | "Unavailable";
  active: boolean;
  provider: string;
};

export function getProviderHealth(activeTarget: ProviderTarget = "MOCK"): ProviderHealth[] {
  return (["MOCK", "PREPROD", "PROD"] as ProviderTarget[]).map((target) => {
    if (target === "MOCK") {
      return {
        target,
        label: "MOCK",
        status: "Healthy",
        active: target === activeTarget,
        provider: "Mock"
      };
    }

    if (!featureFlags.enableSoap && !featureFlags.enableDemo) {
      return {
        target,
        label: target,
        status: "Unavailable",
        active: target === activeTarget,
        provider: "SOAP"
      };
    }

    return {
      target,
      label: target,
      status: featureFlags.enableDemo ? "Healthy" : "Slow",
      active: target === activeTarget,
      provider: featureFlags.enableDemo ? `Demo ${target}` : `SOAP ${target}`
    };
  });
}
