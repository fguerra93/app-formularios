/**
 * Cálculo de costos y márgenes (Fase F4). Funciones PURAS (sin DB) para poder
 * testearlas y reusarlas: la ruta hace el fetch por repos y pasa los arrays.
 *
 *   costo real de un producto = Σ(BOM.cantidad × insumo.costo_actual)
 *   margen = precio de venta − costo real
 */
export interface ProductoMin {
  id: string;
  nombre: string;
  precio: number;
  precio_oferta: number | null;
}
export interface BomRow {
  producto_id: string;
  insumo_id: string;
  cantidad: number;
}
export interface InsumoMin {
  id: string;
  nombre: string;
  costo_actual: number;
}

export interface RentabilidadRow {
  producto_id: string;
  nombre: string;
  precio_venta: number;
  costo: number;
  margen: number;
  margen_pct: number;
  insumos: number;
  sin_bom: boolean;
}

export function calcularRentabilidad(
  productos: ProductoMin[],
  bom: BomRow[],
  insumos: InsumoMin[]
): RentabilidadRow[] {
  const insumoById = new Map(insumos.map((i) => [i.id, i]));
  const bomByProducto = new Map<string, BomRow[]>();
  for (const b of bom) {
    const arr = bomByProducto.get(b.producto_id) ?? [];
    arr.push(b);
    bomByProducto.set(b.producto_id, arr);
  }

  return productos.map((p) => {
    const rows = bomByProducto.get(p.id) ?? [];
    const costo = rows.reduce(
      (s, b) => s + b.cantidad * (insumoById.get(b.insumo_id)?.costo_actual ?? 0),
      0
    );
    const precio = p.precio_oferta && p.precio_oferta > 0 ? p.precio_oferta : p.precio;
    const margen = precio - costo;
    const margenPct = precio > 0 ? Math.round((margen / precio) * 1000) / 10 : 0;
    return {
      producto_id: p.id,
      nombre: p.nombre,
      precio_venta: precio,
      costo: Math.round(costo),
      margen: Math.round(margen),
      margen_pct: margenPct,
      insumos: rows.length,
      sin_bom: rows.length === 0,
    };
  });
}

export interface PrecioHist {
  insumo_id: string;
  precio: number;
}

export interface AlertaInsumo {
  insumo_id: string;
  nombre: string;
  costo_actual: number;
  promedio_historico: number;
  variacion_pct: number;
}

/**
 * Alerta cuando el costo actual de un insumo supera su promedio histórico en
 * al menos `umbralPct` % ("estás pagando más caro que antes").
 */
export function detectarAlertasInsumos(
  insumos: InsumoMin[],
  precios: PrecioHist[],
  umbralPct = 15
): AlertaInsumo[] {
  const byInsumo = new Map<string, number[]>();
  for (const pr of precios) {
    const arr = byInsumo.get(pr.insumo_id) ?? [];
    arr.push(pr.precio);
    byInsumo.set(pr.insumo_id, arr);
  }

  const out: AlertaInsumo[] = [];
  for (const i of insumos) {
    const hist = byInsumo.get(i.id) ?? [];
    if (hist.length === 0) continue;
    const prom = hist.reduce((s, x) => s + x, 0) / hist.length;
    if (prom <= 0) continue;
    const variacion = ((i.costo_actual - prom) / prom) * 100;
    if (variacion >= umbralPct) {
      out.push({
        insumo_id: i.id,
        nombre: i.nombre,
        costo_actual: i.costo_actual,
        promedio_historico: Math.round(prom),
        variacion_pct: Math.round(variacion * 10) / 10,
      });
    }
  }
  return out;
}
