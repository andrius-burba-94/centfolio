import "server-only";
import sharp from "sharp";

/**
 * Server-side normalization for an uploaded receipt photo. Accepts
 * any sharp-decodable format (JPEG, PNG, WebP, HEIC) and returns a
 * normalized JPEG ready for both PocketBase storage and the Gemini
 * multimodal call.
 *
 * The pipeline:
 *
 * 1. Decode (HEIC support requires libvips with heif; verified on
 *    the VPS as part of Phase 3 pre-work).
 * 2. Auto-rotate based on EXIF orientation.
 * 3. Resize so the longer edge is at most 1600px, preserving
 *    aspect ratio, never enlarging.
 * 4. Re-encode as JPEG quality 85 with mozjpeg for tighter files.
 * 5. EXIF intentionally stripped (privacy: drops GPS, device, time).
 *
 * Output target is well under CONTEXT.md's 5 MB per-photo cap on
 * realistic receipt photos.
 */
export const MAX_LONG_EDGE_PX = 1600;
export const JPEG_QUALITY = 85;
export const RAW_UPLOAD_MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function normalizeReceiptPhoto(
  input: Buffer | Uint8Array | ArrayBuffer,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const inputBuffer = input instanceof Buffer
    ? input
    : Buffer.from(input as ArrayBuffer);

  const pipeline = sharp(inputBuffer, { failOn: "error" })
    .rotate()
    .resize({
      width: MAX_LONG_EDGE_PX,
      height: MAX_LONG_EDGE_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}
