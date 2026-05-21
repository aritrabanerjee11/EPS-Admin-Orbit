export type FeatureFlags = {
  enableUserCreation: boolean;
  enableSoap: boolean;
  enableDemo: boolean;
};

export type TimeoutConfig = {
  connectTimeoutMs: number;
  requestTimeoutMs: number;
  retryTimeoutMs: number;
};

export const featureFlags: FeatureFlags = {
  enableUserCreation: parseBoolean(process.env.ENABLE_USER_CREATION, false),
  enableSoap: parseBoolean(process.env.ENABLE_SOAP, true),
  enableDemo: parseBoolean(process.env.ENABLE_DEMO ?? process.env.ENABLE_DEMO_MODE, true)
};

export const timeoutConfig: TimeoutConfig = {
  connectTimeoutMs: parseNumber(process.env.CONNECT_TIMEOUT_MS, 3000),
  requestTimeoutMs: parseNumber(process.env.REQUEST_TIMEOUT_MS, 15000),
  retryTimeoutMs: parseNumber(process.env.RETRY_TIMEOUT_MS, 2000)
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
