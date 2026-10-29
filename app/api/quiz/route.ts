import { makeQuiz } from "@/lib/quiz";
import { handleError, readBody } from "@/lib/route";
import { QuizRequestSchema } from "@/lib/schemas";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { text, count } = await readBody(request, QuizRequestSchema);
    return Response.json({ questions: await makeQuiz(text, count) });
  } catch (err) {
    return handleError(err);
  }
}
