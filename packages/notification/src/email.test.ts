import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEmail } from "./email.js";

const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe("sendEmail", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockSend.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns queued: false when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });
    expect(result.queued).toBe(false);
  });

  it("sends email and returns queued: true on success", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockResolvedValue({ error: null });

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Weekly Report",
      html: "<p>Report</p>",
    });
    expect(result.queued).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Weekly Report",
      }),
    );
  });

  it("returns queued: false on Resend error", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockResolvedValue({ error: { message: "Invalid recipient" } });

    const result = await sendEmail({
      to: "bad@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
    });
    expect(result.queued).toBe(false);
  });

  it("uses custom from address when provided", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockResolvedValue({ error: null });

    await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      from: "Custom <custom@example.com>",
    });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: "Custom <custom@example.com>" }),
    );
  });
});
