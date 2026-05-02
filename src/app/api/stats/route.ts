import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // --- Formularios stats ---
  const { count: hoy } = await supabase
    .from("formularios")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);

  const { count: mes } = await supabase
    .from("formularios")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart);

  const { count: total } = await supabase
    .from("formularios")
    .select("*", { count: "exact", head: true });

  // Email stats
  const { count: emailsTotal } = await supabase
    .from("email_log")
    .select("*", { count: "exact", head: true });

  const { count: emailsExitosos } = await supabase
    .from("email_log")
    .select("*", { count: "exact", head: true })
    .eq("estado", "enviado");

  const tasa_exito =
    emailsTotal && emailsTotal > 0
      ? Math.round(((emailsExitosos || 0) / emailsTotal) * 100)
      : 100;

  const { count: emailsHoy } = await supabase
    .from("email_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);

  const { count: emailsMes } = await supabase
    .from("email_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart);

  const emails_restantes_dia = 100 - (emailsHoy || 0);
  const emails_restantes_mes = 3000 - (emailsMes || 0);

  // Formularios last 7 days
  const diarios: { fecha: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

    const { count: dayCount } = await supabase
      .from("formularios")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dayStart.toISOString())
      .lt("created_at", dayEnd.toISOString());

    diarios.push({
      fecha: dayStart.toISOString().split("T")[0],
      count: dayCount || 0,
    });
  }

  // --- Pedidos / Ventas stats ---
  // Ventas de hoy
  const { data: pedidosHoy } = await supabase
    .from("pedidos")
    .select("total")
    .gte("created_at", todayStart)
    .in("pago_estado", ["pagado", "pendiente"]);

  const ventas_hoy = (pedidosHoy || []).reduce((sum, p) => sum + (p.total || 0), 0);

  // Pedidos pendientes (pendiente + confirmado)
  const { count: pedidos_pendientes } = await supabase
    .from("pedidos")
    .select("*", { count: "exact", head: true })
    .in("estado", ["pendiente", "confirmado"]);

  // Ingresos del mes
  const { data: pedidosMes } = await supabase
    .from("pedidos")
    .select("total")
    .gte("created_at", monthStart)
    .in("pago_estado", ["pagado", "pendiente"]);

  const ingresos_mes = (pedidosMes || []).reduce((sum, p) => sum + (p.total || 0), 0);

  // Ventas ultimos 7 dias
  const ventas_diarias: { fecha: string; total: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

    const { data: dayPedidos } = await supabase
      .from("pedidos")
      .select("total")
      .gte("created_at", dayStart.toISOString())
      .lt("created_at", dayEnd.toISOString());

    ventas_diarias.push({
      fecha: dayStart.toISOString().split("T")[0],
      total: (dayPedidos || []).reduce((sum, p) => sum + (p.total || 0), 0),
      count: dayPedidos?.length || 0,
    });
  }

  // Pedidos recientes (ultimos 5)
  const { data: pedidos_recientes } = await supabase
    .from("pedidos")
    .select("id, numero_pedido, cliente_nombre, total, estado, pago_estado, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    // Formularios
    hoy: hoy || 0,
    mes: mes || 0,
    total: total || 0,
    emails_restantes_dia,
    emails_restantes_mes,
    tasa_exito,
    diarios,
    // Pedidos / Ventas
    ventas_hoy,
    pedidos_pendientes: pedidos_pendientes || 0,
    ingresos_mes,
    ventas_diarias,
    pedidos_recientes: pedidos_recientes || [],
  });
}
