import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock DB ---

const mockReturning = vi.fn();
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockLimit = vi.fn().mockReturnValue([]);
const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
const mockExecute = vi.fn().mockResolvedValue({ rows: [] });

const mockDb = {
  insert: mockInsert,
  select: mockSelect,
  update: mockUpdate,
  execute: mockExecute,
};

vi.mock("@presence-os/db", () => ({
  createDb: vi.fn(() => mockDb),
  knowledgeFrameworks: {
    id: "kf.id",
    tenantId: "kf.tenantId",
    brandId: "kf.brandId",
    isCurrent: "kf.isCurrent",
    confidenceScore: "kf.confidenceScore",
    evidence: "kf.evidence",
  },
  knowledgeSources: { id: "ks.id" },
  contentPerformance: { id: "cp.id" },
  audienceMetrics: { id: "am.id" },
  abTests: { id: "ab.id", tenantId: "ab.tenantId" },
  workflowPerformance: {
    id: "wp.id",
    tenantId: "wp.tenantId",
    brandId: "wp.brandId",
    workflowType: "wp.workflowType",
    qualityScore: "wp.qualityScore",
    measuredAt: "wp.measuredAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ op: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
  desc: vi.fn((col: unknown) => ({ op: "desc", col })),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({
      sql: strings.join("?"),
      values,
    }),
    { raw: vi.fn((s: string) => s) },
  ),
}));

import {
  catalogFramework,
  discoverKnowledge,
  reconcileEvidence,
  linkSourceMaterial,
  captureMetric,
  snapshotAudience,
  trackExperiment,
  assessWorkflowHealth,
  scoreToLevel,
} from "./perf-knowledge.activities.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockReturning.mockResolvedValue([{ id: "test-id" }]);
  mockLimit.mockReturnValue([]);
  mockOrderBy.mockReturnValue({ limit: mockLimit });
});

// --- scoreToLevel ---

describe("scoreToLevel", () => {
  it("maps < 0.4 to low", () => {
    expect(scoreToLevel(0.1)).toBe("low");
    expect(scoreToLevel(0.39)).toBe("low");
  });

  it("maps 0.4-0.69 to medium", () => {
    expect(scoreToLevel(0.4)).toBe("medium");
    expect(scoreToLevel(0.5)).toBe("medium");
  });

  it("maps 0.7-0.89 to high", () => {
    expect(scoreToLevel(0.7)).toBe("high");
    expect(scoreToLevel(0.89)).toBe("high");
  });

  it("maps >= 0.9 to validated", () => {
    expect(scoreToLevel(0.9)).toBe("validated");
    expect(scoreToLevel(1.0)).toBe("validated");
  });
});

// --- catalogFramework ---

describe("catalogFramework", () => {
  it("inserts framework with default confidence", async () => {
    mockReturning.mockResolvedValue([{ id: "fw-id" }]);

    const result = await catalogFramework({
      tenantId: "t1",
      brandId: "b1",
      framework: { title: "Test Framework" },
    });

    expect(result).toEqual({ frameworkId: "fw-id" });
    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.confidenceScore).toBe(0.5);
    expect(valuesArg.confidenceLevel).toBe("medium");
    expect(valuesArg.version).toBe(1);
    expect(valuesArg.isCurrent).toBe(true);
  });

  it("passes embedding when provided", async () => {
    mockReturning.mockResolvedValue([{ id: "fw-id" }]);

    await catalogFramework({
      tenantId: "t1",
      brandId: "b1",
      framework: { title: "Embedding Test" },
      embedding: [0.1, 0.2, 0.3],
    });

    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.embedding).toEqual([0.1, 0.2, 0.3]);
  });
});

// --- discoverKnowledge ---

describe("discoverKnowledge", () => {
  it("uses raw SQL with pgvector when embedding provided", async () => {
    // db.execute returns a RowList which is array-like; Array.from() is used on it
    mockExecute.mockResolvedValue([{ id: "fw-1" }]);

    const result = await discoverKnowledge({
      tenantId: "t1",
      brandId: "b1",
      query: "test",
      embedding: [0.1, 0.2],
    });

    expect(mockExecute).toHaveBeenCalled();
    expect(result.frameworks).toEqual([{ id: "fw-1" }]);
  });

  it("uses standard select when no embedding", async () => {
    mockLimit.mockReturnValue([{ id: "fw-2" }]);

    const result = await discoverKnowledge({
      tenantId: "t1",
      brandId: "b1",
      query: "strategy",
    });

    expect(mockSelect).toHaveBeenCalled();
    expect(result.frameworks).toEqual([{ id: "fw-2" }]);
  });
});

