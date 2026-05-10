import { z } from "zod";
import { join } from "node:path";
import { run, withTempDir, readFile, writeFile } from "@/lib/shell";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  base64: z.string().min(1), // monochrome PNG
  preset: z.enum(["default", "high", "max", "sharp"]).default("sharp"),
  breakApart: z.boolean().default(false),
});

const PRESETS = {
  default: { turdsize: 2, alphamax: 1.0, opttol: 0.2, longcurve: false },
  high: { turdsize: 1, alphamax: 1.0, opttol: 0.1, longcurve: false },
  max: { turdsize: 0, alphamax: 1.0, opttol: 0.05, longcurve: true },
  sharp: { turdsize: 0, alphamax: 0.8, opttol: 0.1, longcurve: false },
} as const;

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { base64, preset, breakApart } = parsed.data;
  const cfg = PRESETS[preset];

  const svg = await withTempDir("sticker-vec", async (dir) => {
    const pngPath = join(dir, "in.png");
    const pnmPath = join(dir, "in.pnm");
    const svgPath = join(dir, "out.svg");

    await writeFile(pngPath, Buffer.from(base64, "base64"));

    // PNG → PNM (potrace can't read PNG directly)
    const conv = await run("convert", [pngPath, pnmPath]);
    if (conv.code !== 0) throw new Error(`convert failed: ${conv.stderr}`);

    // potrace
    const potraceArgs = [
      pnmPath,
      "--svg",
      "-o",
      svgPath,
      "-t",
      String(cfg.turdsize),
      "-a",
      String(cfg.alphamax),
      "-O",
      String(cfg.opttol),
    ];
    if (cfg.longcurve) potraceArgs.push("--longcurve");
    const pot = await run("potrace", potraceArgs);
    if (pot.code !== 0) throw new Error(`potrace failed: ${pot.stderr}`);

    // Trim ink bounds via inkscape
    const trim = await run("inkscape", [
      svgPath,
      "--export-area-drawing",
      "--export-type=svg",
      `--export-filename=${svgPath}`,
      "--export-overwrite",
    ]);
    if (trim.code !== 0) throw new Error(`inkscape trim failed: ${trim.stderr}`);

    // Optional break-apart: explodes compound paths into separate paths
    if (breakApart) {
      const ba = await run("inkscape", [
        svgPath,
        "--actions=select-all;path-break-apart;export-do",
        "--export-type=svg",
        `--export-filename=${svgPath}`,
        "--export-overwrite",
      ]);
      if (ba.code !== 0)
        throw new Error(`inkscape break-apart failed: ${ba.stderr}`);
    }

    return await readFile(svgPath, "utf8");
  });

  return Response.json({ svg });
}
