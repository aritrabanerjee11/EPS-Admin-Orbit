import type { OperationManifest } from "../../domain/operation";

export const generateCodesManifest: OperationManifest = {
  id: "generate_codes",
  name: "Generate Codes",
  description: "Generate EPS codes through the configured code provider.",
  provider: "code",
  enabled: true,
  commands: ["preview", "confirm", "cancel", "reset", "edit", "retry"],
  fields: [
    {
      key: "quantity",
      label: "Number of Tokens",
      type: "number",
      required: true,
      preview: true
    },
    {
      key: "productId",
      label: "ISBN or Product ID",
      type: "text",
      required: true,
      preview: true
    },
    {
      key: "environment",
      label: "Environment",
      type: "select",
      required: true,
      preview: true,
      options: ["DEV", "TEST", "PREPROD", "PROD"]
    },
    {
      key: "allowedUsages",
      label: "Allowed Usages",
      type: "number",
      required: false,
      preview: true,
      defaultValue: 1
    },
    {
      key: "systemId",
      label: "System ID",
      type: "select",
      required: false,
      preview: true,
      options: ["olb", "vst"],
      defaultValue: "olb"
    },
    {
      key: "codeType",
      label: "Code Type",
      type: "select",
      required: false,
      preview: true,
      options: ["Numeric"],
      defaultValue: "Numeric"
    },
    {
      key: "batchName",
      label: "Batch",
      type: "text",
      required: false,
      preview: true,
      defaultValue: "Batch-A"
    },
    {
      key: "validFrom",
      label: "Valid From",
      type: "text",
      required: false,
      preview: true
    },
    {
      key: "validTo",
      label: "Valid To",
      type: "text",
      required: false,
      preview: true
    },
    {
      key: "prodConfirmation",
      label: "PROD Confirmation",
      type: "text",
      required: false,
      preview: false,
      requiredForProviders: ["PROD"]
    }
  ]
};
