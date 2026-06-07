import { NextRequest, NextResponse } from "next/server";
import { carritosRepo } from "@/server/repositories";
import { getClienteSession } from "@/lib/auth-cliente";

export const dynamic = "force-dynamic";

export async function GET() {
  const sess = await getClienteSession();
  if (!sess) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const carrito = await carritosRepo.getActivo(sess.id);
  return NextResponse.json({ carrito });
}

export async function POST(request: NextRequest) {
  const sess = await getClienteSession();
  if (!sess) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { items, cupon_codigo } = await request.json();
  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: "Se requiere un array de items" }, { status: 400 });
  }
  const carrito = await carritosRepo.upsertActivo(
    sess.id,
    sess.email || null,
    items,
    cupon_codigo || null
  );
  return NextResponse.json({ success: true, carrito });
}
