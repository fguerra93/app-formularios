import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { campanasRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await campanasRepo.findCampana(id);

  if (!data) {
    return NextResponse.json(
      { error: "Campana no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.asunto !== undefined) updateData.asunto = body.asunto;
  if (body.template_id !== undefined) updateData.template_id = body.template_id;
  if (body.contenido_html !== undefined) updateData.contenido_html = body.contenido_html;
  if (body.segmento !== undefined) updateData.segmento = body.segmento;
  if (body.estado !== undefined) updateData.estado = body.estado;
  if (body.programada_para !== undefined) updateData.programada_para = body.programada_para;

  updateData.updated_at = new Date().toISOString();

  try {
    const data = await campanasRepo.updateCampanaReturning(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating campana:", e);
    return NextResponse.json(
      { error: "Error al actualizar campana" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Only allow deleting campaigns in draft state
  const campana = await campanasRepo.findCampanaEstado(id);

  if (!campana) {
    return NextResponse.json(
      { error: "Campana no encontrada" },
      { status: 404 }
    );
  }

  if (campana.estado !== "borrador") {
    return NextResponse.json(
      { error: "Solo se pueden eliminar campanas en estado borrador" },
      { status: 400 }
    );
  }

  try {
    // Delete associated envios first
    await campanasRepo.deleteEnviosByCampana(id);
    await campanasRepo.deleteCampana(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting campana:", e);
    return NextResponse.json(
      { error: "Error al eliminar campana" },
      { status: 500 }
    );
  }
}
