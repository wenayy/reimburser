import { put, del } from "@vercel/blob";

const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Validates and stores an uploaded image in Vercel Blob; returns its public URL. */
export async function saveImage(file: unknown, prefix: string): Promise<string | undefined> {
  if (!(file instanceof File) || file.size === 0) return undefined;
  const ext = EXT[file.type];
  if (!ext || file.size > MAX_BYTES) return undefined;
  try {
    const blob = await put(`${prefix}/${Date.now().toString(36)}.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return blob.url;
  } catch (err) {
    // an upload is never worth failing the whole action over
    console.error("blob upload failed", err);
    return undefined;
  }
}

export async function deleteUpload(url?: string) {
  if (!url?.startsWith("https://")) return;
  try {
    await del(url);
  } catch (err) {
    console.error("blob delete failed", err);
  }
}
