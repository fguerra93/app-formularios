import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { respuestasAutomaticasRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

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
  if (body.canales !== undefined) updateData.canales = body.canales;
  if (body.palabras_clave !== undefined)
    updateData.palabras_clave = body.palabras_clave;
  if (body.respuesta !== undefined) updateData.respuesta = body.respuesta;
  if (body.tipo_respuesta !== undefined)
    updateData.tipo_respuesta = body.tipo_respuesta;
  if (body.media_url !== undefined) updateData.media_url = body.media_url;
  if (body.activo !== undefined) updateData.activo = body.activo;
  if (body.prioridad !== undefined) updateData.prioridad = body.prioridad;
  if (body.horario_inicio !== undefined)
    updateData.horario_inicio = body.horario_inicio;
  if (body.horario_fin !== undefined)
    updateData.horario_fin = body.horario_fin;

  try {
    const data = await respuestasAutomaticasRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating respuesta automatica:", e);
    return NextResponse.json(
      { error: "Error al actualizar respuesta automatica" },
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

  try {
    await respuestasAutomaticasRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting respuesta automatica:", e);
    return NextResponse.json(
      { error: "Error al eliminar respuesta automatica" },
      { status: 500 }
    );
  }
}
