import { AppError, errorResponse } from "@/lib/errors";
import { extractPdfText } from "@/lib/pdf";
import { MAX_UPLOAD_BYTES, assertUsableText, titleFromFileName } from "@/lib/text";

export const maxDuration = 60;

export async function POST(request: Request) {
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return errorResponse("no_file", 400);
  }
  if (!(file instanceof File)) return errorResponse("no_file", 400);
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
    return errorResponse("not_pdf", 415);
  }
  if (file.size > MAX_UPLOAD_BYTES) return errorResponse("too_large", 413);

  try {
    const { text, pages } = await extractPdfText(await file.arrayBuffer());
    assertUsableText(text);
    return Response.json({ text, pages, title: titleFromFileName(file.name) });
  } catch (err) {
    if (err instanceof AppError) return errorResponse(err.code, 422);
    console.error("extract failed", err);
    return errorResponse("unknown", 500);
  }
}
