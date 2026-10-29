import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Instrument_Serif } from "next/font/google";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ذاكرلي · Study, distilled.",
  description: "حوّل ملزمتك لملخص وبطاقات مراجعة واختبار في دقيقة.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

// الوضع الليلي هو الأساس، إلا إذا اختار الطالب الفاتح. يتطبّق قبل أول رسم عشان ما تومض الصفحة.
const themeScript = `try{if(localStorage.getItem("zakerli:theme")!=="light")document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1 pb-20 pt-20">{children}</main>
          <footer className="page space-y-4 border-t border-border py-8 text-xs text-faint">
            <div className="flex items-center justify-between">
              <span>ذاكرلي</span>
              <span className="eyebrow">
                <span dir="ltr">Study, distilled.</span>
              </span>
            </div>
            <p className="text-center">
              <span dir="ltr" className="font-display text-base tracking-normal text-muted">
                Made by <em>Nourah Aleissa</em>
              </span>
            </p>
          </footer>
        </Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
