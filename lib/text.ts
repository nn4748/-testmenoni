import { AppError } from "./errors";

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
// Vercel يرفض أي طلب جسمه أكبر من ~4.5MB، فالملفات الأكبر نقرأها في المتصفح.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MIN_TEXT_CHARS = 200;

export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function assertUsableText(text: string): void {
  if (!text) throw new AppError("empty_text");
  if (text.length < MIN_TEXT_CHARS) throw new AppError("too_short");
}

export function titleFromFileName(name: string): string {
  return name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim() || "ملزمة بدون عنوان";
}

export function titleFromText(text: string): string {
  const firstLine = text.split("\n").find((l) => l.trim().length > 0) ?? "";
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine || "نص ملصوق";
}

export function isArabic(text: string): boolean {
  const sample = text.slice(0, 4000);
  const arabic = sample.match(/[؀-ۿ]/g)?.length ?? 0;
  const latin = sample.match(/[A-Za-z]/g)?.length ?? 0;
  return arabic >= latin;
}
