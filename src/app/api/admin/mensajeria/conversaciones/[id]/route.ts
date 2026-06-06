import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { mensajeriaRepo } from "@/server/repositories";

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

  // Get conversation
  const conversacion = await mensajeriaRepo.findConversacion(id);

  if (!conversacion) {
    return NextResponse.json(
      { error: "Conversacion no encontrada" },
      { status: 404 }
    );
  }

  // Get all messages ordered chronologically
  let mensajes;
  try {
    mensajes = await mensajeriaRepo.listMensajes(id);
  } catch (e) {
    console.error("Error fetching mensajes:", e);
    return NextResponse.json(
      { error: "Error al obtener mensajes" },
      { status: 500 }
    );
  }

  // Reset unread count
  if ((conversacion.no_leidos as number) > 0) {
    try {
      await mensajeriaRepo.updateConversacion(id, {
        no_leidos: 0,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Error resetting no_leidos:", e);
    }
  }

  return NextResponse.json({
    conversacion,
    mensajes: mensajes || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.estado !== undefined) updateData.estado = body.estado;
  if (body.etiquetas !== undefined) updateData.etiquetas = body.etiquetas;
  if (body.asignado_a !== undefined) updateData.asignado_a = body.asignado_a;

  try {
    const data = await mensajeriaRepo.updateConversacionReturning(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating conversacion:", e);
    return NextResponse.json(
      { error: "Error al actualizar conversacion" },
      { status: 500 }
    );
  }
}
