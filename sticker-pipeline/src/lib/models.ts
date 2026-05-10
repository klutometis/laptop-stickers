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
