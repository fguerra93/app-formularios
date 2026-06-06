import { getDb } from "@/server/db";

/**
 * Acceso a Storage. Encapsula el SDK de Supabase Storage tras esta capa.
 * En Fase 8B se reemplaza por Cloudflare R2 (S3) sin tocar las rutas.
 */
export const storageRepo = {
  /** URL firmada de subida + URL pública para un archivo de formulario. */
  async createSignedUploadUrl(
    folderName: string,
    fileName: string
  ): Promise<{ signedUrl: string; token: string; publicUrl: string }> {
    const db = getDb();
    const filePath = `${folderName}/${fileName}`;

    const { data, error } = await db.storage
      .from("formularios-archivos")
      .createSignedUploadUrl(filePath);
    if (error || !data) {
      throw new Error(error?.message || "Error generando URL de subida");
    }

    const {
      data: { publicUrl },
    } = db.storage.from("formularios-archivos").getPublicUrl(filePath);

    return { signedUrl: data.signedUrl, token: data.token, publicUrl };
  },

  /** Sube una imagen de producto y devuelve su URL pública y path. */
  async uploadProductImage(
    file: File
  ): Promise<{ url: string; path: string }> {
    const db = getDb();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `productos/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error } = await db.storage
      .from("productos-imagenes")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);

    const { data: urlData } = db.storage
      .from("productos-imagenes")
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, path: filePath };
  },

  /** Sube un archivo recibido por chat al bucket `archivos`; devuelve su URL pública. */
  async uploadChatFile(
    storagePath: string,
    buffer: Uint8Array | Buffer,
    contentType: string
  ): Promise<{ publicUrl: string }> {
    const db = getDb();
    const { error } = await db.storage
      .from("archivos")
      .upload(storagePath, buffer, { contentType });
    if (error) throw new Error(error.message);

    const { data: urlData } = db.storage.from("archivos").getPublicUrl(storagePath);
    return { publicUrl: urlData.publicUrl };
  },
};
