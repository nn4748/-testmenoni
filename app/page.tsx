import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="pt-4">
        <h1 className="text-2xl font-bold leading-snug">
          ارفع ملزمتك، وذاكرلي يجهّز لك المذاكرة
        </h1>
        <p className="mt-2 text-muted">
          ملخص منظم، بطاقات مراجعة، واختبار يكشف لك نقاط ضعفك.
        </p>
      </section>
      <UploadForm />
    </div>
  );
}
