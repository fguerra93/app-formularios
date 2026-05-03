import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // Get campaign stats
  const { data: campana, error: campError } = await supabase
    .from("campanas")
    .select(
      "id, nombre, asunto, estado, total_destinatarios, total_enviados, total_abiertos, total_clicks, total_errores, enviada_at, created_at"
    )
    .eq("id", id)
    .single();

  if (campError || !campana) {
    return NextResponse.json(
      { error: "Campana no encontrada" },
      { status: 404 }
    );
  }

  // Get envios list
  const { data: envios, error: enviosError } = await supabase
    .from("campana_envios")
    .select("id, email, nombre, estado, abierto_at, click_at, error_msg, created_at")
    .eq("campana_id", id)
    .order("created_at", { ascending: false });

  if (enviosError) {
    console.error("Error fetching envios:", enviosError);
    return NextResponse.json(
      { error: "Error al obtener estadisticas" },
      { status: 500 }
    );
  }

  // Calculate rates
  const totalEnviados = campana.total_enviados || 0;
  const tasaApertura =
    totalEnviados > 0
      ? ((campana.total_abiertos || 0) / totalEnviados) * 100
      : 0;
  const tasaClick =
    totalEnviados > 0
      ? ((campana.total_clicks || 0) / totalEnviados) * 100
      : 0;
  const tasaError =
    (campana.total_destinatarios || 0) > 0
      ? ((campana.total_errores || 0) / campana.total_destinatarios) * 100
      : 0;

  return NextResponse.json({
    campana,
    stats: {
      tasa_apertura: Math.round(tasaApertura * 100) / 100,
      tasa_click: Math.round(tasaClick * 100) / 100,
      tasa_error: Math.round(tasaError * 100) / 100,
    },
    envios: envios || [],
  });
}
