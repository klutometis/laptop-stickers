/**
 * One-off test: ask NB2 and gpt-image-2 to convert a reference image to
 * monochrome (filled black silhouettes on white). Saves both outputs next to
 * the input so we can eyeball how each model handles the task.
 *
 * Usage:
 *   npx tsx scripts/monochrome-test.ts <input.png> [prompt]
 *
 * Default prompt aims for cuttable silhouettes (filled shapes, no line art,
 * no gradients). Override with a custom prompt as the second arg to try
 * variations (line art, two-tone, etc.).
 */

import { experimental_generateImage as generateImage } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";

const DEFAULT_PROMPT = `Convert this image into clean, flat, monochrome silhouettes suitable for vinyl cutting on a Cricut.

Requirements:
  - Replace every colored region with a solid black fill on a pure white background.
  - Preserve the overall shapes and their separability (e.g. sun and cloud remain distinct silhouettes with a visible white gap between them).
  - Remove all gradients, shading, anti-aliasing, internal line details, eyes, mouths, and decorative outlines.
  - The result should look like a hand-cut paper stencil: bold, minimal, single-color filled shapes only.
  - White background must be pure white (no off-white, no shadow).`;

async function generate(
  label: string,
  modelFn: () => Parameters<typeof generateImage>[0]["model"],
  inputBuffer: Buffer,
  prompt: string,
  sizeParams:
    | { aspectRatio: `${number}:${number}` }
    | { size: `${number}x${number}` },
): Promise<Buffer> {
  const result = await generateImage({
    model: modelFn(),
    prompt: { text: prompt, images: [inputBuffer] } as never, // SDK types are loose for image+text
    ...sizeParams,
  });
  return Buffer.from(result.image.base64, "base64");
}

async function main() {
  const inputPath = process.argv[2];
  const prompt = process.argv[3] ?? DEFAULT_PROMPT;
  if (!inputPath) {
    console.error("Usage: npx tsx scripts/monochrome-test.ts <input.png> [prompt]");
    process.exit(1);
  }

  console.log(`input:  ${inputPath}`);
  console.log(`prompt: ${prompt.split("\n")[0]}${prompt.includes("\n") ? " …" : ""}`);
  console.log();

  const inputBuffer = await readFile(inputPath);
  const stem = basename(inputPath, extname(inputPath));
  const dir = dirname(inputPath);

  const tasks: Array<{
    label: string;
    fn: () => Promise<Buffer>;
  }> = [
    {
      label: "nb2",
      fn: () =>
        generate(
          "nb2",
          () => google.image("gemini-3.1-flash-image-preview"),
          inputBuffer,
          prompt,
          { aspectRatio: "1:1" },
        ),
    },
    {
      label: "gpt-image-2",
      fn: () =>
        generate(
          "gpt-image-2",
          () => openai.image("gpt-image-2"),
          inputBuffer,
          prompt,
          { size: "1024x1024" },
        ),
    },
  ];

  // Run both in parallel so total wall time is max(NB2, OAI) instead of sum
  const results = await Promise.allSettled(
    tasks.map(async (t) => {
      const t0 = Date.now();
      const buf = await t.fn();
      return { label: t.label, buf, ms: Date.now() - t0 };
    }),
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      const { label, buf, ms } = r.value;
      const outPath = join(dir, `${stem}-mono-${label}.png`);
      await writeFile(outPath, buf);
      console.log(`✓ ${label}: ${outPath} (${(ms / 1000).toFixed(1)}s)`);
    } else {
      console.log(`✗ ${(r.reason as Error)?.message ?? r.reason}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
