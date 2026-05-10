import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

export type TextModelKey = "claude-opus-4-7" | "gpt-5.5" | "gemini-3.1-pro";
export type ImageModelKey = "nano-banana-2" | "gpt-image-2";

export const TEXT_MODELS: Record<
  TextModelKey,
  { label: string; build: () => ReturnType<typeof anthropic> }
> = {
  "claude-opus-4-7": {
    label: "Claude Opus 4.7",
    build: () => anthropic("claude-opus-4-7"),
  },
  "gpt-5.5": {
    label: "GPT-5.5",
    build: () => openai("gpt-5.5"),
  },
  "gemini-3.1-pro": {
    label: "Gemini 3.1 Pro",
    build: () => google("gemini-3.1-pro-preview"),
  },
};

export const IMAGE_MODELS: Record<
  ImageModelKey,
  { label: string; build: () => ReturnType<typeof openai.image> }
> = {
  "nano-banana-2": {
    label: "Nano Banana 2",
    build: () => google.image("gemini-3.1-flash-image-preview"),
  },
  "gpt-image-2": {
    label: "GPT Image 2",
    build: () => openai.image("gpt-image-2"),
  },
};

export const TEXT_MODEL_KEYS = Object.keys(TEXT_MODELS) as TextModelKey[];
export const IMAGE_MODEL_KEYS = Object.keys(IMAGE_MODELS) as ImageModelKey[];

// ── Aspect ratio buckets ────────────────────────────────────────────────────
// Refining text models pick a bucket; we map to per-provider params here.
// See plans/sticker-pipeline.md "Aspect ratio buckets" for the full table.

export const ASPECT_BUCKETS = [
  "square",
  "landscape",
  "portrait",
  "panorama",
  "banner",
] as const;

export type AspectBucket = (typeof ASPECT_BUCKETS)[number];

export const ASPECT_LABELS: Record<AspectBucket, string> = {
  square: "Square (1:1)",
  landscape: "Landscape (3:2)",
  portrait: "Portrait (2:3)",
  panorama: "Panorama (21:9)",
  banner: "Banner (4:1, NB-only — degraded on OpenAI)",
};

// Per-provider size params for generateImage().
// OpenAI is capped at ratio ≤ 3:1, so `banner` degrades to OpenAI's widest panorama.
export function imageSizeFor(
  model: ImageModelKey,
  aspect: AspectBucket,
):
  | { aspectRatio: `${number}:${number}` }
  | { size: `${number}x${number}` } {
  if (model === "nano-banana-2") {
    const ratios: Record<AspectBucket, `${number}:${number}`> = {
      square: "1:1",
      landscape: "3:2",
      portrait: "2:3",
      panorama: "21:9",
      banner: "4:1",
    };
    return { aspectRatio: ratios[aspect] };
  }
  if (model === "gpt-image-2") {
    const sizes: Record<AspectBucket, `${number}x${number}`> = {
      square: "1024x1024",
      landscape: "1536x1024",
      portrait: "1024x1536",
      panorama: "2304x1024", // ~9:4, OpenAI's widest within 3:1 cap
      banner: "2304x1024", // degraded; OpenAI can't do 4:1
    };
    return { size: sizes[aspect] };
  }
  throw new Error(`unknown image model: ${model satisfies never}`);
}
