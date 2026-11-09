/**
 * Upload validation. The declared MIME type is NEVER trusted: we sniff magic bytes and require a match.
 * SVG is deliberately rejected (script injection vector). Validate again on the server that receives the bytes.
 */
export const UPLOAD_LIMITS = { imageBytes: 10 * 1024 * 1024, videoBytes: 100 * 1024 * 1024 } as const;

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
const VIDEO_MIMES = ['video/mp4', 'video/webm'] as const;

export type UploadKind = 'image' | 'video';
export type UploadResult =
  | { ok: true; kind: UploadKind; mime: string }
  | { ok: false; reason: 'empty' | 'too_large' | 'unsupported_type' | 'content_mismatch' };

const ascii = (b: Uint8Array, from: number, len: number) => String.fromCharCode(...b.slice(from, from + len));

export function sniffMime(b: Uint8Array): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b[0] === 0x89 && ascii(b, 1, 3) === 'PNG' && b[4] === 0x0d && b[5] === 0x0a) return 'image/png';
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'image/webp';
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'video/webm';
  if (b.length >= 12 && ascii(b, 4, 4) === 'ftyp') {
    const brand = ascii(b, 8, 4);
    return brand === 'avif' || brand === 'avis' ? 'image/avif' : 'video/mp4';
  }
  return null;
}

export function validateUpload(input: { declaredMime: string; size: number; head: Uint8Array }): UploadResult {
  const { declaredMime, size, head } = input;
  if (size <= 0) return { ok: false, reason: 'empty' };
  const mime = declaredMime.toLowerCase();
  const kind: UploadKind | null = (IMAGE_MIMES as readonly string[]).includes(mime) ? 'image' : (VIDEO_MIMES as readonly string[]).includes(mime) ? 'video' : null;
  if (!kind) return { ok: false, reason: 'unsupported_type' };
  if (size > (kind === 'image' ? UPLOAD_LIMITS.imageBytes : UPLOAD_LIMITS.videoBytes)) return { ok: false, reason: 'too_large' };
  if (sniffMime(head) !== mime) return { ok: false, reason: 'content_mismatch' };
  return { ok: true, kind, mime };
}
