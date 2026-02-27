import type { SseEvent } from "@presence-os/schemas";

export interface SseWriter {
  writeSSE(data: { event: string; data: string }): Promise<void>;
}

interface Connection {
  tenantId: string;
  brandId?: string;
  writer: SseWriter;
}

/**
 * In-memory SSE connection manager.
 * SSE handlers register connections; webhook pushes events to matching connections.
 */
export class ConnectionManager {
  private connections: Set<Connection> = new Set();

  addConnection(tenantId: string, brandId: string | undefined, writer: SseWriter): Connection {
    const conn: Connection = { tenantId, brandId, writer };
    this.connections.add(conn);
    return conn;
  }

  removeConnection(conn: Connection): void {
    this.connections.delete(conn);
  }

  /**
   * Fan-out an event to all matching SSE connections.
   * Matches by tenantId, and optionally by brandId.
   * Tenant-level connections (no brandId filter) receive all brand events.
   */
  async broadcast(event: SseEvent): Promise<number> {
    let delivered = 0;
    const promises: Promise<void>[] = [];

    for (const conn of this.connections) {
      if (conn.tenantId !== event.tenantId) continue;
      if (conn.brandId && event.brandId && conn.brandId !== event.brandId) continue;

      promises.push(
        conn.writer
          .writeSSE({ event: event.type, data: JSON.stringify(event) })
          .then(() => { delivered++; })
          .catch(() => {
            this.connections.delete(conn);
          }),
      );
    }

    await Promise.allSettled(promises);
    return delivered;
  }

  get size(): number {
    return this.connections.size;
  }
}
