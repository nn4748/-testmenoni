"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppError, MESSAGES } from "@/lib/errors";
import { newId, saveDoc } from "@/lib/storage";
import {
  MAX_PDF_BYTES,
  MAX_UPLOAD_BYTES,
  assertUsableText,
  cleanText,
  titleFromFileName,
  titleFromText,
} from "@/lib/text";
import type { ApiError, StudyDoc } from "@/lib/types";
import Spinner from "./Spinner";

type Mode = "pdf" | "text";

async function readPdf(file: File): Promise<{ text: string; pages: number }> {
  if (file.size <= MAX_UPLOAD_BYTES) {
    const body = new FormData();
    body.append("file", file);
    let res: Response;
    try {
      res = await fetch("/api/extract", { method: "POST", body });
    } catch {
      throw new AppError("network");
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data as ApiError | null)?.message ?? MESSAGES.unknown);
    return data;
  }
  // الملفات الكبيرة ما تمر من حد Vercel، فنقرأها هنا في المتصفح.
  const { extractPdfText } = await import("@/lib/pdf");
  return extractPdfText(await file.arrayBuffer());
}

export default function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function pickFile(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
      setError(MESSAGES.not_pdf);
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      setError(MESSAGES.too_large);
      return;
    }
    setFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let doc: StudyDoc;
      if (mode === "pdf") {
        if (!file) throw new AppError("no_file");
        const { text, pages } = await readPdf(file);
        assertUsableText(text);
        doc = {
          id: newId(),
          title: titleFromFileName(file.name),
          source: "pdf",
          text,
          pages,
          createdAt: Date.now(),
        };
      } else {
        const text = cleanText(pasted);
        assertUsableText(text);
        doc = { id: newId(), title: titleFromText(text), source: "text", text, createdAt: Date.now() };
      }
      if (!saveDoc(doc)) {
        throw new Error("مساحة المتصفح ممتلئة. احذف بعض الملفات القديمة من \"ملفاتي\" وحاول مرة ثانية.");
      }
      router.push(`/study/${doc.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : MESSAGES.unknown);
      setBusy(false);
    }
  }

  const canSubmit = !busy && (mode === "pdf" ? !!file : pasted.trim().length > 0);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
        {(
          [
            ["pdf", "رفع ملف PDF"],
            ["text", "لصق نص"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`h-10 rounded-lg text-sm font-medium transition ${
              mode === value ? "bg-surface shadow-sm" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "pdf" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
            dragging ? "border-brand bg-brand-soft" : "border-border bg-surface"
          }`}
        >
          <svg className="size-10 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
            <path d="M14 3v5h5M12 18v-6M9 15l3-3 3 3" />
          </svg>
          {file ? (
            <div>
              <p className="font-medium break-all">{file.name}</p>
              <p className="text-sm text-muted">
                {(file.size / 1024 / 1024).toFixed(1)} ميجا · اضغط لتغيير الملف
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium">اضغط لاختيار ملف PDF</p>
              <p className="text-sm text-muted">أو اسحبه هنا · الحد الأقصى 20 ميجا</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="الصق نص المحاضرة هنا…"
          dir="auto"
          rows={10}
          className="w-full resize-y rounded-2xl border border-border bg-surface p-4 leading-7 outline-none focus:border-brand"
        />
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-brand-ink transition disabled:opacity-40"
      >
        {busy ? (
          <>
            <Spinner /> نقرأ الملزمة…
          </>
        ) : (
          "ابدأ"
        )}
      </button>
    </form>
  );
}
