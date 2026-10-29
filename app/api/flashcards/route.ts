import { makeFlashcards } from "@/lib/flashcards";
import { handleError, readText } from "@/lib/route";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const text = await readText(request);
    return Response.json({ cards: await makeFlashcards(text) });
  } catch (err) {
    return handleError(err);
  }
}
