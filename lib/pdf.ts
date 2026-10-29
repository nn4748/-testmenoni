import { extractText, getDocumentProxy } from "unpdf";
import { AppError } from "./errors";
import { cleanText } from "./text";

// تشتغل على السيرفر وفي المتصفح.
export async function extractPdfText(
  data: ArrayBuffer,
): Promise<{ text: string; pages: number }> {
  let result: { totalPages: number; text: string[] };
  try {
    const pdf = await getDocumentProxy(new Uint8Array(data));
    result = await extractText(pdf, { mergePages: false });
  } catch {
    throw new AppError("pdf_failed");
  }
  const text = cleanText(result.text.join("\n\n"));
  if (!text) throw new AppError("empty_text");
  return { text, pages: result.totalPages };
}
