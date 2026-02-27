import { describe, it, expect, vi } from "vitest";
import {
  getOrCreatePeer,
  getOrCreateSession,
  addMessage,
  getSessionMessages,
  queryPeer,
} from "../src/memory.js";
import type { Honcho, Peer, Session } from "@honcho-ai/sdk";

function mockClient(): Honcho {
  return {
    peer: vi.fn().mockResolvedValue({ id: "peer-1", name: "test-peer" }),
    session: vi.fn().mockResolvedValue({ id: "session-1" }),
  } as unknown as Honcho;
}

function mockPeer(): Peer {
  return {
    id: "peer-1",
    message: vi.fn().mockReturnValue({ content: "hello", peerId: "peer-1" }),
    chat: vi.fn().mockResolvedValue("insight about the user"),
  } as unknown as Peer;
}

function mockSession(): Session {
  return {
    id: "session-1",
    addMessages: vi.fn().mockResolvedValue(undefined),
    messages: vi.fn().mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield { id: "msg-1", content: "hello", peerId: "peer-1" };
        yield { id: "msg-2", content: "world", peerId: "peer-2" };
      },
    }),
  } as unknown as Session;
}

describe("getOrCreatePeer", () => {
  it("calls client.peer with id and metadata", async () => {
    const client = mockClient();
    const peer = await getOrCreatePeer(client, "peer-1", { role: "agent" });
    expect(client.peer).toHaveBeenCalledWith("peer-1", { metadata: { role: "agent" } });
    expect(peer).toEqual({ id: "peer-1", name: "test-peer" });
  });

  it("works without metadata", async () => {
    const client = mockClient();
    await getOrCreatePeer(client, "peer-1");
    expect(client.peer).toHaveBeenCalledWith("peer-1", { metadata: undefined });
  });
});

describe("getOrCreateSession", () => {
  it("calls client.session with id and metadata", async () => {
    const client = mockClient();
    const session = await getOrCreateSession(client, "sess-1", { brandId: "b1" });
    expect(client.session).toHaveBeenCalledWith("sess-1", { metadata: { brandId: "b1" } });
    expect(session).toEqual({ id: "session-1" });
  });
});

describe("addMessage", () => {
  it("builds a peer message and adds to session", async () => {
    const session = mockSession();
    const peer = mockPeer();
    await addMessage(session, peer, "hello");
    expect(peer.message).toHaveBeenCalledWith("hello");
    expect(session.addMessages).toHaveBeenCalledWith({ content: "hello", peerId: "peer-1" });
  });
});

describe("getSessionMessages", () => {
  it("iterates all messages from session", async () => {
    const session = mockSession();
    const messages = await getSessionMessages(session);
    expect(messages).toEqual([
      { id: "msg-1", content: "hello", peerId: "peer-1" },
      { id: "msg-2", content: "world", peerId: "peer-2" },
    ]);
  });
});

describe("queryPeer", () => {
  it("calls peer.chat with query string", async () => {
    const peer = mockPeer();
    const result = await queryPeer(peer, "what does the user prefer?");
    expect(peer.chat).toHaveBeenCalledWith("what does the user prefer?");
    expect(result).toBe("insight about the user");
  });

  it("returns null when peer has no insight", async () => {
    const peer = mockPeer();
    (peer.chat as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await queryPeer(peer, "unknown question");
    expect(result).toBeNull();
  });
});