// --- reconcileEvidence ---

describe("reconcileEvidence", () => {
  it("updates confidence score and level", async () => {
    await reconcileEvidence({
      tenantId: "t1",
      frameworkId: "fw-1",
      evidence: { source: "metrics", observation: "engagement up 20%" },
      confidenceScore: 0.85,
    });

    expect(mockUpdate).toHaveBeenCalled();
    const setArg = mockUpdateSet.mock.calls[0][0];
    expect(setArg.confidenceScore).toBe(0.85);
    expect(setArg.confidenceLevel).toBe("high");
  });
});

// --- linkSourceMaterial ---

describe("linkSourceMaterial", () => {
  it("inserts source and returns id", async () => {
    mockReturning.mockResolvedValue([{ id: "src-id" }]);

    const result = await linkSourceMaterial({
      tenantId: "t1",
      frameworkId: "fw-1",
      sourceData: {
        brandId: "b1",
        type: "article",
        title: "Performance Trends",
      },
    });

    expect(result).toEqual({ sourceId: "src-id" });
  });
});

// --- captureMetric ---

describe("captureMetric", () => {
  it("inserts metric with defaults for missing fields", async () => {
    mockReturning.mockResolvedValue([]);

    await captureMetric({
      tenantId: "t1",
      contentId: "c1",
      platform: "x",
      metrics: { impressions: 100 },
    });

    expect(mockInsert).toHaveBeenCalled();
    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.impressions).toBe(100);
    expect(valuesArg.engagements).toBe(0);
    expect(valuesArg.clicks).toBe(0);
  });

  it("returns recorded: true", async () => {
    const result = await captureMetric({
      tenantId: "t1",
      contentId: "c1",
      platform: "linkedin",
      metrics: {},
    });
    expect(result).toEqual({ recorded: true });
  });
});

// --- snapshotAudience ---

describe("snapshotAudience", () => {
  it("inserts audience snapshot and returns id", async () => {
    mockReturning.mockResolvedValue([{ id: "snap-id" }]);

    const result = await snapshotAudience({
      tenantId: "t1",
      brandId: "b1",
      platform: "linkedin",
      followers: 5000,
      followersDelta: 50,
    });

    expect(result).toEqual({ snapshotId: "snap-id" });
  });
});

// --- trackExperiment ---

describe("trackExperiment", () => {
  it("creates new experiment when no id", async () => {
    mockReturning.mockResolvedValue([{ id: "exp-id" }]);

    const result = await trackExperiment({
      tenantId: "t1",
      brandId: "b1",
      testConfig: {
        title: "CTA Test",
        hypothesis: "Shorter CTA increases clicks",
      },
    });

    expect(result).toEqual({ testId: "exp-id" });
    expect(mockInsert).toHaveBeenCalled();
  });

  it("updates existing experiment when id provided", async () => {
    const result = await trackExperiment({
      tenantId: "t1",
      brandId: "b1",
      testConfig: {
        id: "existing-exp",
        title: "CTA Test",
        hypothesis: "test",
        status: "concluded",
        winnerVariantId: "A",
      },
    });

    expect(result).toEqual({ testId: "existing-exp" });
    expect(mockUpdate).toHaveBeenCalled();
  });
});

// --- assessWorkflowHealth ---

describe("assessWorkflowHealth", () => {
  it("computes average from last 5 records", async () => {
    mockLimit.mockReturnValue([
      { qualityScore: 0.8 },
      { qualityScore: 0.9 },
      { qualityScore: 0.7 },
      { qualityScore: 0.85 },
      { qualityScore: 0.75 },
    ]);

    const result = await assessWorkflowHealth({
      tenantId: "t1",
      brandId: "b1",
      workflowType: "content_production",
      qualityScore: 0.8,
    });

    // Average of [0.8, 0.9, 0.7, 0.85, 0.75] = 0.8
    expect(result.healthScore).toBe(0.8);
  });

  it("handles single record", async () => {
    mockLimit.mockReturnValue([{ qualityScore: 0.6 }]);

    const result = await assessWorkflowHealth({
      tenantId: "t1",
      brandId: "b1",
      workflowType: "identity_evolution",
      qualityScore: 0.6,
    });

    expect(result.healthScore).toBe(0.6);
  });
});
