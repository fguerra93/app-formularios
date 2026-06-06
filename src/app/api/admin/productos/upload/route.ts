import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { storageRepo } from "@/server/repositories";

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibio archivo" }, { status: 400 });
  }

  try {
    const result = await storageRepo.uploadProductImage(file);
    return NextResponse.json({ url: result.url, path: result.path });
  } catch (e) {
    console.error("Error uploading image:", e);
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }
}
