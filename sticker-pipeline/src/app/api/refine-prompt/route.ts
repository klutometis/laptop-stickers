import { generateText } from "ai";
import { z } from "zod";
import { TEXT_MODELS, type TextModelKey } from "@/lib/models";
import { STICKER_SYSTEM_PROMPT } from "@/lib/sticker-prompt";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  idea: z.string().min(1),
  models: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { idea, models } = parsed.data;

  const results = await Promise.allSettled(
    models.map(async (key) => {
      const cfg = TEXT_MODELS[key as TextModelKey];
      if (!cfg) throw new Error(`unknown text model: ${key}`);
      const { text } = await generateText({
        model: cfg.build(),
        system: STICKER_SYSTEM_PROMPT,
        prompt: idea,
      });
      return { model: key, prompt: text.trim() };
    }),
  );

  return Response.json({
    results: results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { model: models[i], error: String(r.reason?.message ?? r.reason) },
    ),
  });
}
