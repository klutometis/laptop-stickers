/**
 * System prompt for the prompt-refinement step.
 *
 * Strategy (see notes/png-to-cricut-multishape.md in parent repo):
 *  - Permissive geometry, no negative directives. Negative directives fight
 *    diffusion model priors and leak gradients/shading anyway.
 *  - Constrain only what we need for vinyl cutting: flat solid fills, clean
 *    separable shapes, thick clean outlines, white background.
 *  - Pass the user's idea through; let the text model expand it.
 *
 * Output shape (enforced by the Zod schema in the refine route):
 *   - prompt:    image-gen prompt, 60-150 words
 *   - aspect:    one of square | landscape | portrait | panorama | banner
 *   - rationale: one short sentence explaining the aspect choice
 */
export const STICKER_SYSTEM_PROMPT = `You are a prompt engineer for vinyl-cuttable sticker designs. Given the user's rough idea, produce a structured object suitable for downstream image generation models (Nano Banana / GPT Image / similar).

The generated image should be:
  - A flat graphic illustration suitable for a vinyl sticker cut on a Cricut.
  - Solid flat color fills (the actual hue doesn't matter; what matters is that fills are flat, not gradients).
  - Clearly separable shapes with thick, clean outlines and visible gaps between distinct shape regions.
  - White background, centered front-facing composition.
  - Simple, graphic, bold style.

Do not include negative directives ("no gradients", "no shadows", etc.) in the prompt — they tend to backfire. Describe the desired flat / graphic style positively.

Aspect bucket — pick the one that genuinely fits the subject's natural shape:
  - "square" (1:1):    default; logos, single-subject icons, balanced compositions.
  - "landscape" (3:2): wider-than-tall scenes (e.g. animal in a meadow, car).
  - "portrait" (2:3):  taller-than-wide subjects (e.g. rocket, lighthouse, building).
  - "panorama" (21:9): wide banner shapes; horizontal scenes that don't fit landscape.
  - "banner" (4:1):    long ribbon shapes — e.g. music staffs, long phrases. Use sparingly.

Default to "square" unless the subject genuinely demands another shape. Explain your choice in one short sentence.

The prompt itself: 60-150 words, single paragraph, no preamble, no markdown.`;

/**
 * Cleanup pass: take a colored AI-generated sticker and flatten it into clean
 * vector-style artwork on pure white. Used by the "print-then-cut" pathway.
 *
 * Cricut DSS auto-detects the colored region as the silhouette and adds a
 * sticker rim via its Offset tool, so we explicitly drop the AI's faux-sticker
 * border (white-rim-on-white-bg has no detectable edge for DSS).
 */
export const CLEANUP_PROMPT = `Flatten this sticker into clean, flat vector-style artwork on a pure white background.

Remove entirely:
  - The white sticker border / rim / outline around the artwork. There should be NO sticker-shaped white border. The colored artwork should sit directly on the pure white background.
  - Any drop shadow under the sticker.
  - Any paper-curl shading or 3D/photographic lighting effects.
  - Any soft gradients, halos, or glow.
  - Any speckles, texture, or off-white tones in the background.

Preserve:
  - The colored artwork itself (sun, cloud, faces, internal black outlines) exactly as designed — same colors, same shapes, same proportions, same composition and placement.

The result should look like clean digital vector art floating on pure white — flat fills, sharp edges, no sticker border, no 3D effects, ready to print. Cricut's offset tool will add the sticker rim later; we don't need it baked into the image.`;

/**
 * Monochrome pass: take a colored AI-generated sticker and reduce it to flat
 * black silhouettes on white. Used by the "vinyl cut" pathway — output goes
 * straight into potrace.
 */
export const MONOCHROME_PROMPT = `Convert this image into clean, flat, monochrome silhouettes suitable for vinyl cutting on a Cricut.

Requirements:
  - Replace every colored region with a solid black fill on a pure white background.
  - Preserve the overall shapes and their separability (e.g. sun and cloud remain distinct silhouettes with a visible white gap between them).
  - Remove all gradients, shading, anti-aliasing, internal line details, eyes, mouths, decorative outlines, and the sticker rim.
  - The result should look like a hand-cut paper stencil: bold, minimal, single-color filled shapes only.
  - White background must be pure white (no off-white, no shadow).`;
