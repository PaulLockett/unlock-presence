import { generateText } from "ai";
import { MODELS } from "./providers.js";

export interface CompleteOptions {
  prompt: string;
  system?: string;
  model?: Parameters<typeof generateText>[0]["model"];
  maxTokens?: number;
  temperature?: number;
}

export async function complete(options: CompleteOptions): Promise<string> {
  const result = await generateText({
    model: options.model ?? MODELS.BALANCED,
    prompt: options.prompt,
    system: options.system,
    maxTokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.7,
  });
  return result.text;
}
