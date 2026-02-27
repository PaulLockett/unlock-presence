import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createLogger,
  createActivityLogger,
  createWorkflowLogger,
  auditLog,
  type AuditEvent,
} from "./logger.js";

describe("createLogger", () => {
  it("returns a pino logger instance with child context", () => {
    const log = createLogger({ tenantId: "t1", component: "test" });
    // Pino loggers have standard level methods
    expect(typeof log.info).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.debug).toBe("function");
  });

  it("applies context bindings to child logger", () => {
    const log = createLogger({ tenantId: "t1", brandId: "b1" });
    // Pino child loggers store bindings internally
    expect(log.bindings()).toMatchObject({ tenantId: "t1", brandId: "b1" });
  });

  it("defaults to empty context when none provided", () => {
    const log = createLogger();
    expect(log.bindings()).toEqual({});
  });
});

describe("createActivityLogger", () => {
  const originalEnv = process.env.COMPONENT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.COMPONENT;
    } else {
      process.env.COMPONENT = originalEnv;
    }
  });

  it("auto-sets component from COMPONENT env var", () => {
    process.env.COMPONENT = "content-engine";
    const log = createActivityLogger({ activityName: "produce" });
    expect(log.bindings()).toMatchObject({
      component: "content-engine",
      activityName: "produce",
    });
  });

  it("defaults component to 'unknown' when env var missing", () => {
    delete process.env.COMPONENT;
    const log = createActivityLogger({ activityName: "test" });
    expect(log.bindings()).toMatchObject({ component: "unknown" });
  });

  it("preserves tenant and brand context", () => {
    process.env.COMPONENT = "analytics-engine";
    const log = createActivityLogger({
      activityName: "assess",
      tenantId: "t1",
      brandId: "b1",
    });
    expect(log.bindings()).toMatchObject({
      component: "analytics-engine",
      activityName: "assess",
      tenantId: "t1",
      brandId: "b1",
    });
  });
});

describe("createWorkflowLogger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("returns an object with info/warn/error/debug methods", () => {
    const log = createWorkflowLogger("wf-123", "presence-manager");
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.debug).toBe("function");
  });

  it("writes structured JSON to console.log", () => {
    const log = createWorkflowLogger("wf-123", "presence-manager");
    log.info("workflow started");

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output).toMatchObject({
      level: "info",
      msg: "workflow started",
      workflowId: "wf-123",
      component: "presence-manager",
    });
    expect(output.timestamp).toBeDefined();
  });

  it("includes extra fields in output", () => {
    const log = createWorkflowLogger("wf-456", "content-engine");
    log.error("step failed", { step: "produce", attempt: 3 });

    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output).toMatchObject({
      level: "error",
      msg: "step failed",
      step: "produce",
      attempt: 3,
    });
  });

  it("writes each level correctly", () => {
    const log = createWorkflowLogger("wf-1", "test");
    log.info("i");
    log.warn("w");
    log.error("e");
    log.debug("d");

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    const levels = consoleSpy.mock.calls.map(
      (c) => JSON.parse(c[0] as string).level,
    );
    expect(levels).toEqual(["info", "warn", "error", "debug"]);
  });
});

describe("auditLog", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env.COMPONENT;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    if (originalEnv === undefined) {
      delete process.env.COMPONENT;
    } else {
      process.env.COMPONENT = originalEnv;
    }
  });

  it("writes structured audit JSON to stdout", () => {
    process.env.COMPONENT = "identity-engine";
    const event: AuditEvent = {
      action: "brand_identity_updated",
      tenantId: "t-123",
      brandId: "b-456",
      userId: "u-789",
      resource: "brand_identity",
      resourceId: "bi-001",
    };
    auditLog(event);

    expect(consoleSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output).toMatchObject({
      level: "audit",
      component: "identity-engine",
      action: "brand_identity_updated",
      tenantId: "t-123",
      brandId: "b-456",
      userId: "u-789",
      resource: "brand_identity",
      resourceId: "bi-001",
    });
    expect(output.timestamp).toBeDefined();
  });

  it("includes optional detail field", () => {
    const event: AuditEvent = {
      action: "workflow_graduated",
      tenantId: "t-1",
      resource: "workflow",
      detail: { from: "supervised", to: "autonomous" },
    };
    auditLog(event);

    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.detail).toEqual({ from: "supervised", to: "autonomous" });
  });

  it("defaults component to 'unknown'", () => {
    delete process.env.COMPONENT;
    auditLog({
      action: "test",
      tenantId: "t-1",
      resource: "test",
    });
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.component).toBe("unknown");
  });
});
