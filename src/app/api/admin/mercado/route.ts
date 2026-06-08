import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import {
  productosRepo,
  bomRepo,
  insumosRepo,
  productosCompetenciaRepo,
  preciosCompetenciaRepo,
  configuracionRepo,
} from "@/server/repositories";
import { calcularRentabilidad, type BomRow, type InsumoMin } from "@/server/services/costos";
import {
  calcularComparativa,
  type MapeoComp,
  type PrecioComp,
} from "@/server/services/mercado";

export const dynamic = "force-dynamic";

/** Comparativa "mi precio vs mercado" por producto, con sugerencia. */
export async function GET() {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const [productos, bom, insumos, mapeos, precios, margenCfg] = await Promise.all([
      productosRepo.listBasico(),
      bomRepo.listAll(),
      insumosRepo.listAll(),
      productosCompetenciaRepo.listAll(),
      preciosCompetenciaRepo.listAll(),
      configuracionRepo.get("margen_minimo_pct"),
    ]);

    const insumosMin: InsumoMin[] = insumos.map((i) => ({
      id: String(i.id),
      nombre: String(i.nombre),
      costo_actual: Number(i.costo_actual) || 0,
    }));
    const bomRows: BomRow[] = bom.map((b) => ({
      producto_id: String(b.producto_id),
      insumo_id: String(b.insumo_id),
      cantidad: Number(b.cantidad) || 0,
    }));
    const rent = calcularRentabilidad(
      productos.map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, precio_oferta: p.precio_oferta })),
      bomRows,
      insumosMin
    );
    const costos: Record<string, number> = {};
    for (const r of rent) costos[r.producto_id] = r.costo;

    const margenMin = Number(margenCfg) || 25;
    const comparativa = calcularComparativa(
      productos.map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, precio_oferta: p.precio_oferta })),
      costos,
      mapeos.map((m) => ({ id: String(m.id), producto_id: m.producto_id ? String(m.producto_id) : null })) as MapeoComp[],
      precios.map((p) => ({
        producto_competencia_id: String(p.producto_competencia_id),
        precio: Number(p.precio) || 0,
      })) as PrecioComp[],
      margenMin
    );

    return NextResponse.json({ comparativa, margenMin });
  } catch (e) {
    console.error("Error mercado:", e);
    return NextResponse.json({ error: "Error al calcular comparativa" }, { status: 500 });
  }
}
