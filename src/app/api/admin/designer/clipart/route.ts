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
    .from("clipart")
    .select("*")
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching clipart:", error);
    return NextResponse.json(
      { error: "Error al obtener clipart" },
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

  if (!body.nombre || !body.url) {
    return NextResponse.json(
      { error: "nombre y url son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("clipart")
    .insert({
      nombre: body.nombre,
      categoria: body.categoria || null,
      url: body.url,
      tags: body.tags || [],
      activo: body.activo !== undefined ? body.activo : true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating clipart:", error);
    return NextResponse.json(
      { error: "Error al crear clipart" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
