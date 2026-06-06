import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { cuponesRepo } from "@/server/repositories";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await cuponesRepo.listAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching cupones:", e);
    return NextResponse.json({ error: "Error al obtener cupones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const data = await cuponesRepo.create({
      codigo: body.codigo,
      tipo: body.tipo,
      valor: body.valor,
      minimo_compra: body.minimo_compra || 0,
      maximo_descuento: body.maximo_descuento || null,
      fecha_inicio: body.fecha_inicio || null,
      fecha_expiracion: body.fecha_expiracion || null,
      usos_maximos: body.usos_maximos || null,
      usos_actuales: body.usos_actuales || 0,
      activo: body.activo !== undefined ? body.activo : true,
      aplica_a: body.aplica_a || "todo",
      aplica_ids: body.aplica_ids || [],
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating cupon:", e);
    return NextResponse.json({ error: "Error al crear cupon" }, { status: 500 });
  }
}
