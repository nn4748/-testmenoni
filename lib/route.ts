import "server-only";
import type { z } from "zod";
import { AppError, errorResponse } from "./errors";
import { GenerateRequestSchema } from "./schemas";
import { MAX_TEXT_CHARS, assertUsableText } from "./text";

const STATUS: Partial<Record<AppError["code"], number>> = {
  bad_request: 400,
  no_api_key: 500,
  busy: 503,
  ai_unreachable: 502,
  refused: 422,
  too_long: 422,
  bad_output: 502,
  too_short: 422,
  empty_text: 422,
  text_too_long: 413,
};

// يقرأ جسم الطلب ويتأكد إن نص الملزمة صالح.
export async function readBody<S extends z.ZodType<{ text: string }>>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new AppError("bad_request");
  const { text } = parsed.data;
  assertUsableText(text);
  if (text.length > MAX_TEXT_CHARS) throw new AppError("text_too_long");
  return parsed.data;
}

export async function readText(request: Request): Promise<string> {
  return (await readBody(request, GenerateRequestSchema)).text;
}

export function handleError(err: unknown) {
  if (err instanceof AppError) {
    return errorResponse(err.code, STATUS[err.code] ?? 500);
  }
  console.error(err);
  return errorResponse("unknown", 500);
}
