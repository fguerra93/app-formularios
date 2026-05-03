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
  const estado = searchParams.get("estado");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("cotizaciones_whatsapp")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (estado) {
    query = query.eq("estado", estado);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching cotizaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener cotizaciones" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

export async function PATCH(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, estado, notas } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el id de la cotizacion" },
        { status: 400 }
      );
    }

    if (!estado) {
      return NextResponse.json(
        { error: "Se requiere el estado" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {
      estado,
      updated_at: new Date().toISOString(),
    };

    if (notas !== undefined) {
      updateData.notas = notas;
    }

    const { data, error } = await supabase
      .from("cotizaciones_whatsapp")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating cotizacion:", error);
      return NextResponse.json(
        { error: "Error al actualizar cotizacion" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Cotizaciones PATCH error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
