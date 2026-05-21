import type { StructuredError } from "../types/chat";

export class ApiError extends Error {
  public readonly category: StructuredError["category"];
  public readonly retryable: boolean;

  constructor(
    public readonly statusCode: number,
    message: string,
    category: StructuredError["category"] = "SYSTEM",
    retryable = false
  ) {
    super(message);
    this.category = category;
    this.retryable = retryable;
  }

  toStructuredError(): StructuredError {
    return {
      category: this.category,
      message: this.message,
      retryable: this.retryable
    };
  }
}
