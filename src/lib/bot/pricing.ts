import { planillasRepo, type RangoPrecio } from "@/server/repositories/planillas";

export interface Cotizacion {
  tipo: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  precio_diseno: number;
  con_diseno: boolean;
  total: number;
  dias_produccion: number;
  unidad: string;
}

function precioPorCantidad(rangos: RangoPrecio[], cantidad: number): number | null {
  const r = rangos.find((x) => cantidad >= x.min && cantidad <= x.max);
  return r ? r.precio_unitario : null;
}

/**
 * Calcula una cotización a partir de la planilla del tipo de producto.
 * Devuelve null si no hay planilla o la cantidad no cae en ningún rango.
 * NUNCA confirma nada: el resultado va a la cola de aprobación del dueño.
 */
export async function calcularCotizacion(opts: {
  tipo: string;
  cantidad: number;
  conDiseno?: boolean;
}): Promise<Cotizacion | null> {
  const cantidad = Math.max(1, Math.floor(opts.cantidad));
  const planilla = await planillasRepo.findByTipo(opts.tipo);
  if (!planilla) return null;

  const precioUnitario = precioPorCantidad(planilla.rangos || [], cantidad);
  if (precioUnitario == null) return null;

  const subtotal = precioUnitario * cantidad;
  const conDiseno = !!opts.conDiseno;
  const precioDiseno = conDiseno ? planilla.precio_diseno : 0;

  return {
    tipo: planilla.tipo_producto,
    cantidad,
    precio_unitario: precioUnitario,
    subtotal,
    precio_diseno: precioDiseno,
    con_diseno: conDiseno,
    total: subtotal + precioDiseno,
    dias_produccion: planilla.dias_produccion,
    unidad: planilla.unidad,
  };
}
