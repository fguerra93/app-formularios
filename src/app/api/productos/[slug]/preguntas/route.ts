import { NextRequest, NextResponse } from "next/server";
import { preguntasRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const producto = await preguntasRepo.findProductoIdBySlug(slug);
  if (!producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  try {
    const preguntas = await preguntasRepo.listPublicasByProducto(producto.id);
    return NextResponse.json(preguntas);
  } catch (e) {
    console.error("Error fetching preguntas:", e);
    return NextResponse.json({ error: "Error al obtener preguntas" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const producto = await preguntasRepo.findProductoIdBySlug(slug);
  if (!producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  let body: {
    autor_nombre?: string;
    autor_email?: string;
    pregunta?: string;
    cliente_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { autor_nombre, autor_email, pregunta, cliente_id } = body;

  if (!autor_nombre || !autor_email || !pregunta) {
    return NextResponse.json(
      { error: "Nombre, email y pregunta son requeridos" },
      { status: 400 }
    );
  }

  try {
    const data = await preguntasRepo.create({
      producto_id: producto.id,
      autor_nombre,
      autor_email,
      pregunta,
      cliente_id: cliente_id || null,
      publica: false,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating pregunta:", e);
    return NextResponse.json({ error: "Error al crear pregunta" }, { status: 500 });
  }
}
