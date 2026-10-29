import "server-only";
import { ApiError, FinishReason, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AppError } from "./errors";
import type { GenerateOptions } from "./ai";

// أحدث موديل Flash عليه طبقة مجانية في Google AI Studio.
export const GEMINI_MODEL = "gemini-3.8-flash";

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

  let response;
  try {
    response = await getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
        maxOutputTokens: maxTokens,
      },
    });
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

function safeJson(text: string | undefined): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
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
