import { z } from "zod";

export const SummarySchema = z.object({
  language: z.enum(["ar", "en"]).describe("لغة الملزمة الغالبة"),
  title: z.string().describe("عنوان قصير يوصف موضوع المحاضرة"),
  overview: z.string().describe("فقرة من جملتين أو ثلاث تلخص الفكرة العامة"),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        points: z.array(z.string()),
      }),
    )
    .describe("أقسام الملخص بنفس ترتيب المحاضرة"),
  keyTerms: z
    .array(z.object({ term: z.string(), definition: z.string() }))
    .describe("أهم المصطلحات وتعريف مختصر لكل واحد"),
});

export type Summary = z.infer<typeof SummarySchema>;

export const FlashcardSchema = z.object({
  front: z.string().describe("سؤال قصير أو مصطلح في وجه البطاقة"),
  back: z.string().describe("جواب مختصر ودقيق في خلف البطاقة"),
  topic: z.string().describe("الموضوع أو القسم اللي تنتمي له البطاقة، بكلمتين إلى أربع"),
});

export const FlashcardDeckSchema = z.object({
  cards: z.array(FlashcardSchema),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

export const GenerateRequestSchema = z.object({
  text: z.string().min(1),
});
