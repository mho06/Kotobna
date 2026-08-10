// Resizes and compresses a photo before upload, without any interactive
// crop step. Caps the longest side at MAX_DIMENSION and re-encodes as
// JPEG - this is what keeps uploads fast on mobile data even though
// phone camera photos can be 10+ megapixels.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export function resizeImageDataUrl(dataUrl: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const longest = Math.max(w, h);
      const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = function () {
      reject(new Error("Could not read image."));
    };
    img.src = dataUrl;
  });
}
