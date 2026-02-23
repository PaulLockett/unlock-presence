import { generateObject } from "ai";
import { MODELS } from "./providers.js";
import type { z } from "zod";

export interface StructureOptions<T extends z.ZodType> {
  prompt: string;
  schema: T;
  system?: string;
  model?: Parameters<typeof generateObject>[0]["model"];
  temperature?: number;
}

export async function structure<T extends z.ZodType>(
  options: StructureOptions<T>,
): Promise<z.infer<T>> {
  const result = await generateObject({
    model: options.model ?? MODELS.BALANCED,
    prompt: options.prompt,
    schema: options.schema,
    system: options.system,
    temperature: options.temperature ?? 0.3,
  });
  return result.object;
}
