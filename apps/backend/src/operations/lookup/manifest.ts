import type { OperationManifest } from "../../domain/operation";

export const lookupManifest: OperationManifest = {
  id: "lookup",
  name: "Lookup",
  description: "Reserved operation for EPS lookup workflows.",
  provider: "lookup",
  enabled: false,
  commands: ["preview", "cancel", "reset"],
  fields: [
    {
      key: "query",
      label: "Query",
      type: "text",
      required: true,
      preview: true
    }
  ]
};
