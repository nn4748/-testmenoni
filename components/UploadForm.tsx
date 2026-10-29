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
import { CloseIcon, FileIcon, UploadIcon } from "./Icons";
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
  const chars = pasted.trim().length;

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-3xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] sm:p-5"
    >
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
            disabled={busy}
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`h-10 rounded-lg text-sm font-medium transition ${
              mode === value ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "pdf" ? (
        file ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <FileIcon className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium" dir="auto">
                {file.name}
              </p>
              <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} ميجا · PDF</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label="إزالة الملف"
              className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-text"
            >
              <CloseIcon />
            </button>
          </div>
        ) : (
          <button
            type="button"
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
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-9 text-center transition ${
              dragging ? "border-brand bg-brand-soft" : "border-border hover:border-brand/60 hover:bg-surface-2"
            }`}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <UploadIcon className="size-7" />
            </span>
            <span>
              <span className="block font-semibold">اختر ملف PDF</span>
              <span className="mt-1 block text-sm text-muted">أو اسحبه هنا · حتى 20 ميجا</span>
            </span>
          </button>
        )
      ) : (
        <div className="relative">
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="الصق نص المحاضرة هنا…"
            dir="auto"
            rows={9}
            disabled={busy}
            className="w-full resize-y rounded-2xl border border-border bg-surface-2 p-4 pb-8 leading-7 outline-none transition focus:border-brand focus:bg-surface"
          />
          <span className="pointer-events-none absolute bottom-3 left-4 text-xs text-muted">
            {chars.toLocaleString("ar-EG")} حرف
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />

      {error && (
        <p role="alert" className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm leading-6 text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-brand-ink shadow-sm transition hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
      >
        {busy ? (
          <>
            <Spinner /> {mode === "pdf" ? "نقرأ الملزمة…" : "نجهّز النص…"}
          </>
        ) : (
          "ابدأ المذاكرة"
        )}
      </button>
    </form>
  );
}
