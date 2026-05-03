import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();

  // Check if social proof is active
  try {
    const { data: config } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "social_proof_activo")
      .single();

    if (config && config.valor === "false") {
      return NextResponse.json([]);
    }
  } catch {
    // If config not found, default to active
  }

  // Get orders from the last 48 hours
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: pedidos, error } = await supabase
    .from("pedidos")
    .select("cliente_nombre, items, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching compras recientes:", error);
    return NextResponse.json({ error: "Error al obtener compras recientes" }, { status: 500 });
  }

  if (!pedidos || pedidos.length === 0) {
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
