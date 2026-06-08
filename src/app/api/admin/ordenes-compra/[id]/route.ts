import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { ordenesCompraRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  try {
    const oc = await ordenesCompraRepo.findById(id);
    if (!oc) return NextResponse.json({ error: "OC no encontrada" }, { status: 404 });
    const items = await ordenesCompraRepo.itemsByOc(id);
    return NextResponse.json({ ...oc, items });
  } catch (e) {
    console.error("Error OC:", e);
    return NextResponse.json({ error: "Error al obtener OC" }, { status: 500 });
  }
}

/**
 * Cambia el estado de la OC (enviar/recibir/cancelar) y, al recibir, registra la
 * recepción de los ítems (cantidad_recibida = cantidad por defecto).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const accion = String(body?.accion || "");

  const oc = await ordenesCompraRepo.findById(id);
  if (!oc) return NextResponse.json({ error: "OC no encontrada" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (accion === "enviar") {
    patch.estado = "enviada";
    patch.enviada_at = new Date().toISOString();
  } else if (accion === "recibir") {
    patch.estado = "recibida";
    patch.recibida_at = new Date().toISOString();
    // Marca cada ítem como recibido (cantidad_recibida = cantidad).
    const items = await ordenesCompraRepo.itemsByOc(id);
    const recibidos = Array.isArray(body?.recibidos) ? body.recibidos : null;
    for (const it of items) {
      const rec = recibidos?.find((r: { id: string }) => r.id === it.id);
      const cantidad = rec ? Number(rec.cantidad_recibida) : Number(it.cantidad);
      await ordenesCompraRepo.updateItem(String(it.id), { cantidad_recibida: cantidad });
    }
  } else if (accion === "cancelar") {
    patch.estado = "cancelada";
  } else if (body.notas !== undefined) {
    patch.notas = body.notas;
  } else {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  try {
    const updated = await ordenesCompraRepo.update(id, patch);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Error update OC:", e);
    return NextResponse.json({ error: "Error al actualizar OC" }, { status: 500 });
  }
}
