import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { competidoresRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await competidoresRepo.listAll());
  } catch (e) {
    console.error("Error competidores:", e);
    return NextResponse.json({ error: "Error al obtener competidores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  if (!body?.nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  try {
    const data = await competidoresRepo.create({
      nombre: body.nombre,
      url: body.url || null,
      activo: body.activo !== false,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creando competidor:", e);
    return NextResponse.json({ error: "Error al crear competidor" }, { status: 500 });
  }
}
