import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { clipartRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await clipartRepo.listAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching clipart:", e);
    return NextResponse.json(
      { error: "Error al obtener clipart" },
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

  if (!body.nombre || !body.url) {
    return NextResponse.json(
      { error: "nombre y url son requeridos" },
      { status: 400 }
    );
  }

  try {
    const data = await clipartRepo.create({
      nombre: body.nombre,
      categoria: body.categoria || null,
      url: body.url,
      tags: body.tags || [],
      activo: body.activo !== undefined ? body.activo : true,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating clipart:", e);
    return NextResponse.json(
      { error: "Error al crear clipart" },
      { status: 500 }
    );
  }
}
