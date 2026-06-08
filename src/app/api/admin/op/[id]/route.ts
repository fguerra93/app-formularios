import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ordenesProduccionRepo,
  auditRepo,
} from "@/server/repositories";
import { puedeTransicionarOP } from "@/server/services/op-fsm";
import { emitirEfectosCambioEstadoOP } from "@/server/services/op-eventos";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const actual = await ordenesProduccionRepo.findById(id);
  if (!actual) {
    return NextResponse.json({ error: "OP no encontrada" }, { status: 404 });
  }

  if (body.estado && !puedeTransicionarOP(String(actual.estado), body.estado)) {
    return NextResponse.json(
      { error: `Transición de taller no permitida: ${actual.estado} → ${body.estado}` },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  for (const k of ["estado", "prioridad", "operador", "fecha_compromiso", "notas", "material", "dimensiones"]) {
    if (body[k] !== undefined) updateData[k] = body[k];
  }

  let op;
  try {
    op = await ordenesProduccionRepo.update(id, updateData);
  } catch (e) {
    console.error("Error updating OP:", e);
    return NextResponse.json({ error: "Error al actualizar OP" }, { status: 500 });
  }

  // Al cambiar estado: evento + (si corresponde) aviso proactivo al cliente.
  if (body.estado) {
    await emitirEfectosCambioEstadoOP({
      opId: id,
      numeroOp: op.numero_op,
      pedidoId: (actual.pedido_id as string | null) ?? null,
      estado: body.estado,
    });
    await auditRepo.log({
      usuario: session.sub,
      accion: "op.estado",
      entidad: "op",
      entidad_id: id,
      datos: { estado: body.estado },
    });
  }

  return NextResponse.json(op);
}
