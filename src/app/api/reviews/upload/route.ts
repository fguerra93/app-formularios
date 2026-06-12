import { NextRequest, NextResponse } from "next/server";
import { storageRepo } from "@/server/repositories";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

/**
 * Upload público de UNA foto de reseña (acotado: solo imágenes, máx. 4 MB).
 * Devuelve la URL pública para incluirla en `reviews.fotos`.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }
    if (!TIPOS.has(file.type)) {
      return NextResponse.json({ error: "Solo imágenes (JPG, PNG o WebP)" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "La imagen no puede superar los 4 MB" }, { status: 413 });
    }

    const { url } = await storageRepo.uploadReviewImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Review upload error:", err);
    return NextResponse.json(
      { error: "No pudimos subir la foto. Puedes enviar tu opinión sin ella." },
      { status: 500 },
    );
  }
}
