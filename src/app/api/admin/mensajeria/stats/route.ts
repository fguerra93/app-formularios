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

  // Conversations by canal
  const { data: conversacionesPorCanal } = await supabase
    .from("conversaciones")
    .select("canal");

  const porCanal: Record<string, number> = {
    whatsapp: 0,
    instagram: 0,
    facebook: 0,
  };
  (conversacionesPorCanal || []).forEach((conv) => {
    const c = conv.canal || "otro";
    porCanal[c] = (porCanal[c] || 0) + 1;
  });

  // Messages today
  const { count: mensajesHoy } = await supabase
    .from("mensajes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);

  // Conversations without response
  // These are conversations that have at least one incoming message
  // but no outgoing message after the last incoming message
  const { data: conversacionesAbiertas } = await supabase
    .from("conversaciones")
    .select("id")
    .eq("estado", "abierta");

  let sinRespuesta = 0;

  if (conversacionesAbiertas && conversacionesAbiertas.length > 0) {
    for (const conv of conversacionesAbiertas) {
      // Get the last message for this conversation
      const { data: ultimoMensaje } = await supabase
        .from("mensajes")
        .select("direccion")
        .eq("conversacion_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (ultimoMensaje && ultimoMensaje.direccion === "entrante") {
        sinRespuesta++;
      }
    }
  }

  // Average response time
  // Get pairs of incoming messages followed by outgoing messages
  const { data: mensajesParaTiempo } = await supabase
    .from("mensajes")
    .select("conversacion_id, direccion, created_at")
    .in("direccion", ["entrante", "saliente"])
    .order("created_at", { ascending: true })
    .limit(1000);

  let totalResponseTime = 0;
  let responseCount = 0;

  if (mensajesParaTiempo && mensajesParaTiempo.length > 0) {
    // Group by conversacion_id
    const porConversacion: Record<
      string,
      Array<{ direccion: string; created_at: string }>
    > = {};
    for (const msg of mensajesParaTiempo) {
      if (!porConversacion[msg.conversacion_id]) {
        porConversacion[msg.conversacion_id] = [];
      }
      porConversacion[msg.conversacion_id].push(msg);
    }

    // Calculate response times
    for (const mensajes of Object.values(porConversacion)) {
      for (let i = 0; i < mensajes.length - 1; i++) {
        if (
          mensajes[i].direccion === "entrante" &&
          mensajes[i + 1].direccion === "saliente"
        ) {
          const entrante = new Date(mensajes[i].created_at).getTime();
          const saliente = new Date(mensajes[i + 1].created_at).getTime();
          const diff = saliente - entrante;
          if (diff > 0) {
            totalResponseTime += diff;
            responseCount++;
          }
        }
      }
    }
  }

  // Average in minutes
  const tiempoPromedioRespuesta =
    responseCount > 0
      ? Math.round(totalResponseTime / responseCount / 1000 / 60)
      : 0;

  return NextResponse.json({
    por_canal: porCanal,
    mensajes_hoy: mensajesHoy || 0,
    sin_respuesta: sinRespuesta,
    tiempo_promedio_respuesta: tiempoPromedioRespuesta,
  });
}
