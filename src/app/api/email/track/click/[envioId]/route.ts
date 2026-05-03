import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ envioId: string }> }
) {
  const { envioId } = await params;
  const { searchParams } = request.nextUrl;
  const redirectUrl = searchParams.get("url");

  // Update tracking
  try {
    const supabase = getSupabaseAdmin();

    const { data: envio } = await supabase
      .from("campana_envios")
      .select("id, campana_id, estado")
      .eq("id", envioId)
      .single();

    if (envio && envio.estado !== "click") {
      const updateData: Record<string, unknown> = {
        estado: "click",
        click_at: new Date().toISOString(),
      };

      // Also set abierto_at if not already set
      if (envio.estado !== "abierto") {
        updateData.abierto_at = new Date().toISOString();
      }

      await supabase
        .from("campana_envios")
        .update(updateData)
        .eq("id", envioId);

      // Increment the campaign's click counter
      const { data: campana } = await supabase
        .from("campanas")
        .select("total_clicks, total_abiertos")
        .eq("id", envio.campana_id)
        .single();

      if (campana) {
        const updates: Record<string, number> = {
          total_clicks: (campana.total_clicks || 0) + 1,
        };

        // If the email wasn't tracked as opened yet, also count the open
        if (envio.estado !== "abierto") {
          updates.total_abiertos = (campana.total_abiertos || 0) + 1;
        }

        await supabase
          .from("campanas")
          .update(updates)
          .eq("id", envio.campana_id);
      }
    }
  } catch (e) {
    console.error("Error tracking click:", e);
  }

  // Redirect to the target URL
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl, 302);
  }

  // Fallback: redirect to homepage
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printup.cl";
  return NextResponse.redirect(baseUrl, 302);
}
