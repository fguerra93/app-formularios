/**
 * Cerebro de precios del Gang Sheet (Fase F1).
 *
 * Único punto de cálculo compartido por la WEB (constructor self-service) y el
 * BOT (cotización por medidas). Dado un set de artes con medidas reales en cm,
 * los AUTO-ACOMODA en el pliego (bin-packing heurístico tipo "shelf" / NFDH),
 * calcula el área cobrada (incluida la merma) y aplica la tarifa por cm² con
 * tramos de descuento. NUNCA confirma nada: el precio va al carrito/cotización
 * y, si se aprueba, nace la OP (Pilar D).
 *
 * El nesting es HEURÍSTICO (shelf next-fit decreasing height). Sirve para
 * cotizar y previsualizar; el acomodo óptimo (MaxRects/guillotina) y la
 * rasterización del archivo final quedan como punto de extensión.
 */
import { tarifasGangSheetRepo, type TarifaGangSheet } from "@/server/repositories/gang-sheets";

export interface GangSheetItemInput {
  arte_url?: string;
  w_cm: number;
  h_cm: number;
  rot?: number; // 0 | 90 (orientación inicial; el nesting puede rotar)
  cantidad?: number; // repeticiones del mismo arte
}

export interface PlacedItem {
  arte_url?: string;
  x: number; // cm desde la izquierda del pliego
  y: number; // cm desde arriba del pliego
  w_cm: number; // ancho efectivo (ya rotado)
  h_cm: number; // alto efectivo (ya rotado)
  rot: number; // 0 | 90
}

export interface GangSheetDesglose {
  material: string;
  ancho_pliego_cm: number;
  alto_pliego_cm: number;
  area_usada_cm2: number;
  area_pliego_cm2: number;
  merma_pct: number;
  merma_cm2: number;
  area_cobrada_cm2: number;
  tarifa_por_cm2: number;
  subtotal: number;
  tramo_descuento_pct: number;
  descuento: number;
  precio_minimo: number;
  total: number;
  dias_produccion: number;
  eficiencia_pct: number;
  unidades: number;
  tarifa_por_defecto: boolean;
}

export interface GangSheetResult {
  material: string;
  ancho_pliego_cm: number;
  alto_pliego_cm: number;
  items: PlacedItem[];
  area_usada_cm2: number;
  area_pliego_cm2: number;
  merma_cm2: number;
  precio: number;
  desglose: GangSheetDesglose;
}

const GAP_CM = 0.3; // separación de seguridad entre artes
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Tarifa de respaldo si el material no está en BD (degradación elegante). */
function tarifaPorDefecto(material: string): TarifaGangSheet {
  return {
    id: "default",
    material: material || "DTF Textil",
    ancho_pliego_cm: 58,
    tarifa_por_cm2: 6,
    merma_pct: 8,
    precio_minimo: 3000,
    tramos: [
      { min_cm2: 0, max_cm2: 2000, descuento_pct: 0 },
      { min_cm2: 2000, max_cm2: 6000, descuento_pct: 10 },
      { min_cm2: 6000, max_cm2: 999999999, descuento_pct: 20 },
    ],
    dias_produccion: 3,
  };
}

/**
 * Auto-acomodo heurístico (shelf NFDH): ordena por alto descendente y coloca
 * de izquierda a derecha; al no caber a lo ancho, abre una nueva "repisa".
 * Rota 90° un arte si así cabe en el ancho del pliego; si aún excede, lo
 * escala manteniendo proporción (caso borde). Devuelve las posiciones y el
 * alto total resultante del pliego.
 */
export function autoNest(
  items: GangSheetItemInput[],
  anchoCm: number,
  gap = GAP_CM
): { placed: PlacedItem[]; altoTotal: number } {
  const ancho = Math.max(1, anchoCm);

  // 1. Expandir por cantidad y normalizar orientación/dimensiones efectivas.
  const norm: PlacedItem[] = [];
  for (const it of items) {
    const w0 = Number(it.w_cm) || 0;
    const h0 = Number(it.h_cm) || 0;
    if (w0 <= 0 || h0 <= 0) continue;
    const n = Math.max(1, Math.floor(Number(it.cantidad) || 1));
    for (let i = 0; i < n; i++) {
      let w = w0;
      let h = h0;
      let rot = it.rot === 90 ? 90 : 0;
      if (rot === 90) [w, h] = [h, w];
      // Si no cabe a lo ancho pero rotado sí, rota.
      if (w > ancho && h <= ancho) {
        [w, h] = [h, w];
        rot = rot === 90 ? 0 : 90;
      }
      norm.push({ arte_url: it.arte_url, x: 0, y: 0, w_cm: w, h_cm: h, rot });
    }
  }

  // 2. Ordenar por alto descendente (NFDH).
  norm.sort((a, b) => b.h_cm - a.h_cm);

  // 3. Colocar en repisas.
  const placed: PlacedItem[] = [];
  let shelfY = 0;
  let shelfX = 0;
  let shelfH = 0;
  for (const it of norm) {
    let w = it.w_cm;
    let h = it.h_cm;
    // Caso borde: un arte más ancho que el pliego incluso rotado -> escalar.
    if (w > ancho) {
      const s = ancho / w;
      w = ancho;
      h = h * s;
    }
    if (shelfX > 0 && shelfX + w > ancho + 1e-6) {
      shelfY += shelfH + gap;
      shelfX = 0;
      shelfH = 0;
    }
    placed.push({
      arte_url: it.arte_url,
      x: round2(shelfX),
      y: round2(shelfY),
      w_cm: round2(w),
      h_cm: round2(h),
      rot: it.rot,
    });
    shelfX += w + gap;
    shelfH = Math.max(shelfH, h);
  }

  const altoTotal = round2(placed.length ? shelfY + shelfH : 0);
  return { placed, altoTotal };
}

