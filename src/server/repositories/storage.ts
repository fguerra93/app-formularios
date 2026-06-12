import { Storage } from "@google-cloud/storage";

/**
 * Acceso a Storage en Google Cloud Storage (Variante B, all-GCP).
 * Bucket público de lectura `printup-archivos-sandbox` (uniform access +
 * allUsers objectViewer). En Cloud Run usa ADC del service account; las URLs
 * firmadas de subida (v4) se firman vía IAM SignBlob (rol
 * serviceAccountTokenCreator). El cliente sube con un PUT directo a la URL.
 */
const BUCKET = process.env.GCS_BUCKET || "printup-archivos-sandbox";

let _storage: Storage | null = null;
function bucket() {
  if (!_storage) _storage = new Storage();
  return _storage.bucket(BUCKET);
}
function publicUrlFor(filePath: string): string {
  return `https://storage.googleapis.com/${BUCKET}/${filePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export const storageRepo = {
  /** URL firmada de subida (PUT directo) + URL pública para un archivo. */
  async createSignedUploadUrl(
    folderName: string,
    fileName: string
  ): Promise<{ signedUrl: string; token: string; publicUrl: string }> {
    const filePath = `${folderName}/${fileName}`;
    const [signedUrl] = await bucket()
      .file(filePath)
      .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000,
      });
    // token vacío: el cliente hace PUT directo (no usa uploadToSignedUrl).
    return { signedUrl, token: "", publicUrl: publicUrlFor(filePath) };
  },

  /** Sube una imagen de producto y devuelve su URL pública y path. */
  async uploadProductImage(
    file: File
  ): Promise<{ url: string; path: string }> {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `productos/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await bucket().file(filePath).save(buffer, {
      contentType: file.type || "application/octet-stream",
      resumable: false,
    });
    return { url: publicUrlFor(filePath), path: filePath };
  },

  /** Sube una foto de reseña de cliente y devuelve su URL pública. */
  async uploadReviewImage(file: File): Promise<{ url: string; path: string }> {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || "jpg"}`;
    const filePath = `reviews/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await bucket().file(filePath).save(buffer, {
      contentType: file.type || "image/jpeg",
      resumable: false,
    });
    return { url: publicUrlFor(filePath), path: filePath };
  },

  /** Sube un archivo recibido por chat; devuelve su URL pública. */
  async uploadChatFile(
    storagePath: string,
    buffer: Uint8Array | Buffer,
    contentType: string
  ): Promise<{ publicUrl: string }> {
    await bucket().file(storagePath).save(Buffer.from(buffer), {
      contentType,
      resumable: false,
    });
    return { publicUrl: publicUrlFor(storagePath) };
  },
};
