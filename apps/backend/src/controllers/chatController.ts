import type { NextFunction, Request, Response } from "express";
import { cancelRequestSchema, chatRequestSchema, sessionRequestSchema } from "../types/schemas";
import { handleChat } from "../services/chatService";
import { confirmCodes } from "../services/confirmService";
import { buildPreview } from "../services/previewService";
import { cancelExecution } from "../application/execution/executionRegistry";
import { getProviderHealth } from "../infrastructure/providers/providerHealth";
import { readRecentLogs } from "../infrastructure/logging/logger";

export const chatController = {
  chat(req: Request, res: Response, next: NextFunction) {
    try {
      const body = chatRequestSchema.parse(req.body);
      const data = handleChat(body);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  preview(req: Request, res: Response, next: NextFunction) {
    try {
      const body = sessionRequestSchema.parse(req.body);
      const data = buildPreview(body.session);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const body = sessionRequestSchema.parse(req.body);
      const data = await confirmCodes(body.session);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const body = cancelRequestSchema.parse(req.body);
      const requestId = body.requestId ?? body.session?.requestId;
      const cancelled = requestId ? cancelExecution(requestId) : false;

      res.json({
        success: true,
        data: {
          cancelled
        }
      });
    } catch (error) {
      next(error);
    }
  },

  providerHealth(_req: Request, res: Response) {
    res.json({
      success: true,
      data: getProviderHealth()
    });
  },

  logs(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        chat: readRecentLogs("chat", 10),
        provider: readRecentLogs("provider", 10),
        execution: readRecentLogs("execution", 10)
      }
    });
  }
};
