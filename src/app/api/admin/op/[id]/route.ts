import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ordenesProduccionRepo,
  domainEventsRepo,
  auditRepo,
} from "@/server/repositories";
import { puedeTransicionarOP } from "@/server/services/op-fsm";

export const dynamic = "force-dynamic";

// Estado de taller -> notificación al cliente (reutiliza el worker proactivo).
const OP_A_CLIENTE: Record<string, string> = {
  imprimiendo: "preparando",
  listo: "listo",
  entregado: "entregado",
};

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
    await domainEventsRepo.emit("op.estado", {
      op_id: id,
      numero_op: op.numero_op,
      estado: body.estado,
    });
    const estadoCliente = OP_A_CLIENTE[body.estado];
    if (estadoCliente && actual.pedido_id) {
      await domainEventsRepo.emit("pedido.estado", {
        pedido_id: actual.pedido_id,
        numero_pedido: null,
        estado: estadoCliente,
      });
    }
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
