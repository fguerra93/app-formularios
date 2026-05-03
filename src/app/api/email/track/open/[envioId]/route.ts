import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 1x1 transparent GIF as a Buffer
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ envioId: string }> }
) {
  const { envioId } = await params;

  // Update tracking in the background - don't block the response
  try {
    const supabase = getSupabaseAdmin();

    // Only update if not already tracked as opened
    const { data: envio } = await supabase
      .from("campana_envios")
      .select("id, campana_id, estado")
      .eq("id", envioId)
      .single();

    if (envio && envio.estado !== "abierto" && envio.estado !== "click") {
      await supabase
        .from("campana_envios")
        .update({
          estado: "abierto",
          abierto_at: new Date().toISOString(),
        })
        .eq("id", envioId);

      // Increment the campaign's total_abiertos counter
      const { data: campana } = await supabase
        .from("campanas")
        .select("total_abiertos")
        .eq("id", envio.campana_id)
        .single();

      if (campana) {
        await supabase
          .from("campanas")
          .update({
            total_abiertos: (campana.total_abiertos || 0) + 1,
          })
          .eq("id", envio.campana_id);
      }
    }
  } catch (e) {
    console.error("Error tracking open:", e);
  }

  // Always return the tracking pixel
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
