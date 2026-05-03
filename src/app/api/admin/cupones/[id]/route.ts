import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const updateData: Record<string, unknown> = {};
  if (body.codigo !== undefined) updateData.codigo = body.codigo;
  if (body.tipo !== undefined) updateData.tipo = body.tipo;
  if (body.valor !== undefined) updateData.valor = body.valor;
  if (body.minimo_compra !== undefined) updateData.minimo_compra = body.minimo_compra;
  if (body.maximo_descuento !== undefined) updateData.maximo_descuento = body.maximo_descuento;
  if (body.fecha_inicio !== undefined) updateData.fecha_inicio = body.fecha_inicio;
  if (body.fecha_expiracion !== undefined) updateData.fecha_expiracion = body.fecha_expiracion;
  if (body.usos_maximos !== undefined) updateData.usos_maximos = body.usos_maximos;
  if (body.usos_actuales !== undefined) updateData.usos_actuales = body.usos_actuales;
  if (body.activo !== undefined) updateData.activo = body.activo;
  if (body.aplica_a !== undefined) updateData.aplica_a = body.aplica_a;
  if (body.aplica_ids !== undefined) updateData.aplica_ids = body.aplica_ids;

  const { data, error } = await supabase
    .from("cupones")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating cupon:", error);
    return NextResponse.json({ error: "Error al actualizar cupon" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("cupones")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting cupon:", error);
    return NextResponse.json({ error: "Error al eliminar cupon" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
