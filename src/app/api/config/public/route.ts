import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Public config endpoint - only exposes safe, non-sensitive config keys.
 */
const PUBLIC_KEYS = ["ga4_measurement_id", "social_proof_activo"];

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("configuracion")
    .select("clave, valor")
    .in("clave", PUBLIC_KEYS);

  if (error) {
    console.error("Error fetching public config:", error);
    return NextResponse.json({});
  }

  const config: Record<string, string> = {};
  for (const row of data || []) {
    config[row.clave] = row.valor;
  }

  return NextResponse.json(config);
}
