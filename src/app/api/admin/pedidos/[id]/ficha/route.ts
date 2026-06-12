import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { pedidosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/**
 * Ficha de trabajo imprimible del pedido (HTML standalone, Ctrl+P y listo):
 * número grande, cliente, entrega, items con tallas/medidas/estampados y
 * notas. Es el papel que acompaña el trabajo en el taller.
 */
function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const pedido = await pedidosRepo.findById(id);
  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const items = Array.isArray(pedido.items)
    ? (pedido.items as { nombre?: string; cantidad?: number; precio_unitario?: number; variante?: Record<string, string> | null }[])
    : [];

  const filas = items
    .map((it, i) => {
      const detalle = it.variante
        ? Object.entries(it.variante)
            .map(([k, v]) => `<span class="chip">${esc(k)}: <b>${esc(v)}</b></span>`)
            .join(" ")
        : "";
      return `<tr>
        <td class="num">${i + 1}</td>
        <td><div class="prod">${esc(it.nombre)}</div>${detalle ? `<div class="detalle">${detalle}</div>` : ""}</td>
        <td class="num">× ${esc(it.cantidad)}</td>
      </tr>`;
    })
    .join("");

  const fecha = new Date(String(pedido.created_at)).toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const entrega = pedido.tipo_entrega === "despacho" ? "DESPACHO" : "RETIRO EN TIENDA";
  const dir = pedido.direccion_envio as { calle?: string; numero?: string; comuna?: string } | null;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Ficha de trabajo — Pedido #${esc(pedido.numero_pedido)}</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f1115; padding: 28px; max-width: 760px; margin: 0 auto; }
  .cmyk { display: flex; height: 4px; margin-bottom: 18px; }
  .cmyk i { flex: 1; } .cmyk i:nth-child(1){background:#00aeef}.cmyk i:nth-child(2){background:#ec008c}.cmyk i:nth-child(3){background:#ffd100}.cmyk i:nth-child(4){background:#3a3f47}
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f1115; padding-bottom: 12px; }
  h1 { font-size: 34px; letter-spacing: -0.02em; }
  .mono { font-family: Consolas, Menlo, monospace; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin: 16px 0 20px; font-size: 14px; }
  .meta b { display: inline-block; min-width: 90px; color: #5b6472; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em; }
  .entrega { display: inline-block; border: 2px solid #0f1115; padding: 4px 12px; font-weight: bold; font-size: 13px; letter-spacing: 0.06em; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: #5b6472; border-bottom: 2px solid #0f1115; padding: 6px 8px; }
  td { border-bottom: 1px solid #d7dbe2; padding: 10px 8px; vertical-align: top; font-size: 14px; }
  td.num { font-family: Consolas, Menlo, monospace; white-space: nowrap; }
  .prod { font-weight: bold; }
  .detalle { margin-top: 4px; }
  .chip { display: inline-block; border: 1px solid #d7dbe2; padding: 2px 7px; font-size: 12px; margin: 2px 4px 2px 0; }
  .notas { margin-top: 18px; border: 1px dashed #8b94a3; padding: 12px; font-size: 13px; min-height: 56px; }
  .notas b { font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: #5b6472; display: block; margin-bottom: 4px; }
  .firma { margin-top: 34px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; font-size: 11px; color: #5b6472; text-transform: uppercase; letter-spacing: 0.06em; }
  .firma div { border-top: 1px solid #0f1115; padding-top: 6px; text-align: center; }
  @media print { body { padding: 0; } .no-print { display: none; } }
  .no-print { margin: 18px 0; }
  .no-print button { padding: 10px 18px; font-weight: bold; background: #0f1115; color: #fff; border: 0; cursor: pointer; }
</style></head>
<body>
  <div class="cmyk"><i></i><i></i><i></i><i></i></div>
  <header>
    <h1>FICHA DE TRABAJO</h1>
    <div class="mono" style="font-size:26px;font-weight:bold;">#${esc(pedido.numero_pedido)}</div>
  </header>

  <div class="no-print"><button onclick="window.print()">Imprimir</button></div>

  <div class="meta">
    <div><b>Fecha</b> <span class="mono">${esc(fecha)}</span></div>
    <div><b>Pago</b> <span class="mono">${esc(pedido.pago_estado)} · ${esc(pedido.pago_metodo)}</span></div>
    <div><b>Cliente</b> ${esc(pedido.cliente_nombre)}</div>
    <div><b>Teléfono</b> <span class="mono">${esc(pedido.cliente_telefono || "—")}</span></div>
    <div><b>Email</b> ${esc(pedido.cliente_email)}</div>
    <div><b>Entrega</b> <span class="entrega">${entrega}</span>${dir?.comuna ? ` <span class="mono">${esc(`${dir.calle || ""} ${dir.numero || ""}, ${dir.comuna}`)}</span>` : ""}</div>
  </div>

  <table>
    <thead><tr><th style="width:30px">#</th><th>Trabajo</th><th style="width:60px">Cant.</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>

  <div class="notas"><b>Notas del pedido</b>${esc(pedido.notas || "")}</div>

  <div class="firma">
    <div>Impreso por</div>
    <div>Control de calidad</div>
    <div>Entregado / despachado</div>
  </div>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
