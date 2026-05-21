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
      label: "Quantity",
      type: "number",
      required: true,
      preview: true
    },
    {
      key: "environment",
      label: "Environment",
      type: "select",
      required: true,
      preview: true,
      options: ["PREPROD", "PROD", "UAT", "QA", "DEV", "SIT", "TEST", "STAGE"]
    },
    {
      key: "codeType",
      label: "Code Type",
      type: "select",
      required: true,
      preview: true,
      options: ["Alphanumeric", "Numeric", "Alphabetic"]
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
      key: "prodConfirmation",
      label: "PROD Confirmation",
      type: "text",
      required: false,
      preview: false,
      requiredForProviders: ["PROD"]
    }
  ]
};
