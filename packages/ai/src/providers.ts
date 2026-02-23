import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

// Default models
export const MODELS = {
  FAST: openrouter("anthropic/claude-3.5-haiku"),
  BALANCED: openrouter("anthropic/claude-sonnet-4"),
  CAPABLE: openrouter("anthropic/claude-opus-4"),
  EMBEDDING: "text-embedding-3-small",
} as const;
