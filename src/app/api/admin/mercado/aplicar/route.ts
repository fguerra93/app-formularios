import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { productosRepo, auditRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/**
 * Aplica la sugerencia de precio a un producto (la "planilla" de venta) y deja
 * **auditoría** del cambio (precio anterior → nuevo). El front debe enviar un
 * precio que respete el piso de margen (la sugerencia ya viene clamp-eada).
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const productoId = String(body?.producto_id || "");
  const nuevoPrecio = Math.round(Number(body?.precio) || 0);
  if (!productoId || nuevoPrecio <= 0) {
    return NextResponse.json({ error: "producto_id y precio válido requeridos" }, { status: 400 });
  }

  try {
    const actual = await productosRepo.findById(productoId);
    const precioAnterior = actual ? Number((actual as { precio?: number }).precio) || 0 : 0;

    const updated = await productosRepo.update(productoId, { precio: nuevoPrecio });

    await auditRepo.log({
      usuario: session.sub,
      accion: "mercado.aplicar_precio",
      entidad: "producto",
      entidad_id: productoId,
      datos: { precio_anterior: precioAnterior, precio_nuevo: nuevoPrecio },
    });

    return NextResponse.json({ ok: true, producto: updated });
  } catch (e) {
    console.error("Error aplicar precio:", e);
    return NextResponse.json({ error: "Error al aplicar el precio" }, { status: 500 });
  }
}
