import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { ordenesProduccionRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/**
 * Documento imprimible de la OP (HTML con CSS de impresión). Para el demo se
 * entrega HTML listo para "Imprimir → Guardar como PDF"; la generación de PDF
 * server-side con @react-pdf/renderer es una mejora posterior.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const op = await ordenesProduccionRepo.findById(id);
  if (!op) {
    return NextResponse.json({ error: "OP no encontrada" }, { status: 404 });
  }

  const f = (v: unknown) => (v == null || v === "" ? "—" : String(v));
  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>OP #${f(op.numero_op)}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1E293B; margin: 32px; }
  h1 { color: #1B2A6B; margin: 0 0 4px; }
  .muted { color: #64748B; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  td { padding: 8px 6px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
  td.k { width: 200px; font-weight: bold; color: #475569; }
  .box { margin-top: 24px; border: 1px solid #CBD5E1; border-radius: 8px; padding: 16px; min-height: 80px; }
  .checklist li { margin-bottom: 6px; }
  @media print { .noprint { display: none; } }
</style></head>
<body>
  <button class="noprint" onclick="window.print()" style="float:right;padding:8px 16px;">Imprimir / PDF</button>
  <h1>Orden de Producción #${f(op.numero_op)}</h1>
  <p class="muted">Creada: ${f(op.created_at)} · Estado: ${f(op.estado)}</p>
  <table>
    <tr><td class="k">Tipo de trabajo</td><td>${f(op.tipo)}</td></tr>
    <tr><td class="k">Cantidad</td><td>${f(op.cantidad)}</td></tr>
    <tr><td class="k">Material</td><td>${f(op.material)}</td></tr>
    <tr><td class="k">Dimensiones</td><td>${f(op.dimensiones)}</td></tr>
    <tr><td class="k">Precio total</td><td>$${Number(op.precio_total || 0).toLocaleString("es-CL")}</td></tr>
    <tr><td class="k">Entrega</td><td>${f(op.tipo_entrega)}</td></tr>
    <tr><td class="k">Fecha compromiso</td><td>${f(op.fecha_compromiso)}</td></tr>
    <tr><td class="k">Operador</td><td>${f(op.operador)}</td></tr>
    <tr><td class="k">Archivo diseño</td><td>${f(op.archivo_diseno_url)}</td></tr>
  </table>
  <div class="box"><strong>Notas:</strong><br>${f(op.notas)}</div>
  <div class="box">
    <strong>Checklist de calidad</strong>
    <ul class="checklist">
      <li>☐ Colores correctos</li>
      <li>☐ Medidas verificadas</li>
      <li>☐ Acabado revisado</li>
      <li>☐ Cantidad completa</li>
      <li>☐ Empaque OK</li>
    </ul>
  </div>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
