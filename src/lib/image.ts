/**
 * Image optimization utilities
 * - Next.js Image component ke saath use karo
 * - Client-side compress before upload
 * - Blur placeholder generation
 */

// ── URL helpers ───────────────────────────────────────────────────────────────

/** Supabase storage URL se trailing ? hatao */
export function cleanImageUrl(url: string | null | undefined): string | null {
 if (!url) return null;
 return url.replace(/\?$/, "").trim();
}

/** Supabase URL ko width/quality transform ke saath return karo */
export function supabaseImageUrl(
 url: string | null | undefined,
 options ? : { width ? : number;quality ? : number }
): string | null {
 const clean = cleanImageUrl(url);
 if (!clean) return null;
 
 // Supabase storage transform API
 if (clean.includes("supabase.co/storage/v1/object/public")) {
  const params = new URLSearchParams();
  if (options?.width) params.set("width", String(options.width));
  if (options?.quality) params.set("quality", String(options.quality));
  const qs = params.toString();
  return qs ? `${clean}?${qs}` : clean;
 }
 
 return clean;
}

// ── Blur placeholder ──────────────────────────────────────────────────────────

/** Solid color placeholder — 1x1 SVG as base64 */
export function getColorPlaceholder(hex = "#f3f4f6"): string {
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="${hex}" width="1" height="1"/></svg>`;
 return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Default shimmer placeholder (pure CSS) */
export const SHIMMER_PLACEHOLDER =
 "data:image/svg+xml;base64," +
 Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#e5e7eb"/>
    </svg>`
 ).toString("base64");

// ── Client-side compress before upload ───────────────────────────────────────

export interface CompressOptions {
 maxWidth ? : number;
 maxHeight ? : number;
 quality ? : number; // 0–1
 format ? : "webp" | "jpeg";
}

/**
 * Browser mein file compress karo before upload.
 * Canvas API use karta hai — server load zero.
 */
export async function compressImage(
 file: File,
 options: CompressOptions = {}
): Promise < File > {
 const {
  maxWidth = 800,
   maxHeight = 800,
   quality = 0.8,
   format = "webp",
 } = options;
 
 return new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  
  img.onload = () => {
   URL.revokeObjectURL(url);
   
   // Aspect-ratio preserving resize
   let { width, height } = img;
   if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
   }
   
   const canvas = document.createElement("canvas");
   canvas.width = width;
   canvas.height = height;
   const ctx = canvas.getContext("2d");
   if (!ctx) { reject(new Error("Canvas not supported")); return; }
   
   ctx.drawImage(img, 0, 0, width, height);
   
   const mimeType = format === "webp" ? "image/webp" : "image/jpeg";
   canvas.toBlob(
    (blob) => {
     if (!blob) { reject(new Error("Compression failed")); return; }
     const compressed = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, `.${format}`), { type: mimeType }
     );
     resolve(compressed);
    },
    mimeType,
    quality
   );
  };
  
  img.onerror = () => { URL.revokeObjectURL(url);
   reject(new Error("Image load failed")); };
  img.src = url;
 });
}

// ── srcSet sizes helper ───────────────────────────────────────────────────────

/** Common responsive sizes string */
export const PRODUCT_CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";
export const PRODUCT_DETAIL_SIZES = "(max-width: 1024px) 100vw, 50vw";
export const HERO_SIZES = "100vw";
export const ADMIN_THUMB_SIZES = "40px";