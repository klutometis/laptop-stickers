import { streamText } from "ai";
import { z } from "zod";
import { TEXT_MODELS, type TextModelKey } from "@/lib/models";
import { STICKER_SYSTEM_PROMPT } from "@/lib/sticker-prompt";
import { asyncChannel, ndjsonResponse } from "@/lib/ndjson";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  idea: z.string().min(1),
  models: z.array(z.string()).min(1),
});

export type RefineEvent =
  | { type: "delta"; model: string; text: string }
  | { type: "done"; model: string }
  | { type: "error"; model: string; error: string };

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { idea, models } = parsed.data;

  const ch = asyncChannel<RefineEvent>();

  // Kick off all model streams in parallel; close the channel when all done.
  Promise.all(
    models.map(async (key) => {
      const cfg = TEXT_MODELS[key as TextModelKey];
      if (!cfg) {
        ch.push({ type: "error", model: key, error: `unknown model: ${key}` });
        return;
      }
      try {
        const { textStream } = streamText({
          model: cfg.build(),
          system: STICKER_SYSTEM_PROMPT,
          prompt: idea,
        });
        for await (const delta of textStream) {
          ch.push({ type: "delta", model: key, text: delta });
        }
        ch.push({ type: "done", model: key });
      } catch (err) {
        ch.push({
          type: "error",
          model: key,
          error: String((err as Error)?.message ?? err),
        });
      }
    }),
  ).finally(() => ch.close());

  return ndjsonResponse(ch);
}
