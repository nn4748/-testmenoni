"use client";

import { motion } from "motion/react";
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
import GeneratingState from "./GeneratingState";
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
    <form onSubmit={submit} className="surface space-y-4 rounded-[1.75rem] p-3 sm:p-4">
      {busy && (
        <GeneratingState
          variant="overlay"
          steps={mode === "pdf" ? ["نفتح الملف…", "نقرأ الصفحات…", "نجهّز المذاكرة…"] : ["نرتّب النص…", "نجهّز المذاكرة…"]}
          hint="ثواني بس"
        />
      )}

      <div role="tablist" className="relative grid grid-cols-2 rounded-2xl bg-surface-2 p-1">
        {(
          [
            ["pdf", "ملف PDF"],
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
            className={`relative h-10 rounded-xl text-sm font-medium transition-colors duration-300 ${
              mode === value ? "text-text" : "text-faint hover:text-muted"
            }`}
          >
            {mode === value && (
              <motion.span
                layoutId="upload-tab"
                className="absolute inset-0 rounded-xl border border-border bg-surface shadow-lux"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {mode === "pdf" ? (
        file ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border-strong bg-surface-2 p-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-neutral-700 to-black text-white ring-1 ring-white/10">
              <FileIcon className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium" dir="auto">
                {file.name}
              </p>
              <p className="text-xs tabular-nums text-faint">{(file.size / 1024 / 1024).toFixed(1)} MB · PDF</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label="إزالة الملف"
              className="btn-ghost size-9 p-0"
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
            data-dragging={dragging || undefined}
            className="dropzone group relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl px-4 py-12 text-center"
          >
            <span className="relative grid size-16 place-items-center rounded-2xl bg-gradient-to-b from-neutral-700 to-black text-white shadow-lux ring-1 ring-white/10 transition-transform duration-700 ease-out-expo group-hover:-translate-y-1 group-data-[dragging]:-translate-y-2 group-data-[dragging]:scale-110">
              <UploadIcon className="size-7" />
            </span>
            <span className="relative">
              <span className="block text-lg font-semibold">{dragging ? "أفلت الملف هنا" : "اختر ملف PDF"}</span>
              <span className="mt-1 block text-sm text-faint">أو اسحبه هنا · حتى ٢٠ ميجا</span>
            </span>
          </button>
        )
      ) : (
        <div className="relative">
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="الصق نص المحاضرة هنا…"
            aria-label="نص المحاضرة"
            dir="auto"
            rows={9}
            disabled={busy}
            className="w-full resize-y rounded-2xl border border-border bg-surface-2 p-4 pb-9 leading-8 outline-none transition placeholder:text-faint focus:border-border-strong focus:bg-surface-3"
          />
          <span className="pointer-events-none absolute bottom-3 left-4 text-xs tabular-nums text-faint">
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
        <p role="alert" className="rounded-xl border border-border-strong bg-surface-2 px-4 py-3 text-sm leading-7">
          {error}
        </p>
      )}

      <button type="submit" disabled={!canSubmit} className="btn-primary h-13 w-full text-base">
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
