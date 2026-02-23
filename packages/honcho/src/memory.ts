import type { Honcho, Peer, Session } from "@honcho-ai/sdk";

/**
 * Get or create a Honcho peer.
 * Peers map to entities (users, AI agents) in our system.
 */
export async function getOrCreatePeer(
  client: Honcho,
  peerId: string,
  metadata?: Record<string, unknown>,
): Promise<Peer> {
  return client.peer(peerId, { metadata });
}

/**
 * Get or create a Honcho session for conversation tracking.
 * Sessions group related conversation turns between peers.
 */
export async function getOrCreateSession(
  client: Honcho,
  sessionId: string,
  metadata?: Record<string, unknown>,
): Promise<Session> {
  return client.session(sessionId, { metadata });
}

/**
 * Add a message to a session attributed to a peer.
 * Uses the peer.message() builder pattern from the v2 SDK.
 */
export async function addMessage(
  session: Session,
  peer: Peer,
  content: string,
): Promise<void> {
  await session.addMessages(peer.message(content));
}

/**
 * Retrieve conversation history from a Honcho session.
 * Iterates all pages via async iteration.
 */
export async function getSessionMessages(
  session: Session,
): Promise<Array<{ id: string; content: string; peerId: string }>> {
  const page = await session.messages();
  const result: Array<{ id: string; content: string; peerId: string }> = [];
  for await (const msg of page) {
    result.push({ id: msg.id, content: msg.content, peerId: msg.peerId });
  }
  return result;
}

/**
 * Query a peer's representation using natural language (dialectic).
 * Returns Honcho's insight about the peer, or null if no relevant info.
 */
export async function queryPeer(
  peer: Peer,
  query: string,
): Promise<string | null> {
  return peer.chat(query);
}
