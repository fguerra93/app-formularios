import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { preciosCompetenciaRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

interface PrecioInput {
  producto_competencia_id?: string;
  precio?: number;
  fecha?: string;
}

/**
 * Registra precio(s) de competencia. Carga MANUAL o CSV: acepta un único precio
 * o un arreglo `items` (ingesta por lote). Un scraper opcional puede alimentar
 * el mismo endpoint a futuro (ver riesgo legal en §6 de la propuesta).
 */
export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  const hoy = new Date().toISOString().slice(0, 10);

  try {
    if (Array.isArray(body?.items)) {
      const rows = (body.items as PrecioInput[])
        .filter((it) => it.producto_competencia_id && it.precio != null)
        .map((it) => ({
          producto_competencia_id: it.producto_competencia_id,
          precio: Number(it.precio) || 0,
          fecha: it.fecha || hoy,
        }));
      const n = await preciosCompetenciaRepo.createMany(rows);
      return NextResponse.json({ ok: true, insertados: n }, { status: 201 });
    }

    if (!body?.producto_competencia_id || body.precio == null) {
      return NextResponse.json(
        { error: "producto_competencia_id y precio requeridos" },
        { status: 400 }
      );
    }
    const data = await preciosCompetenciaRepo.create({
      producto_competencia_id: body.producto_competencia_id,
      precio: Number(body.precio) || 0,
      fecha: body.fecha || hoy,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error precios competencia:", e);
    return NextResponse.json({ error: "Error al registrar precios" }, { status: 500 });
  }
}
