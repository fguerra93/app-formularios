import { productosRepo, zonasRepo, gangSheetsRepo, clientesRepo } from "@/server/repositories";
import type { Producto, PrecioCantidad, Variante } from "./types";

// ============================================================
// Calculo de pedidos en el SERVIDOR — unica fuente de verdad.
//
// El navegador NUNCA define el precio final: solo envia que producto,
// que variante y cuantas unidades. Aqui se recalcula todo contra la BD
// para evitar manipulacion de precios y sobreventa.
//
// Tipos de precio soportados:
//  - estandar: precio_oferta ?? precio, con tramos por cantidad y extras
//    de variante. Se recalcula EXACTO e ignora el precio del cliente.
//  - dinamico (m²/calculadora): el precio depende de dimensiones que el
//    cliente eligio. Se acepta el precio del cliente solo si supera un
//    piso minimo calculado en el servidor (proteccion anti $1).
// ============================================================

export interface ItemEntrada {
  producto_id: string;
  cantidad: number;
  variante?: Record<string, string> | null;
  /** Precio enviado por el cliente; solo se usa (con piso) en productos dinamicos. */
  precio_unitario?: number;
  nombre?: string;
}

export interface ItemCalculado {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  variante: Record<string, string> | null;
  /** Slug del producto: permite enlazar la ficha desde emails (p. ej. pedir reseña). */
  slug?: string;
}

export interface Faltante {
  producto_id: string;
  nombre: string;
  disponible: number;
  solicitado: number;
}

export interface ResultadoCalculo {
  ok: boolean;
  items: ItemCalculado[];
  subtotal: number;
  costo_envio: number;
  total: number;
  errores: string[];
  faltantes: Faltante[];
}

/** Precio base efectivo de un producto para una cantidad dada (oferta + tramos). */
function precioBase(producto: Producto, cantidad: number): number {
  // Tramos por cantidad (mayorista) tienen prioridad si existen y aplican.
  const tramos: PrecioCantidad[] = Array.isArray(producto.precios_cantidad)
    ? producto.precios_cantidad
    : [];
  const tramo = tramos.find(
    (t) => cantidad >= t.cantidad_min && (t.cantidad_max == null || cantidad <= t.cantidad_max)
  );
  if (tramo) return tramo.precio;

  if (producto.precio_oferta && producto.precio_oferta > 0) return producto.precio_oferta;
  return producto.precio;
}

/** Suma los precio_extra de las opciones de variante elegidas. */
function extrasVariante(producto: Producto, variante?: Record<string, string> | null): number {
  if (!variante) return 0;
  const variantes: Variante[] = Array.isArray(producto.variantes) ? producto.variantes : [];
  let extra = 0;
  for (const [nombreVar, valorElegido] of Object.entries(variante)) {
    const def = variantes.find((v) => v.nombre === nombreVar);
    const opcion = def?.opciones.find((o) => o.valor === valorElegido);
    if (opcion?.precio_extra) extra += opcion.precio_extra;
  }
  return extra;
}

/** True si el producto usa precio dinamico (calculadora m²). */
function esDinamico(producto: Producto): boolean {
  return producto.precio_m2 != null && producto.precio_m2 > 0;
}

/** Piso minimo aceptable para un producto dinamico (anti manipulacion a la baja). */
function pisoDinamico(producto: Producto): number {
  const areaMinCm2 = producto.area_min_cm2 ?? 100; // 0.01 m² por defecto
  const m2 = areaMinCm2 / 10_000;
  return Math.round((producto.precio_m2 ?? 0) * m2);
}

