import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("categorias")
    .select("*, productos(count)")
    .eq("activa", true)
    .order("orden", { ascending: true });

  if (error) {
    // Fallback without count if the join fails
    const { data: fallback, error: err2 } = await supabase
      .from("categorias")
      .select("*")
      .eq("activa", true)
      .order("orden", { ascending: true });

    if (err2) {
      return NextResponse.json({ error: err2.message }, { status: 500 });
    }
    return NextResponse.json(fallback || []);
  }

  // Transform the count from nested object
  const categorias = (data || []).map((cat) => {
    const countData = cat.productos as unknown as { count: number }[] | undefined;
    const productCount = countData?.[0]?.count ?? 0;
    const { productos: _, ...rest } = cat;
    return { ...rest, product_count: productCount };
  });

  return NextResponse.json(categorias);
}
