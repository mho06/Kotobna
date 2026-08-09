"use client";

import { useRef, useState, useEffect } from "react";

interface Props {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onSkip: () => void;
}

type Handle = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | "move";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const MIN_SIZE = 8;

export default function ImageCropper(props: Props) {
  const imageSrc = props.imageSrc;
  const onConfirm = props.onConfirm;

  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const [box, setBox] = useState({ x1: 8, y1: 8, x2: 92, y2: 92 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const dragHandle = useRef<Handle | null>(null);
  const dragStart = useRef({ x: 0, y: 0, box: { x1: 0, y1: 0, x2: 0, y2: 0 } });

  useEffect(function () {
    setBox({ x1: 8, y1: 8, x2: 92, y2: 92 });
    setImgLoaded(false);
  }, [currentSrc]);

  // Always measure against the actual <img> element's own rendered box,
  // never the wrapping container. If the wrapper's box ever differs from
  // the image's real box for any reason, using the image directly removes
  // that entire class of bug instead of trying to keep them in sync.
  function getRelativePos(clientX: number, clientY: number) {
    const el = imgRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    };
  }

  function startDrag(handle: Handle, e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    // Explicitly capture the pointer to the element the drag started on.
    // Without this, a fast or long touch-drag on mobile can drift off the
    // small handle and silently stop firing move events, making it feel
    // like dragging "doesn't work" past a certain point.
    const target = e.currentTarget as HTMLElement;
    if (target.setPointerCapture) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch (err) {
        // Some browsers can throw if the pointer is already gone; safe to ignore.
      }
    }
    const pos = getRelativePos(e.clientX, e.clientY);
    dragHandle.current = handle;
    dragStart.current = {
      x: pos.x,
      y: pos.y,
      box: { x1: box.x1, y1: box.y1, x2: box.x2, y2: box.y2 },
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragHandle.current) return;
    const pos = getRelativePos(e.clientX, e.clientY);
    const dx = pos.x - dragStart.current.x;
    const dy = pos.y - dragStart.current.y;
    const start = dragStart.current.box;
    const handle = dragHandle.current;

    setBox(function () {
      let x1 = start.x1;
      let y1 = start.y1;
      let x2 = start.x2;
      let y2 = start.y2;

      if (handle === "move") {
        const w = start.x2 - start.x1;
        const h = start.y2 - start.y1;
        x1 = Math.min(Math.max(0, start.x1 + dx), 100 - w);
        y1 = Math.min(Math.max(0, start.y1 + dy), 100 - h);
        x2 = x1 + w;
        y2 = y1 + h;
        return { x1: x1, y1: y1, x2: x2, y2: y2 };
      }

      if (handle === "tl" || handle === "l" || handle === "bl") {
        x1 = Math.min(Math.max(0, start.x1 + dx), start.x2 - MIN_SIZE);
      }
      if (handle === "tr" || handle === "r" || handle === "br") {
        x2 = Math.max(Math.min(100, start.x2 + dx), start.x1 + MIN_SIZE);
      }
      if (handle === "tl" || handle === "t" || handle === "tr") {
        y1 = Math.min(Math.max(0, start.y1 + dy), start.y2 - MIN_SIZE);
      }
      if (handle === "bl" || handle === "b" || handle === "br") {
        y2 = Math.max(Math.min(100, start.y2 + dy), start.y1 + MIN_SIZE);
      }

      return { x1: x1, y1: y1, x2: x2, y2: y2 };
    });
  }

  function handlePointerUp() {
    dragHandle.current = null;
  }

  function rotateImage(direction: number) {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((direction * 90 * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    setCurrentSrc(canvas.toDataURL("image/jpeg", 0.95));
  }

  function resizeIfNeeded(sourceCanvas: HTMLCanvasElement) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const longest = Math.max(w, h);
    if (longest <= MAX_DIMENSION) {
      return sourceCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
    }
    const scale = MAX_DIMENSION / longest;
    const outCanvas = document.createElement("canvas");
    outCanvas.width = Math.round(w * scale);
    outCanvas.height = Math.round(h * scale);
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return sourceCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
    ctx.drawImage(sourceCanvas, 0, 0, outCanvas.width, outCanvas.height);
    return outCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }

  function exportCrop(useFullFrame: boolean) {
    const img = imgRef.current;
    if (!img) return;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const activeBox = useFullFrame ? { x1: 0, y1: 0, x2: 100, y2: 100 } : box;

    const sx = Math.round((activeBox.x1 / 100) * naturalW);
    const sy = Math.round((activeBox.y1 / 100) * naturalH);
    const sw = Math.round(((activeBox.x2 - activeBox.x1) / 100) * naturalW);
    const sh = Math.round(((activeBox.y2 - activeBox.y1) / 100) * naturalH);

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Explicit 8-argument drawImage: source rect (sx,sy,sw,sh) mapped 1:1
    // onto a destination canvas of the exact same size - a plain pixel
    // copy with no scaling, so there is no way for this step to distort
    // the aspect ratio.
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    onConfirm(resizeIfNeeded(canvas));
  }

  function handleConfirm() {
    exportCrop(false);
  }

  function handleSkip() {
    exportCrop(true);
  }

  function handleReset() {
    setBox({ x1: 0, y1: 0, x2: 100, y2: 100 });
  }

  const midX = (box.x1 + box.x2) / 2;
  const midY = (box.y1 + box.y2) / 2;

  const cornerHandles: { key: Handle; style: React.CSSProperties }[] = [
    { key: "tl", style: { left: box.x1 + "%", top: box.y1 + "%" } },
    { key: "tr", style: { left: box.x2 + "%", top: box.y1 + "%" } },
    { key: "bl", style: { left: box.x1 + "%", top: box.y2 + "%" } },
    { key: "br", style: { left: box.x2 + "%", top: box.y2 + "%" } },
  ];

  const edgeHandles: { key: Handle; style: React.CSSProperties; cursor: string }[] = [
    { key: "t", style: { left: midX + "%", top: box.y1 + "%" }, cursor: "ns-resize" },
    { key: "b", style: { left: midX + "%", top: box.y2 + "%" }, cursor: "ns-resize" },
    { key: "l", style: { left: box.x1 + "%", top: midY + "%" }, cursor: "ew-resize" },
    { key: "r", style: { left: box.x2 + "%", top: midY + "%" }, cursor: "ew-resize" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink/60 -mb-1">
        Drag the corners or edges to resize, or drag inside the box to move it.
      </p>

      <div
        ref={wrapRef}
        className="relative select-none touch-none inline-block max-w-full"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={currentSrc}
          alt="Crop preview"
          draggable={false}
          onLoad={function () { setImgLoaded(true); }}
          style={{
            maxWidth: "100%",
            maxHeight: "420px",
            width: "auto",
            height: "auto",
            display: "block",
          }}
        />

        {imgLoaded && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, rgba(43,38,32,0.5) " +
                  box.x1 +
                  "%, transparent " +
                  box.x1 +
                  "%, transparent " +
                  box.x2 +
                  "%, rgba(43,38,32,0.5) " +
                  box.x2 +
                  "%), linear-gradient(to bottom, rgba(43,38,32,0.5) " +
                  box.y1 +
                  "%, transparent " +
                  box.y1 +
                  "%, transparent " +
                  box.y2 +
                  "%, rgba(43,38,32,0.5) " +
                  box.y2 +
                  "%)",
              }}
            />

            <div
              onPointerDown={function (e) { startDrag("move", e); }}
              className="absolute border-2 border-forest cursor-move touch-none"
              style={{
                left: box.x1 + "%",
                top: box.y1 + "%",
                width: box.x2 - box.x1 + "%",
                height: box.y2 - box.y1 + "%",
              }}
            />

            {edgeHandles.map(function (h) {
              return (
                <div
                  key={h.key}
                  onPointerDown={function (e) { startDrag(h.key, e); }}
                  className="absolute w-9 h-9 -ml-4.5 -mt-4.5 touch-none"
                  style={Object.assign({ cursor: h.cursor }, h.style)}
                />
              );
            })}

            {cornerHandles.map(function (c) {
              return (
                <div
                  key={c.key}
                  onPointerDown={function (e) { startDrag(c.key, e); }}
                  className="absolute w-11 h-11 -ml-5.5 -mt-5.5 cursor-pointer touch-none flex items-center justify-center"
                  style={c.style}
                >
                  <div className="w-5 h-5 bg-forest border-2 border-cream rounded-full pointer-events-none" />
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button type="button" onClick={function () { rotateImage(-1); }} className="font-mono text-[11px] uppercase tracking-widest border border-ink/25 text-ink/70 rounded-full px-4 py-2 hover:border-ink transition-colors">
          Rotate left
        </button>
        <button type="button" onClick={function () { rotateImage(1); }} className="font-mono text-[11px] uppercase tracking-widest border border-ink/25 text-ink/70 rounded-full px-4 py-2 hover:border-ink transition-colors">
          Rotate right
        </button>
        <button type="button" onClick={handleReset} className="font-mono text-[11px] uppercase tracking-widest border border-ink/25 text-ink/70 rounded-full px-4 py-2 hover:border-ink transition-colors">
          Reset
        </button>
        <button type="button" onClick={handleConfirm} className="font-mono text-[11px] uppercase tracking-widest bg-forest text-cream rounded-full px-4 py-2 hover:bg-forest-dark transition-colors">
          Confirm crop
        </button>
        <button type="button" onClick={handleSkip} className="font-mono text-[11px] uppercase tracking-widest border border-ink/25 text-ink/70 rounded-full px-4 py-2 hover:border-ink transition-colors">
          Use full photo
        </button>
      </div>
    </div>
  );
}