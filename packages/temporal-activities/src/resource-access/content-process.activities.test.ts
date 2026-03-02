import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock DB ---

const mockReturning = vi.fn();
const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
const mockOrderBy = vi.fn().mockReturnValue([]);
const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

const mockTx = {
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
};

const mockTransaction = vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

const mockDb = {
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
  transaction: mockTransaction,
};

vi.mock("@presence-os/db", () => ({
  createDb: vi.fn(() => mockDb),
  brands: { id: "brands.id", tenantId: "brands.tenantId" },
  brandIdentities: {
    id: "brandIdentities.id",
    brandId: "brandIdentities.brandId",
    tenantId: "brandIdentities.tenantId",
    isCurrent: "brandIdentities.isCurrent",
    version: "brandIdentities.version",
  },
  channelConnections: {
    id: "channelConnections.id",
    tenantId: "channelConnections.tenantId",
  },
  content: {
    id: "content.id",
    tenantId: "content.tenantId",
    status: "content.status",
    version: "content.version",
  },
  contentAnnotations: {
    id: "contentAnnotations.id",
    contentId: "contentAnnotations.contentId",
    tenantId: "contentAnnotations.tenantId",
    annotationType: "contentAnnotations.annotationType",
    createdAt: "contentAnnotations.createdAt",
  },
  tasks: { id: "tasks.id", tenantId: "tasks.tenantId" },
  taskResponses: {},
}));

vi.mock("@presence-os/auth", () => ({
  encryptToken: vi.fn((token: string) => `encrypted:${token}`),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ op: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
  gte: vi.fn((...args: unknown[]) => ({ op: "gte", args })),
  desc: vi.fn((col: unknown) => ({ op: "desc", col })),
}));

import {
  configureBrand,
  evolveIdentity,
  registerChannel,
  revokeChannel,
  stageContent,
  advanceContent,
  annotateContent,
  surfaceAnnotations,
  archiveMedia,
  dispatchTask,
  fulfillTask,
  VALID_TRANSITIONS,
  RESPONSE_TO_STATUS,
} from "./content-process.activities.js";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OAUTH_ENCRYPTION_SECRET = "test-encryption-secret";

  // Reset default mock chain
  mockReturning.mockResolvedValue([{ id: "test-id", version: 1 }]);
  mockWhere.mockReturnValue({ returning: mockReturning });
  mockSet.mockReturnValue({ where: mockWhere });
  mockValues.mockReturnValue({ returning: mockReturning });
  mockInsert.mockReturnValue({ values: mockValues });
  mockUpdate.mockReturnValue({ set: mockSet });
  mockOrderBy.mockReturnValue([]);
  mockSelectWhere.mockReturnValue({ orderBy: mockOrderBy });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelect.mockReturnValue({ from: mockSelectFrom });
});

// --- configureBrand ---

describe("configureBrand", () => {
  it("updates brand config fields", async () => {
    const result = await configureBrand({
      tenantId: "t1",
      brandId: "b1",
      config: { name: "New Name", contentPillars: ["tech", "ai"] },
    });

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New Name",
        contentPillars: ["tech", "ai"],
      }),
    );
    expect(result).toEqual({ brandId: "b1" });
  });

  it("only sets provided fields plus updatedAt", async () => {
    await configureBrand({
      tenantId: "t1",
      brandId: "b1",
      config: { autonomyLevel: "draft" },
    });

    const setArg = mockSet.mock.calls[0][0];
    expect(setArg.autonomyLevel).toBe("draft");
    expect(setArg.updatedAt).toBeInstanceOf(Date);
    expect(setArg.name).toBeUndefined();
  });
});

// --- evolveIdentity ---

describe("evolveIdentity", () => {
  it("increments version when current identity exists", async () => {
    mockTx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue([{ id: "old-id", version: 3 }]),
        }),
      }),
    });
    mockTx.update.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn() }),
    });
    mockTx.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn() }),
    });

    const result = await evolveIdentity({
      tenantId: "t1",
      brandId: "b1",
      identityPrompt: "New voice prompt",
    });

    expect(result).toEqual({ version: 4 });
    expect(mockTx.update).toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalled();
  });

  it("starts at version 1 when no current identity", async () => {
    mockTx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue([]),
        }),
      }),
    });
    mockTx.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn() }),
    });

    const result = await evolveIdentity({
      tenantId: "t1",
      brandId: "b1",
      identityPrompt: "First voice",
    });

    expect(result).toEqual({ version: 1 });
    expect(mockTx.update).not.toHaveBeenCalled();
  });

  it("uses db.transaction for atomicity", async () => {
    mockTx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue([]),
        }),
      }),
    });
    mockTx.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn() }),
    });

    await evolveIdentity({
      tenantId: "t1",
      brandId: "b1",
      identityPrompt: "test",
    });

    expect(mockTransaction).toHaveBeenCalled();
  });
});

