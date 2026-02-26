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

/**
 * Convenience logger for Temporal activities.
 * Auto-sets `component` from the COMPONENT env var (set per Railway service).
 */
export function createActivityLogger(
  context: Omit<LogContext, "component"> & { activityName: string },
) {
  return createLogger({
    ...context,
    component: process.env.COMPONENT ?? "unknown",
  });
}

/**
 * Deterministic-safe logger for Temporal workflows.
 * Temporal workflows cannot use Pino (non-deterministic I/O), so this
 * returns a simple structured logger that writes to console.log as JSON.
 */
export function createWorkflowLogger(workflowId: string, component: string) {
  const base = { workflowId, component };
  const write = (level: string, msg: string, extra?: Record<string, unknown>) => {
    const entry = { level, msg, ...base, ...extra, timestamp: new Date().toISOString() };
    console.log(JSON.stringify(entry));
  };
  return {
    info: (msg: string, extra?: Record<string, unknown>) => write("info", msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) => write("warn", msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => write("error", msg, extra),
    debug: (msg: string, extra?: Record<string, unknown>) => write("debug", msg, extra),
  };
}

export interface AuditEvent {
  action: string;
  tenantId: string;
  brandId?: string;
  userId?: string;
  resource: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
}

/**
 * Structured audit entry for compliance-sensitive operations.
 * Writes to stdout as JSON — picked up by log aggregation pipeline.
 */
export function auditLog(event: AuditEvent) {
  const entry = {
    level: "audit",
    timestamp: new Date().toISOString(),
    component: process.env.COMPONENT ?? "unknown",
    ...event,
  };
  console.log(JSON.stringify(entry));
}