function descuentoTramo(tramos: TarifaGangSheet["tramos"], areaCm2: number): number {
  for (const t of tramos || []) {
    const min = Number(t.min_cm2) || 0;
    const max = Number(t.max_cm2) || Infinity;
    if (areaCm2 >= min && areaCm2 < max) return Number(t.descuento_pct) || 0;
  }
  return 0;
}

export interface CalcularGangSheetInput {
  items: GangSheetItemInput[];
  material: string;
  ancho_pliego_cm?: number;
}

/**
 * Cálculo completo del pliego: nesting + área + tarifa + tramo + mínimo.
 * Compartido por la web y el bot (mismo input → mismo precio).
 */
export async function calcularGangSheet(
  input: CalcularGangSheetInput
): Promise<GangSheetResult> {
  let tarifa: TarifaGangSheet | null = null;
  try {
    tarifa = await tarifasGangSheetRepo.findByMaterial(input.material);
  } catch {
    tarifa = null;
  }
  const porDefecto = !tarifa;
  const t = tarifa ?? tarifaPorDefecto(input.material);

  const ancho = Number(input.ancho_pliego_cm) || t.ancho_pliego_cm;
  const { placed, altoTotal } = autoNest(input.items || [], ancho);

  const areaUsada = round2(placed.reduce((s, p) => s + p.w_cm * p.h_cm, 0));
  const areaPliego = round2(ancho * altoTotal);
  const mermaCm2 = round2(areaPliego * (Number(t.merma_pct) / 100));
  const areaCobrada = round2(areaPliego + mermaCm2);

  const tarifaCm2 = Number(t.tarifa_por_cm2);
  const subtotal = Math.round(areaCobrada * tarifaCm2);
  const tramoPct = descuentoTramo(t.tramos, areaCobrada);
  const descuento = Math.round(subtotal * (tramoPct / 100));

  let total = subtotal - descuento;
  if (placed.length === 0) total = 0;
  else total = Math.max(total, Number(t.precio_minimo) || 0);

  const eficiencia = areaPliego > 0 ? round2((areaUsada / areaPliego) * 100) : 0;

  const desglose: GangSheetDesglose = {
    material: t.material,
    ancho_pliego_cm: ancho,
    alto_pliego_cm: altoTotal,
    area_usada_cm2: areaUsada,
    area_pliego_cm2: areaPliego,
    merma_pct: Number(t.merma_pct),
    merma_cm2: mermaCm2,
    area_cobrada_cm2: areaCobrada,
    tarifa_por_cm2: tarifaCm2,
    subtotal,
    tramo_descuento_pct: tramoPct,
    descuento,
    precio_minimo: Number(t.precio_minimo) || 0,
    total,
    dias_produccion: Number(t.dias_produccion) || 3,
    eficiencia_pct: eficiencia,
    unidades: placed.length,
    tarifa_por_defecto: porDefecto,
  };

  return {
    material: t.material,
    ancho_pliego_cm: ancho,
    alto_pliego_cm: altoTotal,
    items: placed,
    area_usada_cm2: areaUsada,
    area_pliego_cm2: areaPliego,
    merma_cm2: mermaCm2,
    precio: total,
    desglose,
  };
}

/**
 * Genera el archivo del pliego como SVG (vector, sin dependencias). Es el
 * "archivo listo" que ve el taller: pliego a escala, artes ubicados con sus
 * medidas. La rasterización a PDF/PNG a 300dpi es un punto de extensión.
 */
export function generarPliegoSvg(r: {
  ancho_pliego_cm: number;
  alto_pliego_cm: number;
  items: PlacedItem[];
  material?: string;
}): string {
  const PX = 10; // 1cm = 10px
  const padding = 24;
  const w = Math.max(1, r.ancho_pliego_cm) * PX;
  const h = Math.max(1, r.alto_pliego_cm) * PX;
  const svgW = w + padding * 2;
  const svgH = h + padding * 2 + 28;

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const rects = r.items
    .map((it, i) => {
      const x = padding + it.x * PX;
      const y = padding + it.y * PX;
      const iw = it.w_cm * PX;
      const ih = it.h_cm * PX;
      const img = it.arte_url
        ? `<image href="${esc(it.arte_url)}" x="${x}" y="${y}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet"/>`
        : "";
      const label = `${it.w_cm}×${it.h_cm}cm${it.rot ? " ↻" : ""}`;
      return (
        `<g>` +
        `<rect x="${x}" y="${y}" width="${iw}" height="${ih}" fill="#f5fbfd" stroke="#00b4d8" stroke-width="1" stroke-dasharray="4 3"/>` +
        img +
        `<text x="${x + 3}" y="${y + 12}" font-family="monospace" font-size="9" fill="#0e7490">${i + 1}. ${esc(label)}</text>` +
        `</g>`
      );
    })
    .join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">` +
    `<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#ffffff"/>` +
    `<rect x="${padding}" y="${padding}" width="${w}" height="${h}" fill="#ffffff" stroke="#0f1115" stroke-width="1.5"/>` +
    rects +
    `<text x="${padding}" y="${svgH - 10}" font-family="monospace" font-size="11" fill="#0f1115">` +
    `PrintUp — Pliego ${esc(r.material || "")} ${r.ancho_pliego_cm}×${r.alto_pliego_cm} cm · ${r.items.length} arte(s)` +
    `</text>` +
    `</svg>`
  );
}
