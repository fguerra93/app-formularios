import { NextRequest, NextResponse } from "next/server";
import { gruposRepo, productosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/** Datos públicos del grupo: producto, progreso y participantes (sin datos sensibles). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;

  let grupo = null;
  try {
    grupo = await gruposRepo.findByCodigo(codigo);
  } catch (e) {
    console.error("grupo no disponible:", e);
  }
  if (!grupo) {
    return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
  }

  const [producto, progreso] = await Promise.all([
    productosRepo.findById(grupo.producto_id),
    gruposRepo.progreso(grupo.id).catch(() => ({ pagados: 0, unidades: 0, recaudado: 0, participantes: [] })),
  ]);

  const vencido = grupo.fecha_limite ? new Date(grupo.fecha_limite + "T23:59:59") < new Date() : false;
  const completado = progreso.unidades >= grupo.meta_unidades;
  const abierto = grupo.estado === "abierto" && !vencido;

  return NextResponse.json({
    codigo: grupo.codigo,
    nombre: grupo.nombre,
    organizador: grupo.organizador_nombre,
    meta_unidades: grupo.meta_unidades,
    fecha_limite: grupo.fecha_limite,
    estado: completado ? "completado" : vencido ? "vencido" : grupo.estado,
    abierto: abierto || completado, // completado sigue aceptando rezagados hasta que el taller cierre
    notas: grupo.notas,
    progreso,
    producto: producto
      ? {
          nombre: producto.nombre,
          slug: producto.slug,
          imagen: producto.imagenes?.[0]?.url || null,
          precio: grupo.precio_referencia,
          variantes: producto.variantes || [],
        }
      : null,
  });
}
