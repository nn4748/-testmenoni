import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { AppError } from "./errors";

export const MODEL = "claude-sonnet-5-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new AppError("no_api_key");
  client ??= new Anthropic();
  return client;
}

type GenerateOptions<S extends z.ZodType> = {
  schema: S;
  system: string;
  prompt: string;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
};

// طلب واحد يرجّع JSON مضمون الشكل حسب مخطط zod.
export async function generate<S extends z.ZodType>({
  schema,
  system,
  prompt,
  effort = "medium",
  maxTokens = 16000,
}: GenerateOptions<S>): Promise<z.infer<S>> {
  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
      output_config: { effort, format: betaZodOutputFormat(schema) },
      // إذا رفض الموديل الطلب بالغلط، السيرفر يعيده على موديل بديل تلقائيًا.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
  } catch (err) {
    throw toAppError(err);
  }

  if (response.stop_reason === "refusal") throw new AppError("refused");
  if (response.stop_reason === "max_tokens") throw new AppError("too_long");
  if (!response.parsed_output) throw new AppError("bad_output");
  return response.parsed_output;
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Anthropic.AuthenticationError) return new AppError("no_api_key");
  if (err instanceof Anthropic.RateLimitError) return new AppError("busy");
  if (err instanceof Anthropic.BadRequestError) {
    console.error("anthropic bad request", err.message);
    return new AppError("too_long");
  }
  if (err instanceof Anthropic.APIConnectionError) return new AppError("ai_unreachable");
  if (err instanceof Anthropic.APIError) {
    console.error("anthropic error", err.status, err.message);
    return new AppError(err.status === 529 || (err.status ?? 0) >= 500 ? "busy" : "unknown");
  }
  console.error("generate failed", err);
  return new AppError("unknown");
}

export function languageInstruction(arabic: boolean): string {
  return arabic
    ? "اكتب كل المخرجات باللغة العربية الفصحى المبسطة، لأن الملزمة عربية. اترك المصطلحات العلمية الإنجليزية بين قوسين إذا وردت كذا في الملزمة."
    : "The lecture is in English, so write every field in clear English. Do not translate into Arabic.";
}
