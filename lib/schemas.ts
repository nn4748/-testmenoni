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

export const GenerateRequestSchema = z.object({
  text: z.string().min(1),
});
