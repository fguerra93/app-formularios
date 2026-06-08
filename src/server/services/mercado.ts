/**
 * Inteligencia de mercado (Fase F5). Funciones PURAS: compara mi precio con el
 * de la competencia y sugiere un precio respetando un **tope de margen mínimo**
 * (usa el costo real de F4). La sugerencia NUNCA baja del piso de margen.
 */
export interface ProductoPrecio {
  id: string;
  nombre: string;
  precio: number;
  precio_oferta: number | null;
}
export interface MapeoComp {
  id: string; // id de productos_competencia
  producto_id: string | null;
}
export interface PrecioComp {
  producto_competencia_id: string;
  precio: number;
}

export interface ComparativaRow {
  producto_id: string;
  nombre: string;
  mi_precio: number;
  costo: number;
  mercado_min: number;
  mercado_prom: number;
  competidores: number;
  posicion_pct: number; // + = estoy sobre el mercado
  piso_margen: number; // precio mínimo para respetar el margen mínimo
  precio_sugerido: number;
  margen_actual_pct: number | null;
  margen_sugerido_pct: number | null;
  bajo_margen: boolean; // no se puede igualar al mercado sin perder margen mínimo
}

const precioVenta = (p: ProductoPrecio) =>
  p.precio_oferta && p.precio_oferta > 0 ? p.precio_oferta : p.precio;

export function calcularComparativa(
  productos: ProductoPrecio[],
  costos: Record<string, number>,
  mapeos: MapeoComp[],
  precios: PrecioComp[],
  margenMinPct = 25
): ComparativaRow[] {
  // Último precio por mapeo (precios viene ordenado por fecha desc).
  const ultimoPorMapeo = new Map<string, number>();
  for (const pr of precios) {
    if (!ultimoPorMapeo.has(pr.producto_competencia_id)) {
      ultimoPorMapeo.set(pr.producto_competencia_id, pr.precio);
    }
  }

  // Precios de competencia agrupados por producto propio.
  const preciosPorProducto = new Map<string, number[]>();
  for (const m of mapeos) {
    if (!m.producto_id) continue;
    const precio = ultimoPorMapeo.get(m.id);
    if (precio == null) continue;
    const arr = preciosPorProducto.get(m.producto_id) ?? [];
    arr.push(precio);
    preciosPorProducto.set(m.producto_id, arr);
  }

  const out: ComparativaRow[] = [];
  for (const p of productos) {
    const comp = preciosPorProducto.get(p.id);
    if (!comp || comp.length === 0) continue; // solo productos con datos de mercado

    const mercadoMin = Math.min(...comp);
    const mercadoProm = comp.reduce((s, x) => s + x, 0) / comp.length;
    const mi = precioVenta(p);
    const costo = costos[p.id] ?? 0;

    const pisoMargen = costo > 0 ? Math.ceil(costo / (1 - margenMinPct / 100)) : 0;
    const sugerido = Math.max(Math.round(mercadoMin), pisoMargen);
    const bajoMargen = pisoMargen > 0 && pisoMargen > Math.round(mercadoMin);

    out.push({
      producto_id: p.id,
      nombre: p.nombre,
      mi_precio: mi,
      costo: Math.round(costo),
      mercado_min: Math.round(mercadoMin),
      mercado_prom: Math.round(mercadoProm),
      competidores: comp.length,
      posicion_pct: mercadoProm > 0 ? Math.round(((mi - mercadoProm) / mercadoProm) * 100) : 0,
      piso_margen: pisoMargen,
      precio_sugerido: sugerido,
      margen_actual_pct: mi > 0 && costo > 0 ? Math.round(((mi - costo) / mi) * 100) : null,
      margen_sugerido_pct:
        sugerido > 0 && costo > 0 ? Math.round(((sugerido - costo) / sugerido) * 100) : null,
      bajo_margen: bajoMargen,
    });
  }
  return out;
}
