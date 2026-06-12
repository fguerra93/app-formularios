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
    const pedidos_mes = (pedidosMes || []).length;
    const ticket_promedio = pedidos_mes > 0 ? Math.round(ingresos_mes / pedidos_mes) : 0;

    // Top productos del mes (agregado en memoria desde items JSONB)
    const { data: itemsMes } = await db
      .from("pedidos")
      .select("items")
      .gte("created_at", monthStart);
    const topMap = new Map<string, { nombre: string; unidades: number; ingresos: number }>();
    for (const row of (itemsMes || []) as { items: unknown }[]) {
      const items = Array.isArray(row.items)
        ? (row.items as { nombre?: string; cantidad?: number; precio_unitario?: number }[])
        : [];
      for (const it of items) {
        const nombre = it.nombre || "(sin nombre)";
        const prev = topMap.get(nombre) || { nombre, unidades: 0, ingresos: 0 };
        const cant = Number(it.cantidad) || 0;
        prev.unidades += cant;
        prev.ingresos += cant * (Number(it.precio_unitario) || 0);
        topMap.set(nombre, prev);
      }
    }
    const top_productos = [...topMap.values()]
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);

    // Pedidos por estado (operación: qué hay en cada etapa)
    const { data: estadosRows } = await db.from("pedidos").select("estado");
    const pedidos_por_estado: Record<string, number> = {};
    for (const r of (estadosRows || []) as { estado: string | null }[]) {
      const e = r.estado || "pendiente";
      pedidos_por_estado[e] = (pedidos_por_estado[e] || 0) + 1;
    }

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
      pedidos_mes,
      ticket_promedio,
      top_productos,
      pedidos_por_estado,
      ventas_diarias,
      pedidos_recientes: pedidos_recientes || [],
    };
  },
};
