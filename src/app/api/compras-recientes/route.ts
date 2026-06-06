import { NextResponse } from "next/server";
import { configuracionRepo, pedidosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  // Check if social proof is active (default: active if not set)
  const activo = await configuracionRepo.get("social_proof_activo");
  if (activo === "false") {
    return NextResponse.json([]);
  }

  // Get orders from the last 48 hours
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  let pedidos;
  try {
    pedidos = await pedidosRepo.findRecientes(since, 10);
  } catch (e) {
    console.error("Error fetching compras recientes:", e);
    return NextResponse.json(
      { error: "Error al obtener compras recientes" },
      { status: 500 }
    );
  }

  if (pedidos.length === 0) {
    return NextResponse.json([]);
  }

  const result = pedidos.map((pedido) => {
    // Anonymize name: "Juan G."
    const partes = (pedido.cliente_nombre || "").trim().split(/\s+/);
    const nombre_parcial =
      partes.length > 1
        ? `${partes[0]} ${partes[1].charAt(0).toUpperCase()}.`
        : partes[0] || "Cliente";

    // Get first item info
    const items = Array.isArray(pedido.items) ? pedido.items : [];
    const firstItem = items[0] as { nombre?: string; imagen?: string } | undefined;

    return {
      nombre_parcial,
      producto_nombre: firstItem?.nombre || "Producto",
      producto_imagen: firstItem?.imagen || null,
      created_at: pedido.created_at,
    };
  });

  return NextResponse.json(result);
}
