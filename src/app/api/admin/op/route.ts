import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { ordenesProduccionRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const estado = request.nextUrl.searchParams.get("estado");
  try {
    const ordenes = await ordenesProduccionRepo.list(estado);
    return NextResponse.json(ordenes);
  } catch (e) {
    console.error("Error fetching OPs:", e);
    return NextResponse.json({ error: "Error al obtener OPs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await request.json();
  try {
    const op = await ordenesProduccionRepo.create({
      pedido_id: body.pedido_id || null,
      formulario_id: body.formulario_id || null,
      tipo: body.tipo || null,
      cantidad: body.cantidad || 1,
      dimensiones: body.dimensiones || null,
      material: body.material || null,
      archivo_diseno_url: body.archivo_diseno_url || null,
      precio_total: body.precio_total || 0,
      prioridad: body.prioridad || 0,
      fecha_compromiso: body.fecha_compromiso || null,
      operador: body.operador || null,
      tipo_entrega: body.tipo_entrega || null,
      notas: body.notas || null,
      estado: "en_cola",
    });
    if (!op) {
      return NextResponse.json({ error: "Error al crear OP" }, { status: 500 });
    }
    return NextResponse.json(op, { status: 201 });
  } catch (e) {
    console.error("Error creating OP:", e);
    return NextResponse.json({ error: "Error al crear OP" }, { status: 500 });
  }
}
