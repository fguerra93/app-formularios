import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { zonasRepo } from "@/server/repositories";

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
  if (body.comunas !== undefined) updateData.comunas = body.comunas;
  if (body.precio !== undefined) updateData.precio = body.precio;
  if (body.envio_gratis_desde !== undefined) updateData.envio_gratis_desde = body.envio_gratis_desde;
  if (body.activa !== undefined) updateData.activa = body.activa;
  if (body.dias_despacho !== undefined) updateData.dias_despacho = body.dias_despacho;
  if (body.horario !== undefined) updateData.horario = body.horario;

  try {
    const data = await zonasRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating zona:", e);
    return NextResponse.json({ error: "Error al actualizar zona" }, { status: 500 });
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
    await zonasRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting zona:", e);
    return NextResponse.json({ error: "Error al eliminar zona" }, { status: 500 });
  }
}
