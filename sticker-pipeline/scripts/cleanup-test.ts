/**
 * One-off test: ask NB2 and gpt-image-2 to flatten a colored sticker image —
 * remove drop shadows, paper-curl shading, photographic effects — so it's
 * clean enough for Cricut "Print Then Cut" auto-detect.
 *
 * Usage:
 *   npx tsx scripts/cleanup-test.ts <input.png> [prompt]
 *
 * Sibling of monochrome-test.ts. Same shape: runs both providers in parallel,
 * saves outputs next to the input as `<stem>-clean-<model>.png`.
 */

import { experimental_generateImage as generateImage } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";

const DEFAULT_PROMPT = `Flatten this sticker into clean, flat vector-style artwork on a pure white background.

Remove entirely:
  - The white sticker border / rim / outline around the artwork. There should be NO sticker-shaped white border. The colored artwork should sit directly on the pure white background.
  - Any drop shadow under the sticker.
  - Any paper-curl shading or 3D/photographic lighting effects.
  - Any soft gradients, halos, or glow.
  - Any speckles, texture, or off-white tones in the background.

Preserve:
  - The colored artwork itself (sun, cloud, faces, internal black outlines) exactly as designed — same colors, same shapes, same proportions, same composition and placement.

The result should look like clean digital vector art floating on pure white — flat fills, sharp edges, no sticker border, no 3D effects, ready to print. Cricut's offset tool will add the sticker rim later; we don't need it baked into the image.`;

async function generate(
  modelFn: () => Parameters<typeof generateImage>[0]["model"],
  inputBuffer: Buffer,
  prompt: string,
  sizeParams:
    | { aspectRatio: `${number}:${number}` }
    | { size: `${number}x${number}` },
): Promise<Buffer> {
  const result = await generateImage({
    model: modelFn(),
    prompt: { text: prompt, images: [inputBuffer] } as never,
    ...sizeParams,
  });
  return Buffer.from(result.image.base64, "base64");
}

async function main() {
  const inputPath = process.argv[2];
  const prompt = process.argv[3] ?? DEFAULT_PROMPT;
  if (!inputPath) {
    console.error("Usage: npx tsx scripts/cleanup-test.ts <input.png> [prompt]");
    process.exit(1);
  }

  console.log(`input:  ${inputPath}`);
  console.log(`prompt: ${prompt.split("\n")[0]}${prompt.includes("\n") ? " …" : ""}`);
  console.log();

  const inputBuffer = await readFile(inputPath);
  const stem = basename(inputPath, extname(inputPath));
  const dir = dirname(inputPath);

  const tasks = [
    {
      label: "nb2",
      fn: () =>
        generate(
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
          () => openai.image("gpt-image-2"),
          inputBuffer,
          prompt,
          { size: "1024x1024" },
        ),
    },
  ];

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
      const outPath = join(dir, `${stem}-clean-${label}.png`);
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
