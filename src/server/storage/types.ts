/**
 * Object storage contract (S3-compatible: AWS S3, Cloudflare R2, MinIO, Backblaze B2).
 * Stage 3 adds the implementation. Rules the implementation must follow:
 *  - validate with server/security/upload.ts BEFORE storing;
 *  - generate the object key on the server (never use the client file name);
 *  - serve through a CDN/public base URL or short-lived signed URLs.
 */
export interface StoredObject { key: string; url: string; size: number; mime: string }

export interface StorageProvider {
  put(input: { key: string; body: Uint8Array; mime: string }): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

export function buildObjectKey(scope: 'avatars' | 'covers' | 'portfolio' | 'studios', ownerId: string, id: string, ext: string): string {
  return `${scope}/${ownerId}/${id}.${ext.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
}
