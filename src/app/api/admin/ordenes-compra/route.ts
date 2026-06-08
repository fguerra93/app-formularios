import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { ordenesCompraRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await ordenesCompraRepo.list());
  } catch (e) {
    console.error("Error OCs:", e);
    return NextResponse.json({ error: "Error al obtener órdenes de compra" }, { status: 500 });
  }
}

interface OCItemInput {
  insumo_id?: string;
  nombre?: string;
  cantidad?: number;
  precio_unitario?: number;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  const items: OCItemInput[] = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "La OC necesita al menos un ítem" }, { status: 400 });
  }

  const total = items.reduce(
    (s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0),
    0
  );

  try {
    const oc = await ordenesCompraRepo.create({
      proveedor_id: body.proveedor_id || null,
      estado: "borrador",
      total,
      notas: body.notas || null,
    });
    await ordenesCompraRepo.addItems(
      items.map((it) => ({
        oc_id: oc.id,
        insumo_id: it.insumo_id || null,
        nombre: it.nombre || null,
        cantidad: Number(it.cantidad) || 1,
        precio_unitario: Number(it.precio_unitario) || 0,
        cantidad_recibida: 0,
      }))
    );
    return NextResponse.json(oc, { status: 201 });
  } catch (e) {
    console.error("Error creando OC:", e);
    return NextResponse.json({ error: "Error al crear OC" }, { status: 500 });
  }
}
