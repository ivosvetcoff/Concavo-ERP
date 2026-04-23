import { put, del } from "@vercel/blob";

// Graceful no-op when BLOB_READ_WRITE_TOKEN is not configured
const blobEnabled = !!process.env.BLOB_READ_WRITE_TOKEN;

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Upload a file to Vercel Blob.
 * Falls back to a data-URL stub in local dev (no token).
 */
export async function uploadComprobante(
  file: File,
  prefix: "compras" | "insumos"
): Promise<UploadResult> {
  if (!blobEnabled) {
    // Dev fallback: return a fake URL so the UI still works
    console.warn("[blob no-op] BLOB_READ_WRITE_TOKEN not set — upload skipped");
    return { ok: true, url: `local://${prefix}/${file.name}` };
  }

  try {
    const pathname = `${prefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return { ok: true, url: blob.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

/**
 * Delete a previously uploaded comprobante.
 */
export async function deleteComprobante(url: string): Promise<void> {
  if (!blobEnabled || url.startsWith("local://")) return;
  try {
    await del(url);
  } catch {
    // Non-fatal — log and continue
    console.error("[blob] Failed to delete:", url);
  }
}
