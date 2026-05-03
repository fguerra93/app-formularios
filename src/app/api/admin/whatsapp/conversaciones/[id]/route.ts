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

  // Get conversation
  const { data: conversacion, error: convError } = await supabase
    .from("conversaciones_whatsapp")
    .select("*")
    .eq("id", id)
    .single();

  if (convError || !conversacion) {
    return NextResponse.json(
      { error: "Conversacion no encontrada" },
      { status: 404 }
    );
  }

  // Get all messages ordered chronologically
  const { data: mensajes, error: msgError } = await supabase
    .from("mensajes_whatsapp")
    .select("*")
    .eq("conversacion_id", id)
    .order("created_at", { ascending: true });

  if (msgError) {
    console.error("Error fetching mensajes:", msgError);
    return NextResponse.json(
      { error: "Error al obtener mensajes" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    conversacion,
    mensajes: mensajes || [],
  });
}
