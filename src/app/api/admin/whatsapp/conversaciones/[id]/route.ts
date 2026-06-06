import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { whatsappRepo } from "@/server/repositories";

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
  const conversacion = await whatsappRepo.findConversacion(id);

  if (!conversacion) {
    return NextResponse.json(
      { error: "Conversacion no encontrada" },
      { status: 404 }
    );
  }

  // Get all messages ordered chronologically
  let mensajes;
  try {
    mensajes = await whatsappRepo.listMensajes(id);
  } catch (e) {
    console.error("Error fetching mensajes:", e);
    return NextResponse.json(
      { error: "Error al obtener mensajes" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    conversacion,
    mensajes: mensajes || [],
  });
}
