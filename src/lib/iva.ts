/**
 * IVA Chile (19%). En PrintUp los precios mostrados YA incluyen IVA, así que
 * el desglose es informativo: se separa el neto del IVA contenido en el total.
 */
export const TASA_IVA = 0.19;

export interface DesgloseIva {
  neto: number;
  iva: number;
  total: number;
}

/** Desglosa un total que YA incluye IVA en (neto + iva). */
export function desgloseIva(totalConIva: number): DesgloseIva {
  const neto = Math.round(totalConIva / (1 + TASA_IVA));
  const iva = totalConIva - neto;
  return { neto, iva, total: totalConIva };
}
