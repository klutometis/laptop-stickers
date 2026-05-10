"use client";

import { useState } from "react";
import {
  TEXT_MODELS,
  IMAGE_MODELS,
  TEXT_MODEL_KEYS,
  IMAGE_MODEL_KEYS,
  ASPECT_BUCKETS,
  ASPECT_LABELS,
  type TextModelKey,
  type ImageModelKey,
  type AspectBucket,
} from "@/lib/models";
import { readNdjson } from "@/lib/ndjson";
import type { RefineEvent } from "./api/refine-prompt/route";
import type { ImageEvent } from "./api/generate-images/route";
import type { PrepareEvent } from "./api/prepare-cricut/route";

type RefinedPrompt = {
  model: string;
  prompt?: string;
  aspect?: AspectBucket;
  rationale?: string;
  error?: string;
};

type Cell = {
  promptModel: string;
  imageModel: string;
  images: Array<{ base64?: string; error?: string }>;
};

type SelectedImage = {
  base64: string;
  promptModel: string;
  imageModel: string;
  idx: number;
};

type PrepareCell = {
  model: ImageModelKey;
  track: "cleanup" | "vinyl";
  png?: string; // base64 (cleanup track)
  svg?: string; // SVG XML (vinyl track)
  error?: string;
};

export default function Page() {
  // Step 1
  const [idea, setIdea] = useState("");
  const [selectedTextModels, setSelectedTextModels] = useState<TextModelKey[]>([
    ...TEXT_MODEL_KEYS,
  ]);
  const [refining, setRefining] = useState(false);
  const [refined, setRefined] = useState<RefinedPrompt[] | null>(null);
  const [pickedPromptIdx, setPickedPromptIdx] = useState<Set<number>>(new Set());

  // Step 2
  const [selectedImageModels, setSelectedImageModels] = useState<
    ImageModelKey[]
  >([...IMAGE_MODEL_KEYS]);
  const [n, setN] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [grid, setGrid] = useState<Cell[] | null>(null);

  // Step 3: pick image
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  // Step 4: Prepare for Cricut (cleanup PNG + monochrome→potrace SVG, per model)
  const [preparing, setPreparing] = useState(false);
  const [prepareGrid, setPrepareGrid] = useState<PrepareCell[] | null>(null);

  async function refine() {
    setRefining(true);
    // Pre-seed one empty entry per selected model; partial objects fill in as they stream
    const initial: RefinedPrompt[] = selectedTextModels.map((m) => ({
      model: m,
    }));
    setRefined(initial);
    setPickedPromptIdx(new Set(initial.map((_, i) => i)));
    try {
      const res = await fetch("/api/refine-prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea, models: selectedTextModels }),
      });
      for await (const ev of readNdjson<RefineEvent>(res)) {
        if (ev.type === "partial") {
          setRefined((prev) =>
            prev?.map((r) =>
              r.model === ev.model
                ? {
                    ...r,
                    // streamObject yields ever-growing partials; just overwrite
                    prompt: ev.partial.prompt ?? r.prompt,
                    aspect: (ev.partial.aspect as AspectBucket) ?? r.aspect,
                    rationale: ev.partial.rationale ?? r.rationale,
                  }
                : r,
            ) ?? null,
          );
        } else if (ev.type === "done") {
          setRefined((prev) =>
            prev?.map((r) =>
              r.model === ev.model
                ? {
                    ...r,
                    prompt: ev.object.prompt,
                    aspect: ev.object.aspect,
                    rationale: ev.object.rationale,
                  }
                : r,
            ) ?? null,
          );
        } else if (ev.type === "error") {
          setRefined((prev) =>
            prev?.map((r) =>
              r.model === ev.model ? { ...r, error: ev.error } : r,
            ) ?? null,
          );
        }
      }
    } finally {
      setRefining(false);
    }
  }

  async function generate() {
    if (!refined) return;
    const prompts = Array.from(pickedPromptIdx)
      .map((i) => refined[i])
      .filter(
        (r): r is RefinedPrompt & { prompt: string; aspect: AspectBucket } =>
          !!r.prompt && !!r.aspect,
      )
      .map((r) => ({
        promptModel: r.model,
        prompt: r.prompt,
        aspect: r.aspect,
      }));
    if (!prompts.length) return;

    setGenerating(true);
    setSelectedImage(null);
    setPrepareGrid(null);

    // Pre-seed empty grid so cells render immediately and fill in as images arrive
    const initialCells: Cell[] = [];
    for (const p of prompts) {
      for (const im of selectedImageModels) {
        initialCells.push({
          promptModel: p.promptModel,
          imageModel: im,
          images: Array.from({ length: n }, () => ({})),
        });
      }
    }
    setGrid(initialCells);

    try {
      const res = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompts, imageModels: selectedImageModels, n }),
      });
      for await (const ev of readNdjson<ImageEvent>(res)) {
        setGrid((prev) =>
          prev?.map((c) =>
            c.promptModel === ev.promptModel && c.imageModel === ev.imageModel
              ? {
                  ...c,
                  images: c.images.map((img, i) =>
                    i === ev.idx
                      ? ev.type === "image"
                        ? { base64: ev.base64 }
                        : { error: ev.error }
                      : img,
                  ),
                }
              : c,
          ) ?? null,
        );
      }
    } finally {
      setGenerating(false);
    }
  }

  async function prepare() {
    if (!selectedImage) return;
    setPreparing(true);
    // Pre-seed all 4 cells (NB2/gpt-image-2 × cleanup/vinyl). Cells fill in
    // as events stream back.
    const initial: PrepareCell[] = [];
    for (const model of IMAGE_MODEL_KEYS) {
      initial.push({ model, track: "cleanup" });
      initial.push({ model, track: "vinyl" });
    }
    setPrepareGrid(initial);

    try {
      const res = await fetch("/api/prepare-cricut", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ base64: selectedImage.base64 }),
      });
      for await (const ev of readNdjson<PrepareEvent>(res)) {
        setPrepareGrid((prev) =>
          prev?.map((c) => {
            if (c.model !== ev.model || c.track !== ev.track) return c;
            if (ev.type === "png") return { ...c, png: ev.base64 };
            if (ev.type === "svg") return { ...c, svg: ev.svg };
            return { ...c, error: ev.error };
          }) ?? null,
        );
      }
    } finally {
      setPreparing(false);
    }
  }

  function downloadBlob(data: BlobPart, mime: string, filename: string) {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng(base64: string, filename: string) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    downloadBlob(bytes, "image/png", filename);
  }

  // Group grid cells by promptModel for table-style rendering
  const promptModels = Array.from(new Set(grid?.map((c) => c.promptModel) ?? []));
  const imageModels = Array.from(new Set(grid?.map((c) => c.imageModel) ?? []));
  const cellAt = (pm: string, im: string) =>
    grid?.find((c) => c.promptModel === pm && c.imageModel === im);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8 font-sans">
      <h1 className="text-2xl font-bold">Sticker Pipeline</h1>

      {/* Step 1: Idea */}
      <Section n={1} title="Idea">
        <textarea
          className="w-full border rounded p-2 h-24 bg-background"
          placeholder="e.g. sun and cloud for Eos's laptop"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="text-sm text-gray-500">Refine with:</span>
          {TEXT_MODEL_KEYS.map((k) => (
            <Checkbox
              key={k}
              label={TEXT_MODELS[k].label}
              checked={selectedTextModels.includes(k)}
              onChange={(v) =>
                setSelectedTextModels((prev) =>
                  v ? [...prev, k] : prev.filter((x) => x !== k),
                )
              }
            />
          ))}
          <button
            className="ml-auto px-3 py-1 border rounded disabled:opacity-50"
            onClick={refine}
            disabled={
              refining || !idea.trim() || selectedTextModels.length === 0
            }
          >
            {refining ? "Refining…" : "Refine"}
          </button>
        </div>
      </Section>

      {/* Step 2: Refined prompts → generate images */}
      {refined && (
        <Section n={2} title="Refined prompts → generate">
          <div className="space-y-2">
            {refined.map((r, i) => (
              <div key={i} className="border rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={pickedPromptIdx.has(i)}
                    onChange={(e) => {
                      const next = new Set(pickedPromptIdx);
                      if (e.target.checked) next.add(i);
                      else next.delete(i);
                      setPickedPromptIdx(next);
                    }}
                    disabled={!r.prompt}
                  />
                  <span className="font-mono text-xs text-gray-600">
                    {TEXT_MODELS[r.model as TextModelKey]?.label ?? r.model}
                  </span>
                </div>
                {r.error ? (
                  <div className="text-red-600 text-sm">{r.error}</div>
                ) : (
                  <>
                    <textarea
                      className="w-full text-sm h-20 bg-background border rounded p-1"
                      value={r.prompt ?? ""}
                      onChange={(e) =>
                        setRefined((prev) =>
                          prev?.map((p, j) =>
                            j === i ? { ...p, prompt: e.target.value } : p,
                          ) ?? null,
                        )
                      }
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        aspect:
                        <select
                          className="text-xs border rounded p-1 bg-background"
                          value={r.aspect ?? ""}
                          onChange={(e) =>
                            setRefined((prev) =>
                              prev?.map((p, j) =>
                                j === i
                                  ? {
                                      ...p,
                                      aspect: e.target
                                        .value as AspectBucket,
                                    }
                                  : p,
                              ) ?? null,
                            )
                          }
                        >
                          <option value="" disabled>
                            —
                          </option>
                          {ASPECT_BUCKETS.map((a) => (
                            <option key={a} value={a}>
                              {ASPECT_LABELS[a]}
                            </option>
                          ))}
                        </select>
                      </label>
                      {r.rationale && (
                        <span className="text-xs text-gray-500 italic">
                          “{r.rationale}”
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="text-sm text-gray-500">Image models:</span>
            {IMAGE_MODEL_KEYS.map((k) => (
              <Checkbox
                key={k}
                label={IMAGE_MODELS[k].label}
                checked={selectedImageModels.includes(k)}
                onChange={(v) =>
                  setSelectedImageModels((prev) =>
                    v ? [...prev, k] : prev.filter((x) => x !== k),
                  )
                }
              />
            ))}
            <label className="text-sm flex items-center gap-1">
              n:
              <input
                type="number"
                min={1}
                max={8}
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
                className="w-14 border rounded p-1 bg-background"
              />
            </label>
            <button
              className="ml-auto px-3 py-1 border rounded disabled:opacity-50"
              onClick={generate}
              disabled={
                generating ||
                pickedPromptIdx.size === 0 ||
                selectedImageModels.length === 0
              }
            >
              {generating
                ? "Generating…"
                : `Generate ${pickedPromptIdx.size * selectedImageModels.length * n} images`}
            </button>
          </div>
        </Section>
      )}

      {/* Step 3: image grid */}
      {grid && (
        <Section n={3} title="Pick an image">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs text-gray-500 pr-2">
                    prompt ↓ / image →
                  </th>
                  {imageModels.map((im) => (
                    <th
                      key={im}
                      className="text-left text-xs text-gray-500 px-2"
                    >
                      {IMAGE_MODELS[im as ImageModelKey]?.label ?? im}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {promptModels.map((pm) => (
                  <tr key={pm}>
                    <td className="text-xs text-gray-500 pr-2 align-top pt-2">
                      {TEXT_MODELS[pm as TextModelKey]?.label ?? pm}
                    </td>
                    {imageModels.map((im) => {
                      const cell = cellAt(pm, im);
                      return (
                        <td key={im} className="px-2 py-2 align-top">
                          <div className="grid grid-cols-2 gap-1">
                            {cell?.images.map((img, idx) =>
                              img.base64 ? (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    setSelectedImage({
                                      base64: img.base64!,
                                      promptModel: pm,
                                      imageModel: im,
                                      idx,
                                    })
                                  }
                                  className={`block border-2 rounded overflow-hidden ${
                                    selectedImage?.base64 === img.base64
                                      ? "border-blue-500"
                                      : "border-transparent hover:border-gray-300"
                                  }`}
                                >
                                  <img
                                    src={`data:image/png;base64,${img.base64}`}
                                    alt=""
                                    className="w-32 h-32 object-contain bg-white"
                                  />
                                </button>
                              ) : img.error ? (
                                <div
                                  key={idx}
                                  className="w-32 h-32 bg-red-100 text-red-600 text-xs p-1 flex items-center justify-center text-center"
                                >
                                  {img.error}
                                </div>
                              ) : (
                                <div
                                  key={idx}
                                  className="w-32 h-32 bg-gray-100 animate-pulse rounded"
                                />
                              ),
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Step 4: prepare for Cricut — cleanup PNGs and vinyl SVGs across both image models */}
      {selectedImage && (
        <Section n={4} title="Prepare for Cricut">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <p className="text-sm text-gray-600 flex-1">
              Runs both pathways across both image models in parallel:
              <strong> cleanup</strong> (flat colored PNG, for print-then-cut on
              sticker paper) and <strong>vinyl</strong> (AI monochrome → potrace
              SVG, for single-color vinyl cut). Pick whichever cell looks best.
            </p>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={prepare}
              disabled={preparing}
            >
              {preparing ? "Preparing…" : "Prepare for Cricut"}
            </button>
          </div>

          {prepareGrid && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-gray-500 pr-2">
                      model ↓ / track →
                    </th>
                    <th className="text-left text-xs text-gray-500 px-2">
                      cleanup PNG (print-then-cut)
                    </th>
                    <th className="text-left text-xs text-gray-500 px-2">
                      vinyl SVG (AI monochrome → potrace)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {IMAGE_MODEL_KEYS.map((model) => {
                    const cleanup = prepareGrid.find(
                      (c) => c.model === model && c.track === "cleanup",
                    );
                    const vinyl = prepareGrid.find(
                      (c) => c.model === model && c.track === "vinyl",
                    );
                    return (
                      <tr key={model}>
                        <td className="text-xs text-gray-500 pr-2 align-top pt-2">
                          {IMAGE_MODELS[model].label}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <PrepareCleanupCell
                            cell={cleanup}
                            onDownload={(b64) =>
                              downloadPng(
                                b64,
                                `sticker-${model}-cleanup.png`,
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <PrepareVinylCell
                            cell={vinyl}
                            onDownload={(svg) =>
                              downloadBlob(
                                svg,
                                "image/svg+xml",
                                `sticker-${model}-vinyl.svg`,
                              )
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}
    </main>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t pt-4">
      <h2 className="font-semibold mb-2">
        <span className="text-gray-400 mr-2">{n}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function PrepareCleanupCell({
  cell,
  onDownload,
}: {
  cell?: PrepareCell;
  onDownload: (b64: string) => void;
}) {
  if (!cell) return null;
  if (cell.error)
    return (
      <div className="text-red-600 text-xs p-2 border bg-red-50 max-w-xs">
        {cell.error}
      </div>
    );
  if (!cell.png)
    return <div className="w-48 h-48 bg-gray-100 animate-pulse rounded" />;
  return (
    <div className="flex flex-col items-start gap-1">
      <img
        src={`data:image/png;base64,${cell.png}`}
        alt=""
        className="w-48 h-48 object-contain border bg-white"
      />
      <button
        className="text-xs px-2 py-0.5 border rounded"
        onClick={() => onDownload(cell.png!)}
      >
        Download PNG
      </button>
    </div>
  );
}

function PrepareVinylCell({
  cell,
  onDownload,
}: {
  cell?: PrepareCell;
  onDownload: (svg: string) => void;
}) {
  if (!cell) return null;
  if (cell.error)
    return (
      <div className="text-red-600 text-xs p-2 border bg-red-50 max-w-xs">
        {cell.error}
      </div>
    );
  if (!cell.svg)
    return <div className="w-48 h-48 bg-gray-100 animate-pulse rounded" />;
  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className="w-48 h-48 border bg-white p-1 [&_svg]:w-full [&_svg]:h-full"
        dangerouslySetInnerHTML={{ __html: cell.svg }}
      />
      <button
        className="text-xs px-2 py-0.5 border rounded"
        onClick={() => onDownload(cell.svg!)}
      >
        Download SVG
      </button>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="text-sm flex items-center gap-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
