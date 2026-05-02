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
    .from("zonas_envio")
    .select("*")
    .order("precio", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Error al obtener zonas" }, { status: 500 });
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

  const { data, error } = await supabase
    .from("zonas_envio")
    .insert({
      nombre: body.nombre,
      comunas: body.comunas || [],
      precio: body.precio,
      envio_gratis_desde: body.envio_gratis_desde || null,
      activa: body.activa !== undefined ? body.activa : true,
      dias_despacho: body.dias_despacho || [],
      horario: body.horario || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating zona:", error);
    return NextResponse.json({ error: "Error al crear zona" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
