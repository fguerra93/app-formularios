import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("fuentes_diseno")
    .select("*")
    .order("popular", { ascending: false })
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching fuentes:", error);
    return NextResponse.json(
      { error: "Error al obtener fuentes" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  if (!body.nombre || !body.familia) {
    return NextResponse.json(
      { error: "nombre y familia son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("fuentes_diseno")
    .insert({
      nombre: body.nombre,
      familia: body.familia,
      url: body.url || null,
      categoria: body.categoria || null,
      popular: body.popular || false,
      activo: body.activo !== undefined ? body.activo : true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating fuente:", error);
    return NextResponse.json(
      { error: "Error al crear fuente" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
