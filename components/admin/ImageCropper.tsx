"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onSkip: () => void;
}

// Fixed aspect ratio matching the book cover shape used everywhere else
// (BookCard.tsx uses aspect-[3/4]). Locking the crop to this ratio means
// whatever gets selected here is guaranteed to match how it's displayed
// later - no more mismatch between "what I cropped" and "what shows up".
const RATIO_W = 3;
const RATIO_H = 4;

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export default function ImageCropper(props: Props) {
  const imageSrc = props.imageSrc;
  const onConfirm = props.onConfirm;

  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [rendered, setRendered] = useState({ width: 0, height: 0 });

  // Crop box lives in the SAME pixel space as the rendered <img> - no
  // percentages, no separate container to keep in sync. One coordinate
  // system end to end removes an entire class of measurement bugs.
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const dragging = useRef<null | "move" | "resize">(null);
  const dragStart = useRef({ px: 0, py: 0, box: { x: 0, y: 0, w: 0, h: 0 } });

  const fitInitialBox = useCallback(function (width: number, height: number) {
    let w = width;
    let h = (w * RATIO_H) / RATIO_W;
    if (h > height) {
      h = height;
      w = (h * RATIO_W) / RATIO_H;
    }
    // Start slightly inset so there's visible margin to drag inward from.
    w = w * 0.85;
    h = h * 0.85;
    const x = (width - w) / 2;
    const y = (height - h) / 2;
    setBox({ x: x, y: y, w: w, h: h });
  }, []);

  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    setRendered({ width: rect.width, height: rect.height });
    fitInitialBox(rect.width, rect.height);
    setImgLoaded(true);
  }

  useEffect(function () {
    setImgLoaded(false);
  }, [imageSrc]);

  function clampBox(next: { x: number; y: number; w: number; h: number }) {
    let w = Math.min(next.w, rendered.width);
    let h = (w * RATIO_H) / RATIO_W;
    if (h > rendered.height) {
      h = rendered.height;
      w = (h * RATIO_W) / RATIO_H;
    }
    let x = Math.min(Math.max(0, next.x), rendered.width - w);
    let y = Math.min(Math.max(0, next.y), rendered.height - h);
    return { x: x, y: y, w: w, h: h };
  }

  function startMove(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    if (target.setPointerCapture) {
      try { target.setPointerCapture(e.pointerId); } catch (err) {}
    }
    dragging.current = "move";
    dragStart.current = { px: e.clientX, py: e.clientY, box: box };
  }

  function startResize(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    if (target.setPointerCapture) {
      try { target.setPointerCapture(e.pointerId); } catch (err) {}
    }
    dragging.current = "resize";
    dragStart.current = { px: e.clientX, py: e.clientY, box: box };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.px;
    const dy = e.clientY - dragStart.current.py;
    const start = dragStart.current.box;

    if (dragging.current === "move") {
      setBox(clampBox({ x: start.x + dx, y: start.y + dy, w: start.w, h: start.h }));
    } else {
      // Resize from the bottom-right corner; width drives height via the fixed ratio.
      const newW = start.w + dx;
      setBox(clampBox({ x: start.x, y: start.y, w: newW, h: (newW * RATIO_H) / RATIO_W }));
    }
  }

  function handlePointerUp() {
    dragging.current = null;
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
    if (!img || rendered.width === 0) return;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const scale = naturalW / rendered.width;

    let cropBox = box;
    if (useFullFrame) {
      let w = rendered.width;
      let h = (w * RATIO_H) / RATIO_W;
      if (h > rendered.height) {
        h = rendered.height;
        w = (h * RATIO_W) / RATIO_H;
      }
      cropBox = { x: (rendered.width - w) / 2, y: (rendered.height - h) / 2, w: w, h: h };
    }

    const sx = Math.round(cropBox.x * scale);
    const sy = Math.round(cropBox.y * scale);
    const sw = Math.round(cropBox.w * scale);
    const sh = Math.round(cropBox.h * scale);

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
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
    fitInitialBox(rendered.width, rendered.height);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink/60 -mb-1">
        Drag inside the box to move it, or drag the corner handle to resize. The shape is locked to match how covers are displayed.
      </p>

      <div
        className="relative select-none touch-none inline-block max-w-full"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Crop preview"
          draggable={false}
          onLoad={handleImgLoad}
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
                background: "rgba(43,38,32,0.5)",
                clipPath:
                  "polygon(0% 0%, 0% 100%, " +
                  box.x +
                  "px 100%, " +
                  box.x +
                  "px " +
                  box.y +
                  "px, " +
                  (box.x + box.w) +
                  "px " +
                  box.y +
                  "px, " +
                  (box.x + box.w) +
                  "px " +
                  (box.y + box.h) +
                  "px, " +
                  box.x +
                  "px " +
                  (box.y + box.h) +
                  "px, " +
                  box.x +
                  "px 100%, 100% 100%, 100% 0%)",
              }}
            />

            <div
              onPointerDown={startMove}
              className="absolute border-2 border-forest cursor-move touch-none"
              style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
            />

            <div
              onPointerDown={startResize}
              className="absolute w-11 h-11 -ml-5.5 -mt-5.5 cursor-nwse-resize touch-none flex items-center justify-center"
              style={{ left: box.x + box.w, top: box.y + box.h }}
            >
              <div className="w-5 h-5 bg-forest border-2 border-cream rounded-full pointer-events-none" />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
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