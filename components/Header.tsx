import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-3 z-40 px-3">
      <div className="mx-auto flex h-12 max-w-2xl items-center justify-between rounded-2xl border border-border bg-[var(--glass)] ps-2 pe-1.5 shadow-lux backdrop-blur-2xl backdrop-saturate-150">
        <Link href="/" className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 font-semibold">
          <Logo />
          ذاكرلي
        </Link>
        <nav className="flex items-center gap-0.5">
          <Link href="/library" className="btn-ghost h-9">
            ملفاتي
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

// شعار: ثلاث صفحات متراكبة، نفس فكرة المجسم في الواجهة.
function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
      <defs>
        <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x="4" y="16" width="20" height="5" rx="1.5" fill="url(#chrome)" opacity="0.45" />
      <rect x="4" y="11" width="20" height="5" rx="1.5" fill="url(#chrome)" opacity="0.7" transform="rotate(-4 14 13.5)" />
      <rect x="4" y="6" width="20" height="5" rx="1.5" fill="url(#chrome)" transform="rotate(5 14 8.5)" />
    </svg>
  );
}
