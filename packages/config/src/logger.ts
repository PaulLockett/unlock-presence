import pino from "pino";

export interface LogContext {
  tenantId?: string;
  brandId?: string;
  workflowId?: string;
  activityName?: string;
  component?: string;
}

export function createLogger(context: LogContext = {}) {
  return pino({
    level: process.env.LOG_LEVEL ?? "info",
    ...(process.env.NODE_ENV === "development"
      ? { transport: { target: "pino-pretty" } }
      : {}),
  }).child(context);
}

export const logger = createLogger();
