import { NextRequest, NextResponse } from "next/server";
import { disenosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const data = await disenosRepo.findById(id);

  if (!data) {
    return NextResponse.json(
      { error: "Diseno no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: {
    diseno_json?: unknown;
    preview_url?: string;
    nombre?: string;
    variante?: unknown;
    estado?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.diseno_json !== undefined) updateData.diseno_json = body.diseno_json;
  if (body.preview_url !== undefined) updateData.preview_url = body.preview_url;
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.variante !== undefined) updateData.variante = body.variante;
  if (body.estado !== undefined) updateData.estado = body.estado;

  try {
    const data = await disenosRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating diseno:", e);
    return NextResponse.json(
      { error: "Error al actualizar diseno" },
      { status: 500 }
    );
  }
}
