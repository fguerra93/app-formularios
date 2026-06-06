import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { categoriasRepo } from "@/server/repositories";

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  const slug = body.slug || body.nombre
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  try {
    const data = await categoriasRepo.create({
      nombre: body.nombre,
      slug,
      descripcion: body.descripcion || null,
      imagen_url: body.imagen_url || null,
      orden: body.orden || 0,
      activa: body.activa !== undefined ? body.activa : true,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating categoria:", e);
    return NextResponse.json({ error: "Error al crear categoria" }, { status: 500 });
  }
}
