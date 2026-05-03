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
  const tipo = searchParams.get("tipo") || "todos";

  let total = 0;
  let preview: { email: string; nombre: string }[] = [];

  if (tipo === "todos") {
    // Count all active newsletter subscribers
    const { count } = await supabase
      .from("suscriptores")
      .select("*", { count: "exact", head: true })
      .eq("activo", true);

    total = count || 0;

    // Get first 5 for preview
    const { data } = await supabase
      .from("suscriptores")
      .select("email, nombre")
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(5);

    preview = (data || []).map((s: { email: string; nombre?: string }) => ({
      email: s.email,
      nombre: s.nombre || "",
    }));
  } else if (tipo === "clientes") {
    // Count all clientes with email
    const { count } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .not("email", "is", null);

    total = count || 0;

    // Get first 5 for preview
    const { data } = await supabase
      .from("clientes")
      .select("email, nombre")
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);

    preview = (data || [])
      .filter((c: { email?: string }) => c.email)
      .map((c: { email: string; nombre?: string }) => ({
        email: c.email,
        nombre: c.nombre || "",
      }));
  } else if (tipo === "custom") {
    // For custom, just return 0 - the frontend will have the emails list
    total = 0;
    preview = [];
  }

  return NextResponse.json({ total, preview });
}
