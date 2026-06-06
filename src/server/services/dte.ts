import { pedidosRepo } from "@/server/repositories";
import type { Pedido } from "@/server/domain";

export interface DteResultado {
  tipo: "boleta" | "factura";
  folio: string;
  url: string;
  mock: boolean;
}

/**
 * Emisión de documento tributario (Fase 6).
 *
 * En sandbox/certificación NO hay credenciales SII de producción: si
 * `DTE_ENABLED` no está activo o falta config, se emite un documento MOCK
 * (folio simulado) para el demo. Cuando se integre LibreDTE en modo
 * certificación, esta función llamará a su API y guardará folio/PDF reales.
 *
 * Idempotente: si el pedido ya tiene folio, no re-emite.
 */
export async function emitirDocumento(pedido: Pedido): Promise<DteResultado | null> {
  // Ya emitido.
  if ((pedido as Pedido & { dte_folio?: string }).dte_folio) {
    const p = pedido as Pedido & { dte_tipo?: string; dte_folio?: string; dte_url?: string };
    return {
      tipo: (p.dte_tipo as "boleta" | "factura") || "boleta",
      folio: p.dte_folio!,
      url: p.dte_url || "",
      mock: true,
    };
  }

  const tipo: "boleta" | "factura" = (pedido as Pedido & { cliente_rut?: string }).cliente_rut
    ? "factura"
    : "boleta";

  const habilitado = process.env.DTE_ENABLED === "true";

  let resultado: DteResultado;
  if (habilitado && process.env.LIBREDTE_API_TOKEN) {
    // TODO Fase 6+: integración real con LibreDTE (modo certificación SII).
    // Por ahora, aunque esté habilitado, si no hay implementación real
    // caemos al mock para no bloquear.
    resultado = mockDte(tipo, pedido);
  } else {
    resultado = mockDte(tipo, pedido);
  }

  // Persistir en el pedido (best-effort: columnas de schema-fase6-dte.sql).
  try {
    await pedidosRepo.update(pedido.id, {
      dte_tipo: resultado.tipo,
      dte_folio: resultado.folio,
      dte_url: resultado.url,
      dte_emitido_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("No se pudo guardar DTE en el pedido (no fatal):", e);
  }

  return resultado;
}

function mockDte(tipo: "boleta" | "factura", pedido: Pedido): DteResultado {
  const folio = `MOCK-${tipo.toUpperCase()}-${pedido.numero_pedido ?? Date.now()}`;
  return {
    tipo,
    folio,
    url: `/api/admin/pedidos/${pedido.id}/dte.pdf`, // placeholder de demo
    mock: true,
  };
}
