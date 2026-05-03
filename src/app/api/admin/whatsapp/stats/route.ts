import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

  const weekStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7
  ).toISOString();

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Total conversations
  const { count: totalConversaciones } = await supabase
    .from("conversaciones_whatsapp")
    .select("*", { count: "exact", head: true });

  // Conversations by estado
  const { data: conversacionesPorEstado } = await supabase
    .from("conversaciones_whatsapp")
    .select("estado");

  const estadoCount: Record<string, number> = {};
  (conversacionesPorEstado || []).forEach((conv) => {
    const est = conv.estado || "sin_estado";
    estadoCount[est] = (estadoCount[est] || 0) + 1;
  });

  // Messages today
  const { count: mensajesHoy } = await supabase
    .from("mensajes_whatsapp")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);

  // Messages this week
  const { count: mensajesSemana } = await supabase
    .from("mensajes_whatsapp")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekStart);

  // Messages this month
  const { count: mensajesMes } = await supabase
    .from("mensajes_whatsapp")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart);

  // Messages by procesado_por
  const { data: mensajesPorProcesador } = await supabase
    .from("mensajes_whatsapp")
    .select("procesado_por")
    .eq("direccion", "saliente");

  const procesadorCount: Record<string, number> = {};
  let totalSalientes = 0;
  (mensajesPorProcesador || []).forEach((msg) => {
    const proc = msg.procesado_por || "desconocido";
    procesadorCount[proc] = (procesadorCount[proc] || 0) + 1;
    totalSalientes++;
  });

  const procesadorPorcentaje: Record<string, number> = {};
  if (totalSalientes > 0) {
    for (const [key, val] of Object.entries(procesadorCount)) {
      procesadorPorcentaje[key] = Math.round((val / totalSalientes) * 100);
    }
  }

  // Cotizaciones count
  const { count: totalCotizaciones } = await supabase
    .from("cotizaciones_whatsapp")
    .select("*", { count: "exact", head: true });

  // Cotizaciones by estado
  const { data: cotizacionesPorEstado } = await supabase
    .from("cotizaciones_whatsapp")
    .select("estado");

  const cotEstadoCount: Record<string, number> = {};
  (cotizacionesPorEstado || []).forEach((cot) => {
    const est = cot.estado || "sin_estado";
    cotEstadoCount[est] = (cotEstadoCount[est] || 0) + 1;
  });

  return NextResponse.json({
    conversaciones: {
      total: totalConversaciones || 0,
      por_estado: estadoCount,
    },
    mensajes: {
      hoy: mensajesHoy || 0,
      semana: mensajesSemana || 0,
      mes: mensajesMes || 0,
      por_procesador: procesadorCount,
      porcentaje_procesador: procesadorPorcentaje,
    },
    cotizaciones: {
      total: totalCotizaciones || 0,
      por_estado: cotEstadoCount,
    },
  });
}
