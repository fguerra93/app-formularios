import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { clientesDestacadosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await clientesDestacadosRepo.listAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching clientes destacados:", e);
    return NextResponse.json({ error: "Error al obtener clientes destacados" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const data = await clientesDestacadosRepo.create({
      nombre: body.nombre,
      logo_url: body.logo_url || null,
      url_web: body.url_web || null,
      orden: body.orden || 0,
      activo: body.activo !== undefined ? body.activo : true,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating cliente destacado:", e);
    return NextResponse.json({ error: "Error al crear cliente destacado" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
  if (body.url_web !== undefined) updateData.url_web = body.url_web;
  if (body.orden !== undefined) updateData.orden = body.orden;

  try {
    const data = await clientesDestacadosRepo.update(body.id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating cliente destacado:", e);
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  try {
    await clientesDestacadosRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting cliente destacado:", e);
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
  }
}
