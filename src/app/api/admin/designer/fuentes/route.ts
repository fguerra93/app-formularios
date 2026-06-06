import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { fuentesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await fuentesRepo.listAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching fuentes:", e);
    return NextResponse.json(
      { error: "Error al obtener fuentes" },
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

  if (!body.nombre || !body.familia) {
    return NextResponse.json(
      { error: "nombre y familia son requeridos" },
      { status: 400 }
    );
  }

  try {
    const data = await fuentesRepo.create({
      nombre: body.nombre,
      familia: body.familia,
      url: body.url || null,
      categoria: body.categoria || null,
      popular: body.popular || false,
      activo: body.activo !== undefined ? body.activo : true,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating fuente:", e);
    return NextResponse.json(
      { error: "Error al crear fuente" },
      { status: 500 }
    );
  }
}
