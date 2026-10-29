import { CardsIcon, LockIcon, QuizIcon, SparkIcon, SummaryIcon } from "@/components/Icons";
import HeroStage from "@/components/hero/HeroStage";
import UploadForm from "@/components/UploadForm";

const FEATURES = [
  { icon: SummaryIcon, title: "ملخص منظم", body: "عناوين ونقاط رئيسية تغنيك عن قراية الملزمة كاملة." },
  { icon: CardsIcon, title: "بطاقات مراجعة", body: "سؤال في الوجه وجواب في الخلف، اقلبها وراجع بسرعة." },
  { icon: QuizIcon, title: "اختبار ذكي", body: "أسئلة اختيار من متعدد مع شرح، ويطلع لك نقاط ضعفك." },
];

const STEPS = ["ارفع الملزمة أو الصق النص", "ذاكرلي يقرأها ويجهّز المواد", "ذاكر واختبر نفسك"];

export default function Home() {
  return (
    <div className="page space-y-10">
      <section className="animate-rise space-y-5 pt-6 text-center">
        <span className="chip mx-auto bg-surface">
          <SparkIcon className="size-3.5 text-text" />
          مدعوم بالذكاء الاصطناعي
        </span>
        <h1 className="text-[2rem] font-bold leading-[1.3] sm:text-5xl sm:leading-[1.25]">
          ملزمتك تصير
          <br />
          <span className="bg-gradient-to-l from-neutral-500 via-neutral-950 to-neutral-500 bg-clip-text text-transparent dark:from-neutral-500 dark:via-white dark:to-neutral-500">
            مذاكرة جاهزة
          </span>{" "}
          في دقيقة
        </h1>
        <p className="mx-auto max-w-md leading-7 text-muted">
          ارفع ملف المحاضرة، وخذ ملخص منظم وبطاقات مراجعة واختبار يكشف نقاط ضعفك، بنفس لغة الملزمة.
        </p>
      </section>

      <HeroStage className="mx-auto h-80 w-full max-w-md" />

      <UploadForm />

      <section className="grid gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="surface flex gap-3 p-4 sm:block">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-text text-bg shadow-md sm:mb-3">
              <Icon />
            </span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-0.5 text-sm leading-6 text-muted">{body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">كيف يشتغل؟</h2>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface text-sm font-semibold shadow-sm">
                {(i + 1).toLocaleString("ar-EG")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <LockIcon className="size-3.5" />
        ما نخزّن ملفاتك عندنا، تنحفظ في جهازك وبدون تسجيل دخول.
      </p>
    </div>
  );
}
