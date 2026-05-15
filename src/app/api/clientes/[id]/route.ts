import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/clientes/[id]
 *
 * Returns basic client info for form prefilling.
 * Only exposes non-sensitive fields (name, email, phone).
 * Used when the bot sends a link like /contacto?ref=clienteId
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 10) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("clientes")
    .select("nombre, email, telefono")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
