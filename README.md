# ذاكرلي

تطبيق ويب لطلاب الجامعة: ترفع ملزمة المحاضرة (PDF أو نص ملصوق)، ويحوّلها لك Claude إلى:

- **ملخص منظم**: عناوين، نقاط رئيسية، ومصطلحات مهمة.
- **بطاقات مراجعة**: سؤال في الوجه وجواب في الخلف، تنقلب، مع مراجعة اللي ما عرفتها.
- **اختبار اختيار من متعدد**: تختار عدد الأسئلة (الافتراضي 10)، وبعد التسليم تشوف درجتك وشرح كل سؤال وقسم **نقاط ضعفك**.

المحتوى يطلع بنفس لغة الملزمة (عربي أو إنجليزي). الملفات والنتائج تنحفظ في متصفح الطالب (localStorage) بدون تسجيل دخول.

## التقنيات

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Anthropic SDK الرسمي، والموديل `claude-sonnet-5-5`
- structured outputs مع zod عشان الملخص والبطاقات والاختبار يرجعون JSON مضمون الشكل
- unpdf لاستخراج نص الـ PDF

## التشغيل محليًا

تحتاج Node.js نسخة 20 أو أحدث.

```bash
npm install
cp .env.example .env.local
```

افتح `.env.local` وحط مفتاحك من [console.anthropic.com](https://console.anthropic.com):

```
ANTHROPIC_API_KEY=sk-ant-...
```

بعدها:

```bash
npm run dev
```

وافتح http://localhost:3000

أوامر ثانية:

| الأمر | وش يسوي |
| --- | --- |
| `npm run build` | يبني نسخة الإنتاج ويتأكد من الأنواع |
| `npm run lint` | يفحص الكود |
| `npm start` | يشغّل نسخة الإنتاج بعد البناء |

## النشر على Vercel

1. ارفع المشروع على GitHub (هذا المستودع).
2. ادخل [vercel.com/new](https://vercel.com/new) وسجّل دخول بحساب GitHub.
3. اختر المستودع واضغط **Import**. Vercel يتعرف على Next.js لحاله، لا تغيّر إعدادات البناء.
4. قبل ما تضغط Deploy، افتح **Environment Variables** وأضف:
   - Name: `ANTHROPIC_API_KEY`
   - Value: مفتاحك
5. اضغط **Deploy**. بعد دقيقة أو دقيقتين يعطيك رابط مثل `https://your-app.vercel.app`.

كل ما ترفع commit جديد على `main`، Vercel ينشر التحديث تلقائيًا.

> **مدة التوليد:** الملزمات الطويلة ممكن تاخذ أكثر من دقيقة. المسارات مضبوطة على `maxDuration = 300` ثانية، وهذا مدعوم في خطط Vercel الحالية مع Fluid Compute (مفعّل افتراضيًا). إذا طلع لك خطأ timeout، تأكد إن Fluid Compute مفعّل من إعدادات المشروع.

## كيف يشتغل

```
app/
  page.tsx               الصفحة الرئيسية: رفع PDF أو لصق نص
  study/[id]/page.tsx    تبويبات الملخص والبطاقات والاختبار
  library/page.tsx       ملفاتي وسجل النتائج
  results/[id]/page.tsx  عرض نتيجة اختبار سابقة
  api/
    extract/             استخراج نص الـ PDF (unpdf)
    summary/             توليد الملخص
    flashcards/          توليد البطاقات
    quiz/                توليد الاختبار
lib/
  anthropic.ts           عميل Claude (على السيرفر فقط) ومعالجة الأخطاء
  schemas.ts             مخططات zod لكل المخرجات
  chunk.ts               تقسيم النص الطويل على حدود الفقرات
  summarize.ts, flashcards.ts, quiz.ts   منطق التوليد لكل نوع
  storage.ts             الحفظ في localStorage
```

- **المفتاح ما يوصل للمتصفح أبدًا:** كل استدعاءات Claude من Route Handlers على السيرفر، و`lib/anthropic.ts` محمي بـ `server-only`.
- **الملفات الكبيرة:** Vercel ما يقبل طلب أكبر من ~4.5MB، فالـ PDF اللي حجمه 4MB أو أقل يتقرأ على السيرفر، والأكبر (لين 20MB) يتقرأ في المتصفح بنفس المكتبة، ويوصل للسيرفر النص بس.
- **المحتوى الطويل:** إذا النص أطول من ~120 ألف حرف، يتقسم على حدود الفقرات، كل جزء يتعالج لحاله (3 بالتوازي)، وبعدين تندمج النتائج.
- **الاختبار:** الخيارات تنخلط على السيرفر عشان مكان الجواب الصحيح ما يتكرر، وكل سؤال يتحقق إن له 4 خيارات وجواب صحيح واحد.
- **نقاط الضعف:** كل سؤال له `topic`، والأسئلة الغلط تنجمع حسب الموضوع وتترتب من الأضعف.
- **fallbacks:** إذا رفض الموديل طلب بالغلط، السيرفر يعيده تلقائيًا على موديل بديل.

## شكل الـ JSON

```ts
Summary   = { language: "ar" | "en", title, overview, sections: { heading, points[] }[], keyTerms: { term, definition }[] }
Flashcard = { front, back, topic }
Quiz      = { questions: { question, options[4], correctIndex, explanation, topic }[] }
```
