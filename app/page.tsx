import { CardsIcon, LockIcon, QuizIcon, SparkIcon, SummaryIcon } from "@/components/Icons";
import UploadForm from "@/components/UploadForm";

const FEATURES = [
  { icon: SummaryIcon, title: "ملخص منظم", body: "عناوين ونقاط رئيسية تغنيك عن قراية الملزمة كاملة." },
  { icon: CardsIcon, title: "بطاقات مراجعة", body: "سؤال في الوجه وجواب في الخلف، اقلبها وراجع بسرعة." },
  { icon: QuizIcon, title: "اختبار ذكي", body: "أسئلة اختيار من متعدد مع شرح، ويطلع لك نقاط ضعفك." },
];

const STEPS = ["ارفع الملزمة أو الصق النص", "ذاكرلي يقرأها ويجهّز المواد", "ذاكر واختبر نفسك"];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <SparkIcon className="size-3.5 text-brand" />
          مدعوم بالذكاء الاصطناعي
        </span>
        <h1 className="text-[1.75rem] font-bold leading-[1.35] tracking-tight sm:text-4xl">
          ملزمتك تصير
          <span className="text-brand"> مذاكرة جاهزة </span>
          في دقيقة
        </h1>
        <p className="mx-auto max-w-md leading-7 text-muted">
          ارفع ملف المحاضرة، وخذ ملخص وبطاقات مراجعة واختبار بنفس لغة الملزمة.
        </p>
      </section>

      <UploadForm />

      <section className="grid gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3 rounded-2xl border border-border bg-surface p-4 sm:block">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand sm:mb-3">
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
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-text text-sm font-semibold text-bg">
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
