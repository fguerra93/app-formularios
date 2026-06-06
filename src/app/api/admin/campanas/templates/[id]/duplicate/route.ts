import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { templatesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Get original template
  const original = await templatesRepo.findById(id);

  if (!original) {
    return NextResponse.json(
      { error: "Template no encontrado" },
      { status: 404 }
    );
  }

  try {
    // Create copy
    const data = await templatesRepo.create({
      nombre: `Copia de ${original.nombre}`,
      descripcion: original.descripcion,
      categoria: original.categoria,
      contenido_json: original.contenido_json,
      contenido_html: original.contenido_html,
      thumbnail_url: original.thumbnail_url,
      es_preset: false,
      activo: true,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error duplicating template:", e);
    return NextResponse.json(
      { error: "Error al duplicar template" },
      { status: 500 }
    );
  }
}
