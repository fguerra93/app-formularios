import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { searchParams } = request.nextUrl;
  const estado = searchParams.get("estado");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("conversaciones_whatsapp")
    .select("*", { count: "exact" })
    .order("ultimo_mensaje_at", { ascending: false });

  if (estado) {
    query = query.eq("estado", estado);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: conversaciones, count, error } = await query;

  if (error) {
    console.error("Error fetching conversaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener conversaciones" },
      { status: 500 }
    );
  }

  // Get message counts for each conversation
  const conversacionesConConteo = await Promise.all(
    (conversaciones || []).map(async (conv) => {
      const { count: mensajesCount } = await supabase
        .from("mensajes_whatsapp")
        .select("*", { count: "exact", head: true })
        .eq("conversacion_id", conv.id);

      // Get the latest message preview
      const { data: ultimoMensaje } = await supabase
        .from("mensajes_whatsapp")
        .select("contenido, direccion, created_at")
        .eq("conversacion_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        ...conv,
        mensajes_count: mensajesCount || 0,
        ultimo_mensaje: ultimoMensaje || null,
      };
    })
  );

  return NextResponse.json({
    data: conversacionesConConteo,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
