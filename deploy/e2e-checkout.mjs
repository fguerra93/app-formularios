// E2E: catálogo(Cloud SQL) -> crear pedido vía API desplegada -> worker procesa evento.
import pg from "pg";
const BASE = "https://printup-app-173348909763.southamerica-west1.run.app";

const c = new pg.Client({
  host: process.env.DB_HOST, port: 5432, database: "printup",
  user: "postgres", password: process.env.DB_PASS, ssl: { rejectUnauthorized: false },
});
await c.connect();
const prod = (await c.query("SELECT id, nombre, precio FROM productos WHERE activo=true ORDER BY precio LIMIT 1")).rows[0];
console.log("Producto Cloud SQL:", prod.id, prod.nombre, prod.precio);

const body = {
  cliente_nombre: "E2E Test",
  cliente_email: "guerrafelipe93@gmail.com",
  tipo_entrega: "retiro_tienda",
  pago_metodo: "transferencia",
  items: [{ producto_id: prod.id, nombre: prod.nombre, cantidad: 1, precio_unitario: prod.precio }],
};
const res = await fetch(`${BASE}/api/pedidos`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const json = await res.json();
console.log("POST /api/pedidos ->", res.status, json.success ? `pedido #${json.pedido?.numero_pedido} id=${json.pedido?.id}` : JSON.stringify(json).slice(0, 200));

// Verificar en Cloud SQL
if (json.pedido?.id) {
  const p = (await c.query("SELECT numero_pedido, estado, total FROM pedidos WHERE id=$1", [json.pedido.id])).rows[0];
  console.log("Pedido en Cloud SQL:", JSON.stringify(p));
  const ev = (await c.query("SELECT count(*)::int n FROM domain_events WHERE estado='pendiente'")).rows[0].n;
  console.log("Eventos pendientes:", ev);
  const ap = (await c.query("SELECT count(*)::int n FROM aprobaciones WHERE estado='pendiente'")).rows[0].n;
  console.log("Aprobaciones pendientes:", ap);
}
await c.end();
console.log(json.success ? "\n✅ CHECKOUT E2E OK (Cloud SQL)" : "\n❌ checkout falló");
process.exit(json.success ? 0 : 1);
