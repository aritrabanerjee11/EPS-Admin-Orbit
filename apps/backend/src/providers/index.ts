import type { CodeProvider } from "./CodeProvider";
import { MockCodeProvider } from "./mock/MockCodeProvider";
import { SoapCodeProvider } from "./soap/SoapCodeProvider";
import type { ProviderTarget } from "../types/chat";
import { featureFlags } from "../application/config";

export function getCodeProvider(providerTarget: ProviderTarget = "MOCK"): CodeProvider {
  const providerName = process.env.CODE_PROVIDER?.toLowerCase() ?? "mock";

  if (providerTarget === "MOCK" || featureFlags.enableDemo) {
    return new MockCodeProvider();
  }

  if (providerName === "soap" && featureFlags.enableSoap) {
    return new SoapCodeProvider();
  }

  return new MockCodeProvider();
}
