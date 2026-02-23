// E2: Identity Engine — Encapsulates brand identity volatility

export async function evaluate(_input: {
  tenantId: string;
  brandId: string;
  contentId: string;
}): Promise<{ annotationId: string; alignmentScore: number }> {
  throw new Error("Not implemented: E2.evaluate");
}

export async function refine(_input: {
  tenantId: string;
  brandId: string;
}): Promise<{ identityVersion: number }> {
  throw new Error("Not implemented: E2.refine");
}

export async function absorb(_input: {
  tenantId: string;
  brandId: string;
  userInput: unknown;
}): Promise<{ signalCount: number }> {
  throw new Error("Not implemented: E2.absorb");
}
