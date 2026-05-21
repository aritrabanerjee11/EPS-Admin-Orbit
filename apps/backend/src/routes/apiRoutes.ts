import { Router } from "express";
import { chatController } from "../controllers/chatController";

export const apiRoutes = Router();

apiRoutes.post("/chat", chatController.chat);
apiRoutes.post("/preview", chatController.preview);
apiRoutes.post("/confirm", chatController.confirm);
apiRoutes.post("/cancel", chatController.cancel);
apiRoutes.get("/providers/health", chatController.providerHealth);
apiRoutes.get("/logs", chatController.logs);
