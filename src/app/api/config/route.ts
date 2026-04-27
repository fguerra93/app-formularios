import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("configuracion")
    .select("*");

  if (error) {
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }

  const config: Record<string, string> = {};
  for (const row of data || []) {
    config[row.clave] = row.valor;
  }

  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // Support both formats: array [{clave, valor}] or object {clave: valor}
  let entries: [string, string][];
  if (Array.isArray(body)) {
    entries = body.map((item: { clave: string; valor: string }) => [item.clave, item.valor]);
  } else {
    entries = Object.entries(body) as [string, string][];
  }

  for (const [clave, valor] of entries) {
    const { error } = await supabase
      .from("configuracion")
      .upsert(
        { clave, valor, updated_at: new Date().toISOString() },
        { onConflict: "clave" }
      );

    if (error) {
      console.error(`Error upserting config key "${clave}":`, error);
      return NextResponse.json(
        { error: `Error al guardar configuración: ${clave}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
