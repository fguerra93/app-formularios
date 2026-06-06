import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { formulariosRepo, pedidosRepo } from "@/server/repositories";
import type { Pedido } from "@/server/domain";

export const dynamic = "force-dynamic";

/**
 * Cliente 360 (Patrón 8): timeline unificado de un contacto por email
 * (pedidos + formularios) + valor histórico. Los mensajes WA/IG/FB se enlazan
 * por canal/teléfono, no por email, por lo que se incorporan en una fase
 * posterior; aquí se consolida lo enlazable por email.
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email requerido" }, { status: 400 });
  }

  const [pedidos, formularios] = await Promise.all([
    pedidosRepo.listByEmail(email),
    formulariosRepo.listByEmail(email),
  ]);

  const pagados = pedidos.filter((p) => (p as Pedido).pago_estado === "pagado");
  const valorHistorico = pagados.reduce(
    (s, p) => s + (Number((p as Pedido).total) || 0),
    0
  );

  // Timeline combinado (orden cronológico desc).
  const timeline = [
    ...pedidos.map((p) => ({
      tipo: "pedido" as const,
      fecha: (p as Pedido).created_at,
      titulo: `Pedido #${(p as Pedido).numero_pedido} — ${(p as Pedido).estado}`,
      detalle: `$${Number((p as Pedido).total).toLocaleString("es-CL")} · pago ${(p as Pedido).pago_estado}`,
      ref: (p as Pedido).id,
    })),
    ...formularios.map((f) => ({
      tipo: "formulario" as const,
      fecha: f.created_at as string,
      titulo: `Cotización/contacto — ${f.estado}`,
      detalle: (f.material as string) || (f.mensaje as string) || "",
      ref: f.id as string,
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return NextResponse.json({
    email,
    resumen: {
      total_pedidos: pedidos.length,
      pedidos_pagados: pagados.length,
      total_formularios: formularios.length,
      valor_historico: valorHistorico,
    },
    pedidos,
    formularios,
    timeline,
  });
}
