import { MESSAGES } from "./errors";
import type { ApiError } from "./types";

// يرسل طلب للسيرفر ويرمي خطأ برسالة عربية مفهومة إذا فشل.
export async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(MESSAGES.network);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data as ApiError | null)?.message ?? MESSAGES.unknown);
  }
  return data as T;
}