// --- registerChannel ---

describe("registerChannel", () => {
  it("encrypts access token", async () => {
    mockReturning.mockResolvedValue([{ id: "conn-id" }]);

    const result = await registerChannel({
      tenantId: "t1",
      brandId: "b1",
      connectionData: {
        platform: "x",
        accountId: "acc123",
        accessToken: "my-secret-token",
      },
    });

    expect(result).toEqual({ connectionId: "conn-id" });
    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.accessTokenEncrypted).toBe("encrypted:my-secret-token");
  });

  it("encrypts refresh token when provided", async () => {
    mockReturning.mockResolvedValue([{ id: "conn-id" }]);

    await registerChannel({
      tenantId: "t1",
      brandId: "b1",
      connectionData: {
        platform: "linkedin",
        accountId: "acc456",
        accessToken: "access",
        refreshToken: "refresh",
      },
    });

    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.refreshTokenEncrypted).toBe("encrypted:refresh");
  });

  it("sets refreshTokenEncrypted to null when no refresh token", async () => {
    mockReturning.mockResolvedValue([{ id: "conn-id" }]);

    await registerChannel({
      tenantId: "t1",
      brandId: "b1",
      connectionData: {
        platform: "x",
        accountId: "acc",
        accessToken: "token",
      },
    });

    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.refreshTokenEncrypted).toBeNull();
  });
});

// --- revokeChannel ---

describe("revokeChannel", () => {
  it("sets isActive to false", async () => {
    mockReturning.mockResolvedValue([{ id: "conn-id" }]);

    const result = await revokeChannel({ tenantId: "t1", connectionId: "conn-id" });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
    expect(result).toEqual({ revoked: true });
  });

  it("returns revoked=false when connection not found", async () => {
    mockReturning.mockResolvedValue([]);

    const result = await revokeChannel({ tenantId: "t1", connectionId: "nonexistent" });
    expect(result).toEqual({ revoked: false });
  });
});

// --- stageContent ---

describe("stageContent", () => {
  it("inserts content with status=draft and version=1", async () => {
    mockReturning.mockResolvedValue([{ id: "content-id", version: 1 }]);

    const result = await stageContent({
      tenantId: "t1",
      brandId: "b1",
      content: {
        type: "post",
        platform: "x",
        title: "Test Post",
        body: "Hello world",
      },
    });

    expect(result).toEqual({ contentId: "content-id", version: 1 });
    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.status).toBe("draft");
    expect(valuesArg.version).toBe(1);
    expect(valuesArg.isCurrent).toBe(true);
  });

  it("defaults producedBy to system", async () => {
    mockReturning.mockResolvedValue([{ id: "id", version: 1 }]);

    await stageContent({
      tenantId: "t1",
      brandId: "b1",
      content: { type: "article", platform: "substack" },
    });

    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.producedBy).toBe("system");
  });
});

// --- advanceContent (status transition validation) ---

describe("advanceContent", () => {
  it("allows valid transition: draft -> review", async () => {
    // advanceContent uses db.select({status}).from(content).where(...) — returns array
    mockSelectFrom.mockReturnValue({
      where: vi.fn().mockReturnValue([{ status: "draft" }]),
    });

    const result = await advanceContent({
      tenantId: "t1",
      contentId: "c1",
      targetStatus: "review",
    });

    expect(result).toEqual({ newStatus: "review" });
  });

  it("allows review -> draft (revision loop)", async () => {
    mockSelectFrom.mockReturnValue({
      where: vi.fn().mockReturnValue([{ status: "review" }]),
    });

    const result = await advanceContent({
      tenantId: "t1",
      contentId: "c1",
      targetStatus: "draft",
    });

    expect(result).toEqual({ newStatus: "draft" });
  });

  it("throws on invalid transition: draft -> published", async () => {
    mockSelectFrom.mockReturnValue({
      where: vi.fn().mockReturnValue([{ status: "draft" }]),
    });

    await expect(
      advanceContent({ tenantId: "t1", contentId: "c1", targetStatus: "published" }),
    ).rejects.toThrow("Invalid status transition: draft -> published");
  });

  it("throws on transition from archived (terminal)", async () => {
    mockSelectFrom.mockReturnValue({
      where: vi.fn().mockReturnValue([{ status: "archived" }]),
    });

    await expect(
      advanceContent({ tenantId: "t1", contentId: "c1", targetStatus: "draft" }),
    ).rejects.toThrow("Invalid status transition: archived -> draft");
  });

  it("throws when content not found", async () => {
    mockSelectFrom.mockReturnValue({
      where: vi.fn().mockReturnValue([]),
    });

    await expect(
      advanceContent({ tenantId: "t1", contentId: "missing", targetStatus: "draft" }),
    ).rejects.toThrow("Content missing not found");
  });

  it("allows any non-terminal to archived", async () => {
    for (const status of ["idea", "draft", "review", "approved", "scheduled", "published"]) {
      mockSelectFrom.mockReturnValue({
        where: vi.fn().mockReturnValue([{ status }]),
      });

      const result = await advanceContent({
        tenantId: "t1",
        contentId: "c1",
        targetStatus: "archived",
      });
      expect(result.newStatus).toBe("archived");
    }
  });
});

