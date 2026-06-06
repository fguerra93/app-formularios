import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { portafolioRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await portafolioRepo.listAdmin();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching portafolio:", e);
    return NextResponse.json({ error: "Error al obtener trabajos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const data = await portafolioRepo.create({
      titulo: body.titulo,
      descripcion: body.descripcion || null,
      cliente_nombre: body.cliente_nombre || null,
      categoria: body.categoria || null,
      imagenes: body.imagenes || [],
      destacado: body.destacado || false,
      activo: body.activo !== undefined ? body.activo : true,
      orden: body.orden || 0,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating trabajo:", e);
    return NextResponse.json({ error: "Error al crear trabajo" }, { status: 500 });
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
  if (body.titulo !== undefined) updateData.titulo = body.titulo;
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
  if (body.cliente_nombre !== undefined) updateData.cliente_nombre = body.cliente_nombre;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.imagenes !== undefined) updateData.imagenes = body.imagenes;
  if (body.destacado !== undefined) updateData.destacado = body.destacado;
  if (body.activo !== undefined) updateData.activo = body.activo;
  if (body.orden !== undefined) updateData.orden = body.orden;

  try {
    const data = await portafolioRepo.update(body.id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating trabajo:", e);
    return NextResponse.json({ error: "Error al actualizar trabajo" }, { status: 500 });
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
    await portafolioRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting trabajo:", e);
    return NextResponse.json({ error: "Error al eliminar trabajo" }, { status: 500 });
  }
}