export async function calcularPedido(opts: {
  items: ItemEntrada[];
  tipo_entrega: "retiro_tienda" | "despacho";
  comuna?: string | null;
  /** Cliente logueado: si tiene descuento B2B se aplica en el servidor. */
  cliente_id?: string | null;
}): Promise<ResultadoCalculo> {
  const errores: string[] = [];
  const faltantes: Faltante[] = [];
  const itemsCalc: ItemCalculado[] = [];

  // Descuento B2B del cliente (precios especiales), validado contra la BD.
  let descuentoPct = 0;
  if (opts.cliente_id) {
    try {
      const cliente = await clientesRepo.findByIdFull(opts.cliente_id);
      const pct = Number((cliente as { descuento_pct?: number } | null)?.descuento_pct) || 0;
      if (pct > 0 && pct <= 50) descuentoPct = pct;
    } catch {
      /* sin migración o sin cliente: sin descuento */
    }
  }

  const ids = [...new Set(opts.items.map((i) => i.producto_id))];
  const productos = await productosRepo.findByIds(ids);

  const porId = new Map<string, Producto>(
    productos.map((p) => [p.id, p])
  );

  for (const item of opts.items) {
    // ── Gang sheet (Fase F1) ───────────────────────────────
    // El pliego trae su precio YA calculado en el servidor al guardarse
    // (`gang_sheets.precio`). Es la fuente de verdad: no se confía en el
    // navegador ni se requiere una fila en `productos`.
    const gangSheetId = item.variante?.gang_sheet_id;
    if (gangSheetId) {
      const gs = await gangSheetsRepo.findById(gangSheetId);
      if (!gs) {
        errores.push(`Pliego no encontrado: ${item.nombre ?? gangSheetId}`);
        continue;
      }
      const cantidad = Math.max(1, Math.floor(item.cantidad));
      itemsCalc.push({
        producto_id: item.producto_id,
        nombre: String(gs.nombre || `Pliego ${gs.material}`),
        cantidad,
        precio_unitario: Number(gs.precio) || 0,
        variante: item.variante ?? null,
      });
      continue;
    }

    const producto = porId.get(item.producto_id);

    if (!producto) {
      errores.push(`Producto no encontrado: ${item.nombre ?? item.producto_id}`);
      continue;
    }
    if (!producto.activo) {
      errores.push(`Producto no disponible: ${producto.nombre}`);
      continue;
    }
    const cantidad = Math.max(1, Math.floor(item.cantidad));

    // ── Precio ──────────────────────────────────────────────
    let precioUnitario: number;
    if (esDinamico(producto)) {
      const piso = pisoDinamico(producto);
      const recibido = Math.round(item.precio_unitario ?? 0);
      if (recibido < piso) {
        errores.push(`Precio invalido para ${producto.nombre}`);
        precioUnitario = piso;
      } else {
        precioUnitario = recibido;
      }
    } else {
      precioUnitario = precioBase(producto, cantidad) + extrasVariante(producto, item.variante);
    }

    // ── Stock (solo si el producto controla stock) ──────────
    const controlaStock = (producto as Producto & { controla_stock?: boolean }).controla_stock === true;
    if (controlaStock && producto.stock < cantidad) {
      faltantes.push({
        producto_id: producto.id,
        nombre: producto.nombre,
        disponible: producto.stock,
        solicitado: cantidad,
      });
    }

    // Precio especial B2B: descuento del cliente aplicado al unitario.
    if (descuentoPct > 0) {
      precioUnitario = Math.round(precioUnitario * (1 - descuentoPct / 100));
    }

    itemsCalc.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      cantidad,
      precio_unitario: precioUnitario,
      variante: item.variante ?? null,
      slug: producto.slug,
    });
  }

  const subtotal = itemsCalc.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  // ── Costo de envio (recalculado desde zonas_envio) ────────
  let costoEnvio = 0;
  if (opts.tipo_entrega === "despacho" && opts.comuna) {
    const zonas = await zonasRepo.listActivas();
    const zona = zonas.find((z) =>
      z.comunas?.some((c) => c.toLowerCase().trim() === opts.comuna!.toLowerCase().trim())
    );
    if (zona) {
      const gratis = zona.envio_gratis_desde != null && subtotal >= zona.envio_gratis_desde;
      costoEnvio = gratis ? 0 : zona.precio;
    }
  }

  const total = subtotal + costoEnvio;

  return {
    ok: errores.length === 0 && faltantes.length === 0,
    items: itemsCalc,
    subtotal,
    costo_envio: costoEnvio,
    total,
    errores,
    faltantes,
  };
}
