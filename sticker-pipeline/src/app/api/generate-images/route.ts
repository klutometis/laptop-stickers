import { experimental_generateImage as generateImage } from "ai";
import { z } from "zod";
import { IMAGE_MODELS, type ImageModelKey } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({
  // [{ promptModel, prompt }]
  prompts: z
    .array(z.object({ promptModel: z.string(), prompt: z.string().min(1) }))
    .min(1),
  imageModels: z.array(z.string()).min(1),
  n: z.number().int().min(1).max(8).default(4),
});

type Cell = {
  promptModel: string;
  imageModel: string;
  images: Array<{ base64: string } | { error: string }>;
};

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { prompts, imageModels, n } = parsed.data;

  // Cartesian product: each prompt × each image model × n images
  const cellTasks: Array<() => Promise<Cell>> = [];
  for (const p of prompts) {
    for (const imKey of imageModels) {
      cellTasks.push(async () => {
        const cfg = IMAGE_MODELS[imKey as ImageModelKey];
        if (!cfg)
          return {
            promptModel: p.promptModel,
            imageModel: imKey,
            images: Array.from({ length: n }, () => ({
              error: `unknown image model: ${imKey}`,
            })),
          };
        // n parallel calls (Gemini doesn't support n parameter; uniform pattern)
        const calls = await Promise.allSettled(
          Array.from({ length: n }, () =>
            generateImage({
              model: cfg.build(),
              prompt: p.prompt,
              aspectRatio: "1:1",
            }),
          ),
        );
        return {
          promptModel: p.promptModel,
          imageModel: imKey,
          images: calls.map((c) =>
            c.status === "fulfilled"
              ? { base64: c.value.image.base64 }
              : { error: String(c.reason?.message ?? c.reason) },
          ),
        };
      });
    }
  }

  // Throttle to 4 concurrent cell-tasks to avoid hammering rate limits
  const cells: Cell[] = [];
  const concurrency = 4;
  let i = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (i < cellTasks.length) {
        const idx = i++;
        cells[idx] = await cellTasks[idx]();
      }
    }),
  );

  return Response.json({ cells });
}
