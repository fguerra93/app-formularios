/**
 * RUT chileno — validación módulo 11 y formato con puntos y guión.
 * Sirve para checkout, ficha de cliente B2B y boleta/factura (SII).
 */

/** Deja solo dígitos y K (el cuerpo + dígito verificador). */
export function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

/** Dígito verificador por módulo 11 para un cuerpo numérico. */
export function digitoVerificador(cuerpo: string): string {
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

/** True si el RUT (con o sin puntos/guión) es válido por módulo 11. */
export function validarRut(rut: string): boolean {
  const limpio = limpiarRut(rut);
  if (limpio.length < 7 || limpio.length > 9) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  // RUTs de relleno obvios (111111111, 222222222…) no pasan.
  if (/^(\d)\1+$/.test(cuerpo) && cuerpo.length > 7) return false;
  return digitoVerificador(cuerpo) === dv;
}

/** Formatea 12345678K → 12.345.678-K (devuelve lo recibido si no se puede). */
export function formatearRut(rut: string): string {
  const limpio = limpiarRut(rut);
  if (limpio.length < 2) return rut;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv}`;
}
