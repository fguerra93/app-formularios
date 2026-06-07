import pg from "pg";
const c = new pg.Client({
  host: process.env.DB_HOST, port: 5432, database: process.env.DB_NAME || "printup",
  user: process.env.DB_USER || "postgres", password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false },
});
await c.connect();
await c.query("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS auth_user_id UUID");
const t = await c.query(
  "SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
);
const counts = {};
for (const tbl of ["productos", "categorias", "zonas_envio", "cupones", "pedidos", "clientes", "usuarios_admin"]) {
  try { counts[tbl] = (await c.query(`SELECT count(*)::int n FROM ${tbl}`)).rows[0].n; }
  catch (e) { counts[tbl] = "ERR:" + e.message; }
}
const fns = await c.query(
  "SELECT count(*)::int n FROM information_schema.routines WHERE routine_schema='public'"
);
console.log("Tablas:", t.rows[0].n, "| Funciones:", fns.rows[0].n);
console.log("Filas:", JSON.stringify(counts));
await c.end();
