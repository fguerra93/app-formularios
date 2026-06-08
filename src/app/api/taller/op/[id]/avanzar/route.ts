import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ordenesProduccionRepo, auditRepo } from "@/server/repositories";
import { ESTADOS_OP, puedeTransicionarOP } from "@/server/services/op-fsm";
import { emitirEfectosCambioEstadoOP } from "@/server/services/op-eventos";

export const dynamic = "force-dynamic";

const ROLES_TALLER = ["admin", "bodega"];

/**
 * "Bump" de la comanda: avanza (dir=1, por defecto) o retrocede (dir=-1) la OP
 * a la etapa contigua. Reusa la FSM del taller y dispara los mismos avisos al
 * cliente que el admin (servicio op-eventos). Auth: rol bodega/taller o admin.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!ROLES_TALLER.includes(session.rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const dir = body?.dir === -1 ? -1 : 1;

  const actual = await ordenesProduccionRepo.findById(id);
  if (!actual) {
    return NextResponse.json({ error: "OP no encontrada" }, { status: 404 });
  }

  const estadoActual = String(actual.estado);
  const i = ESTADOS_OP.indexOf(estadoActual as (typeof ESTADOS_OP)[number]);
  const nuevo = ESTADOS_OP[i + dir];
  if (!nuevo) {
    return NextResponse.json(
      { error: dir === 1 ? "La OP ya está en la última etapa" : "La OP está en la primera etapa" },
      { status: 400 }
    );
  }
  if (!puedeTransicionarOP(estadoActual, nuevo)) {
    return NextResponse.json(
      { error: `Transición no permitida: ${estadoActual} → ${nuevo}` },
      { status: 400 }
    );
  }

  let op;
  try {
    op = await ordenesProduccionRepo.update(id, { estado: nuevo });
  } catch (e) {
    console.error("Error avanzando OP:", e);
    return NextResponse.json({ error: "Error al actualizar la OP" }, { status: 500 });
  }

  await emitirEfectosCambioEstadoOP({
    opId: id,
    numeroOp: op.numero_op,
    pedidoId: (actual.pedido_id as string | null) ?? null,
    estado: nuevo,
  });

  await auditRepo.log({
    usuario: session.sub,
    accion: "op.estado.taller",
    entidad: "op",
    entidad_id: id,
    datos: { estado: nuevo, dir },
  });

  return NextResponse.json(op);
}
