import { getDb } from "@/server/db";

/** Métricas del dashboard del admin (formularios, emails, ventas). */
export const statsRepo = {
  /** Resumen liviano para la app del dueño (Fase F6): ventas/pedidos de hoy. */
  async resumenDueno(): Promise<{ ventas_hoy: number; pedidos_hoy: number }> {
    const db = getDb();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const { data } = await db
      .from("pedidos")
      .select("total")
      .gte("created_at", todayStart);
    const rows = (data || []) as { total: number | null }[];
    return {
      ventas_hoy: rows.reduce((s, p) => s + (Number(p.total) || 0), 0),
      pedidos_hoy: rows.length,
    };
  },

  async getDashboard() {
    const db = getDb();
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
    const { count: hoy } = await db
      .from("formularios")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);

    const { count: mes } = await db
      .from("formularios")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart);

    const { count: total } = await db
      .from("formularios")
      .select("*", { count: "exact", head: true });

    // Email stats
    const { count: emailsTotal } = await db
      .from("email_log")
      .select("*", { count: "exact", head: true });

    const { count: emailsExitosos } = await db
      .from("email_log")
      .select("*", { count: "exact", head: true })
      .eq("estado", "enviado");

    const tasa_exito =
      emailsTotal && emailsTotal > 0
        ? Math.round(((emailsExitosos || 0) / emailsTotal) * 100)
        : 100;

    const { count: emailsHoy } = await db
      .from("email_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);

    const { count: emailsMes } = await db
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

      const { count: dayCount } = await db
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
    const { data: pedidosHoy } = await db
      .from("pedidos")
      .select("total")
      .gte("created_at", todayStart)
      .in("pago_estado", ["pagado", "pendiente"]);

    const ventas_hoy = (pedidosHoy || []).reduce((sum, p) => sum + (p.total || 0), 0);

    const { count: pedidos_pendientes } = await db
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .in("estado", ["pendiente", "confirmado"]);

    const { data: pedidosMes } = await db
      .from("pedidos")
      .select("total")
      .gte("created_at", monthStart)
      .in("pago_estado", ["pagado", "pendiente"]);

    const ingresos_mes = (pedidosMes || []).reduce((sum, p) => sum + (p.total || 0), 0);

    const ventas_diarias: { fecha: string; total: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

      const { data: dayPedidos } = await db
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

    const { data: pedidos_recientes } = await db
      .from("pedidos")
      .select("id, numero_pedido, cliente_nombre, total, estado, pago_estado, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return {
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
    };
  },
};
