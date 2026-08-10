"use client";

import { useRef, useState, useCallback } from "react";

interface Props {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onSkip: () => void;
}

// Fixed frame, matching how covers are displayed elsewhere (aspect-[3/4]).
// Instead of dragging small resize handles, the person drags the PHOTO
// underneath a stationary frame and pinches to zoom - the standard mobile
// crop pattern (Instagram, WhatsApp profile photos, etc.) rather than a
// custom handle-based tool.
const RATIO_W = 3;
const RATIO_H = 4;
const MAX_ZOOM = 3;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export default function ImageCropper(props: Props) {
  const imageSrc = props.imageSrc;
  const onConfirm = props.onConfirm;

  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gestureStart = useRef({
    zoom: 1,
    offset: { x: 0, y: 0 },
    dist: 0,
    midpoint: { x: 0, y: 0 },
  });

  function coverScale(vw: number, vh: number, nw: number, nh: number) {
    if (nw === 0 || nh === 0) return 1;
    return Math.max(vw / nw, vh / nh);
  }

  function clampOffset(nextOffset: { x: number; y: number }, currentZoom: number) {
    const base = coverScale(viewport.width, viewport.height, natural.width, natural.height);
    const renderScale = base * currentZoom;
    const displayW = natural.width * renderScale;
    const displayH = natural.height * renderScale;
    const minX = viewport.width - displayW;
    const minY = viewport.height - displayH;
    return {
      x: Math.min(0, Math.max(minX, nextOffset.x)),
      y: Math.min(0, Math.max(minY, nextOffset.y)),
    };
  }

  const measureViewport = useCallback(function () {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setViewport({ width: rect.width, height: rect.height });
  }, []);

  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    measureViewport();
    setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setReady(true);
  }

  // Re-center whenever we first know both viewport and image size.
  const centered = useRef(false);
  if (ready && viewport.width > 0 && natural.width > 0 && !centered.current) {
    centered.current = true;
    const base = coverScale(viewport.width, viewport.height, natural.width, natural.height);
    const displayW = natural.width * base;
    const displayH = natural.height * base;
    setOffset({ x: (viewport.width - displayW) / 2, y: (viewport.height - displayH) / 2 });
  }

  function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    if (target.setPointerCapture) {
      try { target.setPointerCapture(e.pointerId); } catch (err) {}
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      gestureStart.current = {
        zoom: zoom,
        offset: offset,
        dist: dist(pts[0], pts[1]),
        midpoint: midpoint(pts[0], pts[1]),
      };
    } else {
      gestureStart.current = {
        zoom: zoom,
        offset: offset,
        dist: 0,
        midpoint: { x: e.clientX, y: e.clientY },
      };
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const currentDist = dist(pts[0], pts[1]);
      const currentMid = midpoint(pts[0], pts[1]);
      const scaleFactor = gestureStart.current.dist > 0 ? currentDist / gestureStart.current.dist : 1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(1, gestureStart.current.zoom * scaleFactor));

      const dx = currentMid.x - gestureStart.current.midpoint.x;
      const dy = currentMid.y - gestureStart.current.midpoint.y;

      setZoom(newZoom);
      setOffset(clampOffset({ x: gestureStart.current.offset.x + dx, y: gestureStart.current.offset.y + dy }, newZoom));
    } else if (pointers.current.size === 1) {
      const pt = pointers.current.get(e.pointerId);
      if (!pt) return;
      const dx = pt.x - gestureStart.current.midpoint.x;
      const dy = pt.y - gestureStart.current.midpoint.y;
      setOffset(clampOffset({ x: gestureStart.current.offset.x + dx, y: gestureStart.current.offset.y + dy }, zoom));
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size >= 1) {
      const remaining = Array.from(pointers.current.entries())[0];
      gestureStart.current = {
        zoom: zoom,
        offset: offset,
        dist: 0,
        midpoint: { x: remaining[1].x, y: remaining[1].y },
      };
    }
  }

  function adjustZoom(delta: number) {
    const newZoom = Math.min(MAX_ZOOM, Math.max(1, zoom + delta));
    setZoom(newZoom);
    setOffset(clampOffset(offset, newZoom));
  }

  function handleReset() {
    const base = coverScale(viewport.width, viewport.height, natural.width, natural.height);
    const displayW = natural.width * base;
    const displayH = natural.height * base;
    setZoom(1);
    setOffset({ x: (viewport.width - displayW) / 2, y: (viewport.height - displayH) / 2 });
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

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || viewport.width === 0) return;

    const base = coverScale(viewport.width, viewport.height, natural.width, natural.height);
    const renderScale = base * zoom;

    const sx = Math.round(-offset.x / renderScale);
    const sy = Math.round(-offset.y / renderScale);
    const sw = Math.round(viewport.width / renderScale);
    const sh = Math.round(viewport.height / renderScale);

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    onConfirm(resizeIfNeeded(canvas));
  }

  const base = coverScale(viewport.width, viewport.height, natural.width, natural.height);
  const renderScale = base * zoom;
  const displayW = natural.width * renderScale;
  const displayH = natural.height * renderScale;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink/60 -mb-1">
        Drag the photo to reposition it. Pinch to zoom (or use the buttons below).
      </p>

      <div
        ref={viewportRef}
        className="relative overflow-hidden bg-ink/5 mx-auto touch-none select-none"
        style={{ width: "100%", maxWidth: "320px", aspectRatio: RATIO_W + " / " + RATIO_H }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Crop preview"
          draggable={false}
          onLoad={handleImgLoad}
          style={{
            position: "absolute",
            left: offset.x + "px",
            top: offset.y + "px",
            width: displayW + "px",
            height: displayH + "px",
            maxWidth: "none",
            pointerEvents: "none",
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={function () { adjustZoom(-0.2); }}
          className="w-9 h-9 rounded-full border border-ink/25 text-ink/70 hover:border-ink transition-colors flex items-center justify-center font-mono text-lg leading-none"
        >
          &#8722;
        </button>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50 w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={function () { adjustZoom(0.2); }}
          className="w-9 h-9 rounded-full border border-ink/25 text-ink/70 hover:border-ink transition-colors flex items-center justify-center font-mono text-lg leading-none"
        >
          +
        </button>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button type="button" onClick={handleReset} className="font-mono text-[11px] uppercase tracking-widest border border-ink/25 text-ink/70 rounded-full px-4 py-2 hover:border-ink transition-colors">
          Reset
        </button>
        <button type="button" onClick={handleConfirm} className="font-mono text-[11px] uppercase tracking-widest bg-forest text-cream rounded-full px-5 py-2 hover:bg-forest-dark transition-colors">
          Confirm crop
        </button>
      </div>
    </div>
  );
}