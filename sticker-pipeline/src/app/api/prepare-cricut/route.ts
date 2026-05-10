import { experimental_generateImage as generateImage } from "ai";
import { z } from "zod";
import { join } from "node:path";
import {
  IMAGE_MODELS,
  IMAGE_MODEL_KEYS,
  type ImageModelKey,
} from "@/lib/models";
import { CLEANUP_PROMPT, MONOCHROME_PROMPT } from "@/lib/sticker-prompt";
import { run, withTempDir, readFile, writeFile } from "@/lib/shell";
import { asyncChannel, ndjsonResponse } from "@/lib/ndjson";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({
  base64: z.string().min(1),
});

export type PrepareEvent =
  | { type: "png"; model: ImageModelKey; track: "cleanup"; base64: string }
  | { type: "svg"; model: ImageModelKey; track: "vinyl"; svg: string }
  | { type: "error"; model: ImageModelKey; track: "cleanup" | "vinyl"; error: string };

// Run AI cleanup on the colored input → return clean PNG bytes for print-then-cut.
async function aiCleanup(
  modelKey: ImageModelKey,
  inputBuffer: Buffer,
): Promise<Buffer> {
  const cfg = IMAGE_MODELS[modelKey];
  const sizeParams =
    modelKey === "nano-banana-2"
      ? { aspectRatio: "1:1" as const }
      : { size: "1024x1024" as const };
  const result = await generateImage({
    model: cfg.build(),
    prompt: { text: CLEANUP_PROMPT, images: [inputBuffer] } as never,
    ...sizeParams,
  });
  return Buffer.from(result.image.base64, "base64");
}

// Run AI monochrome → potrace → trimmed SVG for vinyl cut.
async function aiMonochromeToSvg(
  modelKey: ImageModelKey,
  inputBuffer: Buffer,
): Promise<string> {
  const cfg = IMAGE_MODELS[modelKey];
  const sizeParams =
    modelKey === "nano-banana-2"
      ? { aspectRatio: "1:1" as const }
      : { size: "1024x1024" as const };
  const monoResult = await generateImage({
    model: cfg.build(),
    prompt: { text: MONOCHROME_PROMPT, images: [inputBuffer] } as never,
    ...sizeParams,
  });
  const monoBuffer = Buffer.from(monoResult.image.base64, "base64");

  return await withTempDir("prepare-cricut", async (dir) => {
    const pngPath = join(dir, "in.png");
    const pnmPath = join(dir, "in.pnm");
    const svgPath = join(dir, "out.svg");
    await writeFile(pngPath, monoBuffer);

    const conv = await run("convert", [pngPath, pnmPath]);
    if (conv.code !== 0) throw new Error(`convert failed: ${conv.stderr}`);

    // potrace 'sharp' preset (best for AI-generated silhouettes; matches
    // png-to-svg-potrace.sh in the parent repo).
    const pot = await run("potrace", [
      pnmPath,
      "--svg",
      "-o",
      svgPath,
      "-t",
      "0",
      "-a",
      "0.8",
      "-O",
      "0.1",
    ]);
    if (pot.code !== 0) throw new Error(`potrace failed: ${pot.stderr}`);

    const trim = await run("inkscape", [
      svgPath,
      "--export-area-drawing",
      "--export-type=svg",
      `--export-filename=${svgPath}`,
      "--export-overwrite",
    ]);
    if (trim.code !== 0) throw new Error(`inkscape trim failed: ${trim.stderr}`);

    return await readFile(svgPath, "utf8");
  });
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const inputBuffer = Buffer.from(parsed.data.base64, "base64");

  const ch = asyncChannel<PrepareEvent>();

  const tasks: Array<Promise<void>> = [];
  for (const modelKey of IMAGE_MODEL_KEYS) {
    // Cleanup → PNG (print-then-cut)
    tasks.push(
      (async () => {
        try {
          const buf = await aiCleanup(modelKey, inputBuffer);
          ch.push({
            type: "png",
            model: modelKey,
            track: "cleanup",
            base64: buf.toString("base64"),
          });
        } catch (err) {
          ch.push({
            type: "error",
            model: modelKey,
            track: "cleanup",
            error: String((err as Error)?.message ?? err),
          });
        }
      })(),
    );

    // Monochrome → potrace → SVG (vinyl cut)
    tasks.push(
      (async () => {
        try {
          const svg = await aiMonochromeToSvg(modelKey, inputBuffer);
          ch.push({ type: "svg", model: modelKey, track: "vinyl", svg });
        } catch (err) {
          ch.push({
            type: "error",
            model: modelKey,
            track: "vinyl",
            error: String((err as Error)?.message ?? err),
          });
        }
      })(),
    );
  }

  Promise.all(tasks).finally(() => ch.close());

  return ndjsonResponse(ch);
}
