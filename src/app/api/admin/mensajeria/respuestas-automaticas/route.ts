import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { respuestasAutomaticasRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await respuestasAutomaticasRepo.listAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching respuestas automaticas:", e);
    return NextResponse.json(
      { error: "Error al obtener respuestas automaticas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const data = await respuestasAutomaticasRepo.create({
      nombre: body.nombre,
      canales: body.canales || [],
      palabras_clave: body.palabras_clave || [],
      respuesta: body.respuesta,
      tipo_respuesta: body.tipo_respuesta || "texto",
      media_url: body.media_url || null,
      activo: body.activo !== undefined ? body.activo : true,
      prioridad: body.prioridad || 0,
      horario_inicio: body.horario_inicio || null,
      horario_fin: body.horario_fin || null,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating respuesta automatica:", e);
    return NextResponse.json(
      { error: "Error al crear respuesta automatica" },
      { status: 500 }
    );
  }
}
