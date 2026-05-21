import { featureFlags } from "../../application/config";
import type { OperationManifest } from "../../domain/operation";

export const createUserManifest: OperationManifest = {
  id: "create_user",
  name: "Create User",
  description: "Reserved operation for EPS user creation workflows.",
  provider: "admin",
  enabled: featureFlags.enableUserCreation,
  commands: ["preview", "confirm", "cancel", "reset", "edit"],
  fields: [
    {
      key: "userId",
      label: "User ID",
      type: "text",
      required: true,
      preview: true
    }
  ]
};
