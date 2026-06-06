import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { templatesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const categoria = searchParams.get("categoria");

  try {
    const data = await templatesRepo.listActivos(categoria);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching templates:", e);
    return NextResponse.json(
      { error: "Error al obtener templates" },
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
  const { nombre, descripcion, categoria, contenido_json, contenido_html } =
    body;

  if (!nombre) {
    return NextResponse.json(
      { error: "Nombre es requerido" },
      { status: 400 }
    );
  }

  try {
    const data = await templatesRepo.create({
      nombre,
      descripcion: descripcion || null,
      categoria: categoria || null,
      contenido_json: contenido_json || null,
      contenido_html: contenido_html || null,
      es_preset: false,
      activo: true,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating template:", e);
    return NextResponse.json(
      { error: "Error al crear template" },
      { status: 500 }
    );
  }
}
