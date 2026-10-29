import { handleError, readText } from "@/lib/route";
import { summarize } from "@/lib/summarize";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const text = await readText(request);
    return Response.json(await summarize(text));
  } catch (err) {
    return handleError(err);
  }
}
