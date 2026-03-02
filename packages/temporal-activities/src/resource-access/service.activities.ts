// RA2: Service Access — Encapsulates external non-AI service volatility

const VALID_BILLING_ACTIONS = [
  "create_subscription",
  "cancel_subscription",
  "update_plan",
  "create_customer",
] as const;

type BillingAction = (typeof VALID_BILLING_ACTIONS)[number];

// --- Input types ---

interface ProcessBillingInput {
  tenantId: string;
  action: string;
  params: Record<string, unknown>;
}

interface DeployAssetInput {
  tenantId: string;
  brandId: string;
  artifactId: string;
}

// --- Activities ---

export async function processBilling(input: ProcessBillingInput): Promise<{ success: boolean; subscriptionId?: string }> {
  if (!VALID_BILLING_ACTIONS.includes(input.action as BillingAction)) {
    throw new Error(
      `Invalid billing action: ${input.action}. Valid actions: ${VALID_BILLING_ACTIONS.join(", ")}`,
    );
  }

  // Stub: real Stripe integration added with PRE-12 (Service Access)
  return {
    success: true,
    subscriptionId: `sub_${input.tenantId}_${Date.now()}`,
  };
}

export async function deployAsset(input: DeployAssetInput): Promise<{ deploymentUrl: string }> {
  if (!input.tenantId || !input.brandId || !input.artifactId) {
    throw new Error("tenantId, brandId, and artifactId are required");
  }

  // Stub: real Vercel deployment added with PRE-12 (Service Access)
  return {
    deploymentUrl: `https://assets.presence-os.dev/${input.tenantId}/${input.brandId}/${input.artifactId}`,
  };
}

export { VALID_BILLING_ACTIONS };
