import type { CodeProvider } from "./CodeProvider";
import { MockCodeProvider } from "./mock/MockCodeProvider";
import { SoapCodeProvider } from "./soap/SoapCodeProvider";
import type { ProviderTarget } from "../types/chat";
import { featureFlags } from "../application/config";

export function getCodeProvider(providerTarget: ProviderTarget = "DEV"): CodeProvider {
  if (featureFlags.enableDemo) {
    return new MockCodeProvider();
  }

  if (featureFlags.enableSoap) {
    return new SoapCodeProvider();
  }

  return new SoapCodeProvider();
}
