import { streamObject } from "ai";
import { z } from "zod";
import {
  TEXT_MODELS,
  ASPECT_BUCKETS,
  type TextModelKey,
  type AspectBucket,
} from "@/lib/models";
import { STICKER_SYSTEM_PROMPT } from "@/lib/sticker-prompt";
import { asyncChannel, ndjsonResponse } from "@/lib/ndjson";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  idea: z.string().min(1),
  models: z.array(z.string()).min(1),
});

const RefinedSchema = z.object({
  prompt: z
    .string()
    .describe(
      "The image-generation prompt, single paragraph, 60-150 words. Describe the desired flat/graphic style positively. No negative directives.",
    ),
  aspect: z
    .enum(ASPECT_BUCKETS)
    .describe(
      "Aspect ratio bucket that fits the subject's natural shape. Default to 'square'.",
    ),
  rationale: z
    .string()
    .describe("One short sentence explaining the aspect choice."),
});

export type RefinedObject = z.infer<typeof RefinedSchema>;

export type RefineEvent =
  | {
      type: "partial";
      model: string;
      partial: Partial<RefinedObject>;
    }
  | { type: "done"; model: string; object: RefinedObject }
  | { type: "error"; model: string; error: string };

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { idea, models } = parsed.data;

  const ch = asyncChannel<RefineEvent>();

  Promise.all(
    models.map(async (key) => {
      const cfg = TEXT_MODELS[key as TextModelKey];
      if (!cfg) {
        ch.push({ type: "error", model: key, error: `unknown model: ${key}` });
        return;
      }
      try {
        const { partialObjectStream, object } = streamObject({
          model: cfg.build(),
          schema: RefinedSchema,
          system: STICKER_SYSTEM_PROMPT,
          prompt: idea,
        });
        for await (const partial of partialObjectStream) {
          ch.push({
            type: "partial",
            model: key,
            partial: partial as Partial<RefinedObject>,
          });
        }
        const final = await object;
        ch.push({ type: "done", model: key, object: final });
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

// Re-export for the client to import the AspectBucket type without
// pulling in server-only modules.
export type { AspectBucket };
