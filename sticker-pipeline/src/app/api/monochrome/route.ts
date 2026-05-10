import sharp from "sharp";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  base64: z.string().min(1),
  threshold: z.number().int().min(0).max(255).default(128),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { base64, threshold } = parsed.data;

  const input = Buffer.from(base64, "base64");
  // Grayscale → threshold → flatten any alpha against white → output PNG.
  const out = await sharp(input)
    .flatten({ background: "#ffffff" })
    .grayscale()
    .threshold(threshold)
    .png()
    .toBuffer();

  return Response.json({ base64: out.toString("base64") });
}
