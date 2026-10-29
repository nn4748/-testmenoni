import "server-only";
import type { z } from "zod";
import { generateWithClaude } from "./anthropic";
import { AppError } from "./errors";
import { generateWithGemini } from "./gemini";

export type GenerateOptions<S extends z.ZodType> = {
  schema: S;
  system: string;
  prompt: string;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
};

// المزوّد يتحدد من المفاتيح الموجودة: Claude إذا فيه مفتاحه، وإلا Gemini (مجاني).
export function generate<S extends z.ZodType>(options: GenerateOptions<S>): Promise<z.infer<S>> {
  if (process.env.ANTHROPIC_API_KEY) return generateWithClaude(options);
  if (process.env.GEMINI_API_KEY) return generateWithGemini(options);
  throw new AppError("no_api_key");
}

export function languageInstruction(arabic: boolean): string {
  return arabic
    ? "اكتب كل المخرجات باللغة العربية الفصحى المبسطة، لأن الملزمة عربية. اترك المصطلحات العلمية الإنجليزية بين قوسين إذا وردت كذا في الملزمة."
    : "The lecture is in English, so write every field in clear English. Do not translate into Arabic.";
}
