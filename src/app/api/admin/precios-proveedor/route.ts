import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { preciosProveedorRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const insumoId = request.nextUrl.searchParams.get("insumo_id");
  try {
    const data = insumoId
      ? await preciosProveedorRepo.listByInsumo(insumoId)
      : await preciosProveedorRepo.listAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error precios:", e);
    return NextResponse.json({ error: "Error al obtener precios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  if (!body?.insumo_id || body.precio == null) {
    return NextResponse.json({ error: "insumo_id y precio requeridos" }, { status: 400 });
  }
  try {
    const data = await preciosProveedorRepo.create({
      insumo_id: body.insumo_id,
      proveedor_id: body.proveedor_id || null,
      precio: Number(body.precio) || 0,
      fecha: body.fecha || new Date().toISOString().slice(0, 10),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creando precio:", e);
    return NextResponse.json({ error: "Error al registrar precio" }, { status: 500 });
  }
}
