import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-ink">
            ذ
          </span>
          ذاكرلي
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
