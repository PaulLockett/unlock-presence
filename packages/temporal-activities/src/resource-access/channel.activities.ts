// RA1: Channel Access — Encapsulates platform API volatility

export async function distribute(_input: {
  tenantId: string;
  brandId: string;
  contentId: string;
  platform: string;
}): Promise<{ platformPostId: string; url?: string }> {
  throw new Error("Not implemented: RA1.distribute");
}

export async function harvest(_input: {
  tenantId: string;
  brandId: string;
  platform: string;
  contentIds: string[];
}): Promise<{ metricsCount: number }> {
  throw new Error("Not implemented: RA1.harvest");
}

export async function connect(_input: {
  tenantId: string;
  brandId: string;
  platform: string;
}): Promise<{ connectionId: string }> {
  throw new Error("Not implemented: RA1.connect");
}

export async function disconnect(_input: {
  tenantId: string;
  connectionId: string;
}): Promise<{ revoked: boolean }> {
  throw new Error("Not implemented: RA1.disconnect");
}
