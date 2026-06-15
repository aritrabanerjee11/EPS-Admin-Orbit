import type { CodeProvider, GenerateCodesInput, GenerateCodesResult, LookupCodesInput, LookupCodesResult } from "../CodeProvider";
import { randomUUID } from "node:crypto";

type SoapConfig = {
  endpoint: string;
  username: string;
  password: string;
  soapAction?: string;
  systemPrefix: string;
  typeId: string;
};

export class SoapCodeProvider implements CodeProvider {
  async generate(input: GenerateCodesInput): Promise<GenerateCodesResult> {
    const soapEnvironment = resolveSoapEnvironment(input);
    const config = getSoapConfig(soapEnvironment);
    const startedAt = Date.now();
    const xml = buildCreateActivationCodeBatchRequest(input, config, soapEnvironment);

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: buildHeaders(config),
      body: xml,
      signal: input.signal
    });
    const content = await response.text();

    if (!response.ok) {
      throw new Error(`Provider unavailable: HTTP ${response.status}`);
    }

    const codes = extractActivationCodes(content);
    if (codes.length > 0) {
      return {
        batchName: input.batchName,
        environment: soapEnvironment.toUpperCase(),
        codeType: input.codeType,
        codes,
        generatedAt: new Date().toISOString(),
        provider: `SOAP ${soapEnvironment.toUpperCase()} (${Date.now() - startedAt}ms)`
      };
    }

    const statusReason = extractStatusReason(content);
    if (statusReason) {
      throw new Error(statusReason);
    }

    throw new Error("No activation codes returned by provider.");
  }

  async lookup(_input: LookupCodesInput): Promise<LookupCodesResult> {
    throw new Error("Lookup is not implemented for the SOAP provider yet.");
  }
}

function buildCreateActivationCodeBatchRequest(input: GenerateCodesInput, config: SoapConfig, soapEnvironment: string): string {
  const batchId = input.batchName || `Orbit${randomUUID()}`;
  const validFrom = normalizeDate(input.validFrom);
  const validTo = normalizeDate(input.validTo);
  const systemId = normalizeSystemId(input.systemId, config.systemPrefix);
  const codeFormat = mapCodeFormat(input.codeType);

  return `<x:Envelope xmlns:x="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:eac="http://eac.oup.com/2.0/eac-access-services"
xmlns:eac1="http://eac.oup.com/2.0/eac-common-types">
<x:Header>
<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/...">
<wsse:UsernameToken>
<wsse:Username>${escapeXml(config.username)}</wsse:Username>
<wsse:Password>${escapeXml(config.password)}</wsse:Password>
</wsse:UsernameToken>
</wsse:Security>
</x:Header>
<x:Body>
<eac:CreateActivationCodeBatchRequest>
<eac:activationCodeBatch>
<eac1:batchId>${escapeXml(batchId)}</eac1:batchId>
<eac1:codeFormat>${escapeXml(codeFormat)}</eac1:codeFormat>
<eac1:numberOfTokens>${input.quantity}</eac1:numberOfTokens>
<eac1:allowedUsages>${input.allowedUsages}</eac1:allowedUsages>
<eac1:validFrom>${escapeXml(validFrom)}</eac1:validFrom>
<eac1:validTo>${escapeXml(validTo)}</eac1:validTo>
</eac:activationCodeBatch>
<eac:activationCodeLicence>
<eac1:productId>
<eac1:externalId>
<eac1:id>${escapeXml(input.productId)}</eac1:id>
<eac1:systemId>${escapeXml(systemId)}</eac1:systemId>
<eac1:typeId>${escapeXml(config.typeId)}</eac1:typeId>
</eac1:externalId>
</eac1:productId>
<eac1:licenceDetails>
<eac1:enabled>true</eac1:enabled>
<eac1:extendedDetails>
<eac1:rollingLicence>
<eac1:beginOn>CREATION</eac1:beginOn>
<eac1:periodUnit>YEAR</eac1:periodUnit>
<eac1:periodValue>1</eac1:periodValue>
</eac1:rollingLicence>
</eac1:extendedDetails>
</eac1:licenceDetails>
</eac:activationCodeLicence>
</eac:CreateActivationCodeBatchRequest>
</x:Body>
</x:Envelope>`;
}

function getSoapConfig(soapEnvironment: string): SoapConfig {
  const endpointTemplate = readEnvForTarget("SOAP_ENDPOINT_TEMPLATE", soapEnvironment)
    ?? "https://{env}.account.oup.com/api/edu/open/eac-web-services/";
  const usernameTemplate = readEnvForTarget("SOAP_USERNAME_TEMPLATE", soapEnvironment) ?? "{env}_test";
  const password = readEnvForTarget("SOAP_PASSWORD", soapEnvironment) ?? "Oxford123";

  return {
    endpoint: endpointTemplate.replaceAll("{env}", soapEnvironment),
    username: usernameTemplate.replaceAll("{env}", soapEnvironment),
    password,
    soapAction: readEnvForTarget("SOAP_ACTION", soapEnvironment),
    systemPrefix: process.env.SOAP_SYSTEM_PREFIX ?? "elt_",
    typeId: process.env.SOAP_TYPE_ID ?? "isbn"
  };
}

function readEnvForTarget(name: string, soapEnvironment: string): string | undefined {
  return process.env[`${name}_${soapEnvironment.toUpperCase()}`] ?? process.env[name];
}

function buildHeaders(config: SoapConfig): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "text/xml"
  };

  if (config.soapAction) {
    headers.SOAPAction = config.soapAction;
  }

  return headers;
}

function resolveSoapEnvironment(input: GenerateCodesInput): string {
  const environment = input.environment.toLowerCase();
  const allowed = new Set(["dev", "test", "uat", "preprod", "prod"]);

  if (allowed.has(environment)) {
    return environment;
  }

  return input.providerTarget.toLowerCase();
}

function mapCodeFormat(codeType: string): string {
  const normalized = codeType.toLowerCase();

  if (normalized.includes("numeric")) {
    return "EAC_NUMERIC";
  }

  return process.env.SOAP_CODE_FORMAT ?? "EAC_NUMERIC";
}

function normalizeSystemId(systemId: string, prefix: string): string {
  const normalized = systemId.trim().toLowerCase();
  return normalized.startsWith(prefix) ? normalized : `${prefix}${normalized}`;
}

function normalizeDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  return parsed.toISOString().slice(0, 10);
}

function extractActivationCodes(content: string): string[] {
  return Array.from(content.matchAll(/<(?:\w+:)?activationCode>(.*?)<\/(?:\w+:)?activationCode>/g)).map((match) =>
    decodeXml(match[1] ?? "")
  );
}

function extractStatusReason(content: string): string | undefined {
  const match = content.match(/<(?:\w+:)?statusReason>(.*?)<\/(?:\w+:)?statusReason>/);
  return match?.[1] ? decodeXml(match[1]) : undefined;
}

function escapeXml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .trim();
}