// --- VALID_TRANSITIONS structure ---

describe("VALID_TRANSITIONS", () => {
  it("idea can go to draft or archived", () => {
    expect(VALID_TRANSITIONS.idea).toEqual(["draft", "archived"]);
  });

  it("review can go back to draft", () => {
    expect(VALID_TRANSITIONS.review).toContain("draft");
  });

  it("archived is terminal", () => {
    expect(VALID_TRANSITIONS.archived).toEqual([]);
  });
});

// --- annotateContent ---

describe("annotateContent", () => {
  it("inserts annotation and returns id", async () => {
    mockReturning.mockResolvedValue([{ id: "ann-id" }]);

    const result = await annotateContent({
      tenantId: "t1",
      contentId: "c1",
      annotation: {
        annotationType: "voice_alignment",
        engine: "E2",
        payload: { score: 0.85 },
        confidenceScore: 0.85,
      },
    });

    expect(result).toEqual({ annotationId: "ann-id" });
  });
});

// --- surfaceAnnotations ---

describe("surfaceAnnotations", () => {
  it("returns annotations ordered by createdAt desc", async () => {
    const mockAnnotations = [
      { id: "a2", annotationType: "voice_alignment" },
      { id: "a1", annotationType: "voice_alignment" },
    ];
    // Chain: select().from().where().orderBy() -> returns rows
    mockSelectWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockOrderBy.mockReturnValue(mockAnnotations);

    const result = await surfaceAnnotations({
      tenantId: "t1",
      contentId: "c1",
    });

    expect(result.annotations).toHaveLength(2);
  });
});

// --- archiveMedia ---

describe("archiveMedia", () => {
  it("constructs storage path with tenant/brand/timestamp", async () => {
    const result = await archiveMedia({
      tenantId: "t1",
      brandId: "b1",
      mediaData: { fileName: "logo.png", contentType: "image/png" },
    });

    expect(result.objectStorePath).toMatch(/^media\/t1\/b1\/\d+-logo\.png$/);
  });
});

// --- dispatchTask ---

describe("dispatchTask", () => {
  it("inserts task and returns id", async () => {
    mockReturning.mockResolvedValue([{ id: "task-id" }]);

    const result = await dispatchTask({
      tenantId: "t1",
      brandId: "b1",
      taskType: "content_review",
      context: { contentId: "c1" },
    });

    expect(result).toEqual({ taskId: "task-id" });
    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.priority).toBe("normal");
  });

  it("uses provided priority", async () => {
    mockReturning.mockResolvedValue([{ id: "task-id" }]);

    await dispatchTask({
      tenantId: "t1",
      brandId: "b1",
      taskType: "voice_approval",
      context: {},
      priority: "urgent",
    });

    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.priority).toBe("urgent");
  });
});

// --- fulfillTask ---

describe("fulfillTask", () => {
  it("inserts response and updates task status to completed for approval", async () => {
    const result = await fulfillTask({
      tenantId: "t1",
      taskId: "task-1",
      response: {
        responseType: "approval",
        responseData: { notes: "LGTM" },
      },
    });

    expect(result).toEqual({ taskId: "task-1", outcome: "completed" });
    expect(mockInsert).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("maps rejection to rejected status", async () => {
    const result = await fulfillTask({
      tenantId: "t1",
      taskId: "task-1",
      response: {
        responseType: "rejection",
        responseData: { reason: "Off-brand" },
      },
    });

    expect(result.outcome).toBe("rejected");
  });

  it("maps revision to in_progress status", async () => {
    const result = await fulfillTask({
      tenantId: "t1",
      taskId: "task-1",
      response: {
        responseType: "revision",
        responseData: { feedback: "Needs more detail" },
      },
    });

    expect(result.outcome).toBe("in_progress");
  });
});

// --- RESPONSE_TO_STATUS mapping ---

describe("RESPONSE_TO_STATUS", () => {
  it("maps all 6 response types", () => {
    expect(RESPONSE_TO_STATUS.approval).toBe("completed");
    expect(RESPONSE_TO_STATUS.rejection).toBe("rejected");
    expect(RESPONSE_TO_STATUS.revision).toBe("in_progress");
    expect(RESPONSE_TO_STATUS.text_input).toBe("completed");
    expect(RESPONSE_TO_STATUS.voice_input).toBe("completed");
    expect(RESPONSE_TO_STATUS.selection).toBe("completed");
  });
});
