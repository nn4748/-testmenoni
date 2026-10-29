export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="space-y-4 rounded-2xl border border-danger/20 bg-danger-soft p-5 text-center">
      <p className="leading-7 text-danger">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-11 rounded-xl bg-text px-5 text-sm font-semibold text-bg transition hover:opacity-90"
      >
        حاول مرة ثانية
      </button>
    </div>
  );
}
