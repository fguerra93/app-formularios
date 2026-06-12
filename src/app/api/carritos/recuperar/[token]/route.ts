import { NextRequest, NextResponse } from "next/server";
import { carritosRepo } from "@/server/repositories";

/**
 * Devuelve los items de un carrito abandonado a partir de su token de
 * recuperación (capability URL del email) y lo marca como recuperado.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  try {
    const carrito = await carritosRepo.findByToken(token);
    if (!carrito) {
      return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
    }
    try {
      await carritosRepo.markRecuperado(String(carrito.id));
    } catch { /* best-effort */ }
    return NextResponse.json({
      items: Array.isArray(carrito.items) ? carrito.items : [],
      total: Number(carrito.total) || 0,
    });
  } catch (e) {
    console.error("recuperar carrito:", e);
    return NextResponse.json({ error: "Error al recuperar el carrito" }, { status: 500 });
  }
}
