import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- Mock DB ---

const mockReturning = vi.fn();
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockReturning });
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
const mockLimit = vi.fn().mockReturnValue([]);
// where() returns an array-like that also has .limit() for chaining
const mockSelectWhere = vi.fn(() => {
  const result = Object.assign([] as unknown[], { limit: mockLimit });
  return result;
});
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

const mockDb = {
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
};

vi.mock("@presence-os/db", () => ({
  createDb: vi.fn(() => mockDb),
  channelConnections: {
    id: "cc.id",
    tenantId: "cc.tenantId",
    brandId: "cc.brandId",
    platform: "cc.platform",
    isActive: "cc.isActive",
  },
  content: {
    id: "content.id",
    tenantId: "content.tenantId",
    title: "content.title",
    body: "content.body",
    mediaUrls: "content.mediaUrls",
  },
  contentPerformance: {},
}));

vi.mock("@presence-os/auth", () => ({
  encryptToken: vi.fn((token: string) => `encrypted:${token}`),
  decryptToken: vi.fn((cipher: string) => cipher.replace("encrypted:", "")),
}));

vi.mock("./adapters/index.js", () => ({
  getAdapter: vi.fn(() => ({
    post: vi.fn(),
    getMetrics: vi.fn(),
  })),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ op: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
  inArray: vi.fn((...args: unknown[]) => ({ op: "inArray", args })),
}));

import {
  connect,
  disconnect,
  distribute,
  harvest,
  _setAdapterFactory,
  _resetAdapterFactory,
  type PlatformAdapter,
} from "./channel.activities.js";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OAUTH_ENCRYPTION_SECRET = "test-encryption-secret";
  mockReturning.mockResolvedValue([{ id: "test-id" }]);
  mockLimit.mockReturnValue([]);
  mockSelectWhere.mockReturnValue({ limit: mockLimit });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdate.mockReturnValue({ set: mockUpdateSet });
});

afterEach(() => {
  _resetAdapterFactory();
});

// --- connect ---

describe("connect", () => {
  it("encrypts tokens and inserts connection", async () => {
    mockReturning.mockResolvedValue([{ id: "conn-123" }]);

    const result = await connect({
      tenantId: "t1",
      brandId: "b1",
      platform: "x",
      accountId: "user123",
      accessToken: "secret-token",
    });

    expect(result).toEqual({ connectionId: "conn-123" });
    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.accessTokenEncrypted).toBe("encrypted:secret-token");
    expect(valuesArg.refreshTokenEncrypted).toBeNull();
  });
});

// --- disconnect ---

describe("disconnect", () => {
  it("clears tokens and sets inactive", async () => {
    mockReturning.mockResolvedValue([{ id: "conn-123" }]);

    const result = await disconnect({ tenantId: "t1", connectionId: "conn-123" });

    expect(result).toEqual({ revoked: true });
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
        accessTokenEncrypted: "",
        refreshTokenEncrypted: null,
      }),
    );
  });

  it("returns revoked=false when not found", async () => {
    mockReturning.mockResolvedValue([]);

    const result = await disconnect({ tenantId: "t1", connectionId: "missing" });
    expect(result).toEqual({ revoked: false });
  });
});

// --- distribute ---

describe("distribute", () => {
  it("fetches connection and content, calls adapter, updates lastUsedAt", async () => {
    const mockAdapter: PlatformAdapter = {
      post: vi.fn().mockResolvedValue({ platformPostId: "x-123", url: "https://x.com/123" }),
      getMetrics: vi.fn(),
    };
    _setAdapterFactory(() => mockAdapter);

    // First select (connection): chains .where().limit(1)
    // Second select (content): chains .where() only (destructures directly)
    let selectCall = 0;
    mockSelectWhere.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) {
        // Connection query — uses .limit()
        return Object.assign([] as unknown[], {
          limit: vi.fn().mockReturnValue([{ id: "conn-1", accountId: "acc1", accessTokenEncrypted: "encrypted:secret-token" }]),
        });
      }
      // Content query — destructured directly from .where()
      return [{ title: "Test", body: "Hello", mediaUrls: [] }];
    });

    // Mock update for lastUsedAt (no .returning() needed)
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn(),
      }),
    });

    const result = await distribute({
      tenantId: "t1",
      brandId: "b1",
      contentId: "c1",
      platform: "x",
    });

    expect(result).toEqual({ platformPostId: "x-123", url: "https://x.com/123" });
    expect(mockAdapter.post).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "secret-token" }),
    );
  });

  it("throws when no active connection", async () => {
    mockLimit.mockReturnValue([]);

    await expect(
      distribute({ tenantId: "t1", brandId: "b1", contentId: "c1", platform: "x" }),
    ).rejects.toThrow("No active connection for brand b1 on x");
  });

  it("throws when content not found", async () => {
    let selectCall = 0;
    mockSelectWhere.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) {
        return Object.assign([] as unknown[], {
          limit: vi.fn().mockReturnValue([{ id: "conn-1", accountId: "acc1", accessTokenEncrypted: "encrypted:tok" }]),
        });
      }
      return []; // Content not found
    });

    await expect(
      distribute({ tenantId: "t1", brandId: "b1", contentId: "missing", platform: "x" }),
    ).rejects.toThrow("Content missing not found");
  });
});

// --- harvest ---

describe("harvest", () => {
  it("fetches metrics from adapter and writes to DB", async () => {
    const mockAdapter: PlatformAdapter = {
      post: vi.fn(),
      getMetrics: vi.fn().mockResolvedValue([
        {
          contentId: "c1",
          impressions: 100,
          engagements: 10,
          clicks: 5,
          reach: 200,
          engagementRate: 0.05,
          rawPlatformData: {},
        },
        {
          contentId: "c2",
          impressions: 50,
          engagements: 5,
          clicks: 2,
          reach: 100,
          engagementRate: 0.04,
          rawPlatformData: {},
        },
      ]),
    };
    _setAdapterFactory(() => mockAdapter);

    mockLimit.mockReturnValue([{ id: "conn-1", accountId: "acc1", accessTokenEncrypted: "encrypted:harvest-token" }]);

    const result = await harvest({
      tenantId: "t1",
      brandId: "b1",
      platform: "linkedin",
      contentIds: ["c1", "c2"],
    });

    expect(result).toEqual({ metricsCount: 2 });
    expect(mockInsert).toHaveBeenCalled();
  });

  it("throws when no active connection", async () => {
    mockLimit.mockReturnValue([]);

    await expect(
      harvest({ tenantId: "t1", brandId: "b1", platform: "x", contentIds: ["c1"] }),
    ).rejects.toThrow("No active connection");
  });
});
