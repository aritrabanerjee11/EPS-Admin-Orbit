import cors from "cors";
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { apiRoutes } from "./routes/apiRoutes";
import { ApiError } from "./services/errors";
import { featureFlags, timeoutConfig } from "./application/config";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "EPS Admin Orbit API",
      description: "Conversational Operations Console for EPS administrative workflows",
      featureFlags,
      timeoutConfig
    }
  });
});

app.use("/api", apiRoutes);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Invalid request payload",
      details: error.flatten()
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      structuredError: error.toStructuredError()
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({
    success: false,
    error: message,
    structuredError: {
      category: "SYSTEM",
      message,
      retryable: false
    }
  });
});

app.listen(port, () => {
  console.log(`EPS Admin Orbit API listening on http://localhost:${port}`);
});
