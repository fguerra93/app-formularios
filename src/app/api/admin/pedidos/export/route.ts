import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { pedidosRepo } from "@/server/repositories";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  let data;
  try {
    data = await pedidosRepo.listForExport({
      estado: searchParams.get("estado"),
      desde: searchParams.get("desde"),
      hasta: searchParams.get("hasta"),
    });
  } catch {
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

  const rows = data.map((p) => [
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
