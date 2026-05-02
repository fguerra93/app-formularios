import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { searchParams } = request.nextUrl;

  const estado = searchParams.get("estado");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  let query = supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  if (estado && estado !== "todos") {
    query = query.eq("estado", estado);
  }
  if (desde) {
    query = query.gte("created_at", desde);
  }
  if (hasta) {
    query = query.lte("created_at", hasta);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
  }

  const headers = [
    "Numero",
    "Fecha",
    "Cliente",
    "Email",
    "Telefono",
    "Tipo Entrega",
    "Items",
    "Subtotal",
    "Envio",
    "Total",
    "Estado",
    "Pago",
  ];

  const rows = (data || []).map((p) => [
    p.numero_pedido,
    new Date(p.created_at).toLocaleDateString("es-CL"),
    p.cliente_nombre,
    p.cliente_email,
    p.cliente_telefono || "",
    p.tipo_entrega,
    Array.isArray(p.items) ? p.items.length : 0,
    p.subtotal,
    p.costo_envio,
    p.total,
    p.estado,
    p.pago_estado,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
