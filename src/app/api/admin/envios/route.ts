import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { zonasRepo } from "@/server/repositories";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const zonas = await zonasRepo.listAllOrdenadas();
    return NextResponse.json(zonas);
  } catch {
    return NextResponse.json({ error: "Error al obtener zonas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const data = await zonasRepo.create({
      nombre: body.nombre,
      comunas: body.comunas || [],
      precio: body.precio,
      envio_gratis_desde: body.envio_gratis_desde || null,
      activa: body.activa !== undefined ? body.activa : true,
      dias_despacho: body.dias_despacho || [],
      horario: body.horario || null,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating zona:", e);
    return NextResponse.json({ error: "Error al crear zona" }, { status: 500 });
  }
}
