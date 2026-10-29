import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/70 bg-bg/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-b from-neutral-700 to-neutral-950 text-white shadow-md ring-1 ring-black/10 dark:from-white dark:to-neutral-300 dark:text-neutral-950">
            ذ
          </span>
          ذاكرلي
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/library" className="rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-text">
            ملفاتي
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
