import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { mensajesRapidosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await mensajesRapidosRepo.listAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching mensajes rapidos:", e);
    return NextResponse.json(
      { error: "Error al obtener mensajes rapidos" },
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
    const data = await mensajesRapidosRepo.create({
      titulo: body.titulo,
      contenido: body.contenido,
      categoria: body.categoria || null,
      atajo: body.atajo || null,
      canales: body.canales || [],
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating mensaje rapido:", e);
    return NextResponse.json(
      { error: "Error al crear mensaje rapido" },
      { status: 500 }
    );
  }
}
