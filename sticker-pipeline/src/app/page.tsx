"use client";

import { useState } from "react";
import {
  TEXT_MODELS,
  IMAGE_MODELS,
  TEXT_MODEL_KEYS,
  IMAGE_MODEL_KEYS,
  type TextModelKey,
  type ImageModelKey,
} from "@/lib/models";

type RefinedPrompt = {
  model: string;
  prompt?: string;
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
  const [n, setN] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [grid, setGrid] = useState<Cell[] | null>(null);

  // Step 3
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [threshold, setThreshold] = useState(128);
  const [monochroming, setMonochroming] = useState(false);
  const [monoBase64, setMonoBase64] = useState<string | null>(null);

  // Step 4
  const [preset, setPreset] = useState<"default" | "high" | "max" | "sharp">(
    "sharp",
  );
  const [breakApart, setBreakApart] = useState(false);
  const [vectorizing, setVectorizing] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);

  async function refine() {
    setRefining(true);
    setRefined(null);
    setPickedPromptIdx(new Set());
    try {
      const res = await fetch("/api/refine-prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea, models: selectedTextModels }),
      });
      const data = await res.json();
      setRefined(data.results);
      // pre-select all successful prompts
      const picked = new Set<number>();
      (data.results as RefinedPrompt[]).forEach((r, i) => {
        if (r.prompt && !r.error) picked.add(i);
      });
      setPickedPromptIdx(picked);
    } finally {
      setRefining(false);
    }
  }

  async function generate() {
    if (!refined) return;
    const prompts = Array.from(pickedPromptIdx)
      .map((i) => refined[i])
      .filter((r): r is { model: string; prompt: string } => !!r.prompt)
      .map((r) => ({ promptModel: r.model, prompt: r.prompt }));
    if (!prompts.length) return;

    setGenerating(true);
    setGrid(null);
    setSelectedImage(null);
    setMonoBase64(null);
    setSvg(null);
    try {
      const res = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompts, imageModels: selectedImageModels, n }),
      });
      const data = await res.json();
      setGrid(data.cells);
    } finally {
      setGenerating(false);
    }
  }

  async function makeMonochrome() {
    if (!selectedImage) return;
    setMonochroming(true);
    setMonoBase64(null);
    setSvg(null);
    try {
      const res = await fetch("/api/monochrome", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ base64: selectedImage.base64, threshold }),
      });
      const data = await res.json();
      setMonoBase64(data.base64);
    } finally {
      setMonochroming(false);
    }
  }

  async function vectorize() {
    if (!monoBase64) return;
    setVectorizing(true);
    setSvg(null);
    try {
      const res = await fetch("/api/vectorize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ base64: monoBase64, preset, breakApart }),
      });
      const data = await res.json();
      setSvg(data.svg);
    } finally {
      setVectorizing(false);
    }
  }

  function downloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sticker.svg";
    a.click();
    URL.revokeObjectURL(url);
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
                                    className="w-32 h-32 object-cover"
                                  />
                                </button>
                              ) : (
                                <div
                                  key={idx}
                                  className="w-32 h-32 bg-red-100 text-red-600 text-xs p-1 flex items-center justify-center text-center"
                                >
                                  {img.error ?? "error"}
                                </div>
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

      {/* Step 4: monochrome */}
      {selectedImage && (
        <Section n={4} title="Monochrome">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm flex items-center gap-2">
              threshold:
              <input
                type="range"
                min={0}
                max={255}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
              <span className="font-mono w-10">{threshold}</span>
            </label>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={makeMonochrome}
              disabled={monochroming}
            >
              {monochroming ? "Processing…" : "Threshold"}
            </button>
          </div>
          <div className="flex gap-4 mt-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">original</div>
              <img
                src={`data:image/png;base64,${selectedImage.base64}`}
                alt=""
                className="w-64 h-64 object-contain border"
              />
            </div>
            {monoBase64 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">monochrome</div>
                <img
                  src={`data:image/png;base64,${monoBase64}`}
                  alt=""
                  className="w-64 h-64 object-contain border"
                />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 5: vectorize */}
      {monoBase64 && (
        <Section n={5} title="Vectorize">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm flex items-center gap-1">
              preset:
              <select
                value={preset}
                onChange={(e) =>
                  setPreset(e.target.value as typeof preset)
                }
                className="border rounded p-1 bg-background"
              >
                <option value="default">default</option>
                <option value="high">high</option>
                <option value="max">max</option>
                <option value="sharp">sharp</option>
              </select>
            </label>
            <Checkbox
              label="Break apart compound path"
              checked={breakApart}
              onChange={setBreakApart}
            />
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={vectorize}
              disabled={vectorizing}
            >
              {vectorizing ? "Vectorizing…" : "Vectorize"}
            </button>
            {svg && (
              <button
                className="ml-auto px-3 py-1 border rounded"
                onClick={downloadSvg}
              >
                Download SVG
              </button>
            )}
          </div>
          {svg && (
            <div
              className="mt-3 border bg-white"
              style={{ maxHeight: 600, overflow: "auto" }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
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
