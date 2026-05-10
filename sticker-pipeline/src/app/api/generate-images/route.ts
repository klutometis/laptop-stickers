import { experimental_generateImage as generateImage } from "ai";
import { z } from "zod";
import {
  IMAGE_MODELS,
  ASPECT_BUCKETS,
  imageSizeFor,
  type ImageModelKey,
  type AspectBucket,
} from "@/lib/models";
import { asyncChannel, ndjsonResponse } from "@/lib/ndjson";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({
  prompts: z
    .array(
      z.object({
        promptModel: z.string(),
        prompt: z.string().min(1),
        aspect: z.enum(ASPECT_BUCKETS),
      }),
    )
    .min(1),
  imageModels: z.array(z.string()).min(1),
  n: z.number().int().min(1).max(8).default(4),
});

export type ImageEvent =
  | {
      type: "image";
      promptModel: string;
      imageModel: string;
      idx: number;
      base64: string;
    }
  | {
      type: "error";
      promptModel: string;
      imageModel: string;
      idx: number;
      error: string;
    };

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { prompts, imageModels, n } = parsed.data;

  const ch = asyncChannel<ImageEvent>();

  const tasks: Array<() => Promise<void>> = [];
  for (const p of prompts) {
    for (const imKey of imageModels) {
      for (let idx = 0; idx < n; idx++) {
        const i = idx;
        tasks.push(async () => {
          const cfg = IMAGE_MODELS[imKey as ImageModelKey];
          if (!cfg) {
            ch.push({
              type: "error",
              promptModel: p.promptModel,
              imageModel: imKey,
              idx: i,
              error: `unknown image model: ${imKey}`,
            });
            return;
          }
          try {
            const sizeParams = imageSizeFor(
              imKey as ImageModelKey,
              p.aspect as AspectBucket,
            );
            const result = await generateImage({
              model: cfg.build(),
              prompt: p.prompt,
              ...sizeParams,
            });
            ch.push({
              type: "image",
              promptModel: p.promptModel,
              imageModel: imKey,
              idx: i,
              base64: result.image.base64,
            });
          } catch (err) {
            ch.push({
              type: "error",
              promptModel: p.promptModel,
              imageModel: imKey,
              idx: i,
              error: String((err as Error)?.message ?? err),
            });
          }
        });
      }
    }
  }

  const concurrency = 4;
  let cursor = 0;
  Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < tasks.length) {
        const idx = cursor++;
        await tasks[idx]();
      }
    }),
  ).finally(() => ch.close());

  return ndjsonResponse(ch);
}
