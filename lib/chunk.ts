// تقسيم النص الطويل على حدود الفقرات بدل ما ينقطع في نص جملة.
// ~120 ألف حرف تقريبًا 30–40 ألف توكن، وهذا حجم مريح لطلب واحد.
export const CHUNK_CHARS = 120_000;

export function chunkText(text: string, maxChars = CHUNK_CHARS): string[] {
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      // فقرة ضخمة بدون فواصل: نقسمها على نهايات الجمل.
      push();
      for (const sentence of para.split(/(?<=[.!?؟。])\s+/)) {
        if (current.length + sentence.length + 1 > maxChars) push();
        current += (current ? " " : "") + sentence;
      }
      push();
      continue;
    }
    if (current.length + para.length + 2 > maxChars) push();
    current += (current ? "\n\n" : "") + para;
  }
  push();
  return chunks;
}

// نشغّل الأجزاء بالتوازي بس بحد أقصى عشان ما نضغط على حد الطلبات.
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
