export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="surface flex flex-col items-center gap-4 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-border-strong text-muted">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <div className="space-y-1">
        <p className="eyebrow">
          <span dir="ltr">Something went wrong</span>
        </p>
        <p className="mx-auto max-w-sm leading-7">{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="btn-secondary h-11">
        حاول مرة ثانية
      </button>
    </div>
  );
}
