import HeroStage from "@/components/hero/HeroStage";
import { LockIcon } from "@/components/Icons";
import { CardsPreview, QuizPreview, SummaryPreview } from "@/components/landing/Previews";
import Magnetic from "@/components/motion/Magnetic";
import { MaskLines, Reveal } from "@/components/motion/Reveal";
import UploadForm from "@/components/UploadForm";

const CHAPTERS = [
  {
    no: "01",
    en: "Summary",
    ar: "ملخص يغنيك عن الملزمة",
    body: "عناوين واضحة ونقاط مركّزة ومصطلحات مهمة، بنفس ترتيب المحاضرة وبنفس لغتها.",
    preview: <SummaryPreview />,
  },
  {
    no: "02",
    en: "Flashcards",
    ar: "بطاقات تثبّت المعلومة",
    body: "سؤال في الوجه وجواب في الخلف. اقلبها، علّم اللي عرفته، وارجع للي فاتك.",
    preview: <CardsPreview />,
  },
  {
    no: "03",
    en: "Quiz",
    ar: "اختبار يكشف نقاط ضعفك",
    body: "أسئلة اختيار من متعدد بشرح لكل جواب، وبعد التسليم تعرف بالضبط وش تراجع.",
    preview: <QuizPreview />,
  },
];

export default function Home() {
  return (
    <div className="-mt-20">
      {/* الواجهة: مجسم، عنوان واحد قوي، وزر واحد. */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-28 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(50%_60%_at_50%_0%,var(--spot),transparent)]"
        />
        <HeroStage className="h-[42svh] w-full max-w-xl sm:h-[46vh]" />

        <div className="relative -mt-4 space-y-6">
          <Reveal>
            <p className="eyebrow" dir="ltr">Zakerly — AI study companion</p>
          </Reveal>
          <h1 className="font-display text-[3.4rem] leading-[0.92] sm:text-display-lg">
            <MaskLines lines={["Study.", <em key="d" className="text-muted">Distilled.</em>]} delay={0.15} />
          </h1>
          <Reveal delay={0.45}>
            <p className="mx-auto max-w-sm text-lg leading-8 text-muted">
              ارفع ملزمتك، وخذ ملخص وبطاقات مراجعة واختبار، في دقيقة.
            </p>
          </Reveal>
          <Reveal delay={0.6}>
            <Magnetic className="inline-block">
              <a href="#start" className="btn-primary h-13 px-7 text-base">
                ابدأ برفع ملزمة
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </a>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      {/* ثلاث فصول: كل مخرج له مشهده. */}
      <div className="page space-y-28 py-12 sm:space-y-40">
        {CHAPTERS.map((c) => (
          <section key={c.no} className="space-y-10">
            <div className="space-y-4">
              <Reveal>
                <p className="eyebrow">
                  <span dir="ltr" className="inline-block">
                    {c.no} <span className="mx-2 text-border-strong">/</span> {c.en}
                  </span>
                </p>
              </Reveal>
              <h2 className="text-[2rem] font-semibold leading-[1.25] sm:text-[2.5rem]">
                <MaskLines lines={[c.ar]} />
              </h2>
              <Reveal delay={0.15}>
                <p className="max-w-md leading-8 text-muted">{c.body}</p>
              </Reveal>
            </div>
            <Reveal delay={0.2}>{c.preview}</Reveal>
          </section>
        ))}
      </div>

      {/* الرفع */}
      <section id="start" className="page scroll-mt-24 space-y-8 py-24">
        <div className="space-y-4 text-center">
          <Reveal>
            <p className="eyebrow">Begin</p>
          </Reveal>
          <h2 className="font-display text-display-sm sm:text-display">
            <MaskLines
              lines={[
                <span key="l">
                  Your lecture, <em className="text-muted">please.</em>
                </span>,
              ]}
            />
          </h2>
          <Reveal delay={0.1}>
            <p className="text-muted">PDF حتى ٢٠ ميجا، أو الصق النص مباشرة.</p>
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <UploadForm />
        </Reveal>
        <p className="flex items-center justify-center gap-1.5 text-xs text-faint">
          <LockIcon className="size-3.5" />
          ما نخزّن ملفاتك عندنا. تنحفظ في جهازك، بدون تسجيل دخول.
        </p>
      </section>
    </div>
  );
}
