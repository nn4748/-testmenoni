import "server-only";
import { ApiError, FinishReason, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import { AppError } from "./errors";
import type { GenerateOptions } from "./ai";

// موديلات عليها طبقة مجانية في Google AI Studio، بالترتيب. إذا واحد عليه ضغط ننتقل للي بعده.
export const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-2.5-flash", "gemini-3.5-flash-lite"];

// كل محاولة لها حد، عشان مجموع المحاولات ما يتعدى حد Vercel (300 ثانية).
const ATTEMPT_TIMEOUT_MS = 70_000;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) throw new AppError("no_api_key");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

// نفس فكرة Claude: نعطي الموديل مخطط JSON، ونتحقق من الرد بـ zod.
export async function generateWithGemini<S extends z.ZodType>({
  schema,
  system,
  prompt,
  maxTokens = 32000,
}: GenerateOptions<S>): Promise<z.infer<S>> {
  const jsonSchema = cleanSchema(z.toJSONSchema(schema));

  const request = (model: string) =>
    getClient().models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
        maxOutputTokens: maxTokens,
        // تفكير قليل: الملخص والأسئلة ما تحتاج تفكير طويل، وهذا يسرّع الرد كثير.
        thinkingConfig: model.startsWith("gemini-2.5") ? { thinkingBudget: 0 } : { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      },
    });

  let response;
  try {
    response = await withFallback(request);
  } catch (err) {
    throw toAppError(err);
  }

  if (response.promptFeedback?.blockReason) throw new AppError("refused");
  const finish = response.candidates?.[0]?.finishReason;
  if (finish === FinishReason.SAFETY || finish === FinishReason.PROHIBITED_CONTENT) throw new AppError("refused");
  if (finish === FinishReason.MAX_TOKENS) throw new AppError("too_long");

  const parsed = schema.safeParse(safeJson(response.text));
  if (!parsed.success) throw new AppError("bad_output");
  return parsed.data;
}

// نخلي بس الحقول اللي يدعمها Gemini في مخطط JSON.
const KEEP = new Set(["type", "properties", "required", "items", "enum", "description", "anyOf", "format", "minimum", "maximum"]);

function cleanSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(cleanSchema);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (!KEEP.has(key)) continue;
    out[key] =
      key === "properties"
        ? Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, cleanSchema(v)]))
        : cleanSchema(value);
  }
  return out;
}

// 503 (ضغط مؤقت): نعيد مرة على نفس الموديل ثم ننتقل. 429 (حد الطلبات): ننتقل مباشرة، لأن كل موديل له حدّه.
async function withFallback<T>(request: (model: string) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await request(model);
      } catch (err) {
        lastError = err;
        const status = err instanceof ApiError ? err.status : 0;
        if (isTimeout(err)) break;
        if (status === 503 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        if (status === 503 || status === 429 || status === 404) break;
        throw err;
      }
    }
  }
  throw lastError;
}

function isTimeout(err: unknown): boolean {
  return err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
}

function safeJson(text: string | undefined): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (isTimeout(err)) return new AppError("busy");
  if (err instanceof ApiError) {
    console.error("gemini error", err.status, err.message);
    if (err.status === 401 || err.status === 403) return new AppError("no_api_key");
    if (err.status === 429) return new AppError("busy");
    if (err.status === 400) return new AppError("too_long");
    return new AppError(err.status >= 500 ? "busy" : "unknown");
  }
  console.error("gemini failed", err);
  return new AppError("ai_unreachable");
}
