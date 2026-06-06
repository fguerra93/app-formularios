import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { preguntasRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const estado = searchParams.get("estado");

  try {
    const data = await preguntasRepo.listAdmin(estado);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching preguntas:", e);
    return NextResponse.json({ error: "Error al obtener preguntas" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.respuesta !== undefined) {
    updateData.respuesta = body.respuesta;
    updateData.respuesta_at = new Date().toISOString();
  }
  if (body.publica !== undefined) updateData.publica = body.publica;

  try {
    const data = await preguntasRepo.update(body.id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating pregunta:", e);
    return NextResponse.json({ error: "Error al actualizar pregunta" }, { status: 500 });
  }
}
