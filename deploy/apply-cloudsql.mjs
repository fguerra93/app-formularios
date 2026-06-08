// Construye el esquema consolidado para Cloud SQL (Postgres puro) a partir de
// los .sql de Supabase y lo aplica statement-por-statement contra la instancia.
//   node deploy/apply-cloudsql.mjs            (esquema + seeds)
//   node deploy/apply-cloudsql.mjs --schema-only
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPA = path.join(__dirname, "..", "supabase");
const read = (f) => readFileSync(path.join(SUPA, f), "utf8");

// Orden de dependencias (base -> features -> módulos de fase nuevos).
const ORDER = [
  "schema.sql",
  "schema-ecommerce.sql",
  "schema-fase4.sql",
  "schema-fase5.sql",
  "schema-fase6.sql",
  "schema-fase7.sql",
  "schema-fase8.sql",
  "schema-fase9.sql",
  "schema-fase11.sql",
  "migration-calculadora-m2.sql",
  "migration-calculadora-mas-productos.sql",
  "migration-fase11-completa.sql",
  "schema-inventario.sql",
  "schema-seguridad.sql",
  "schema-fase3-nucleo.sql",
  "schema-fase4-aprobaciones.sql",
  "schema-fase5-bot.sql",
  "schema-fase6-dte.sql",
  "schema-fase7-produccion.sql",
  "schema-fase-f1-gangsheet.sql",
  "schema-fase-f2-taller.sql",
  "schema-fase-f4-costos.sql",
  "schema-fase-f5-mercado.sql",
];

// Versiones limpias que se anteponen para que los IF NOT EXISTS posteriores
// (con FK a auth.users o esquemas en conflicto) se salten.
const PREPEND = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- clientes: auth propia (password_hash), sin dependencia de auth.users.
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  email TEXT UNIQUE,
  password_hash TEXT,
  nombre TEXT NOT NULL,
  telefono TEXT,
  rut TEXT,
  tipo TEXT DEFAULT 'persona',
  razon_social TEXT,
  whatsapp_phone TEXT,
  instagram_id TEXT,
  facebook_id TEXT,
  canal_origen TEXT,
  onboarding_completo BOOLEAN DEFAULT false,
  direccion_default JSONB DEFAULT NULL,
  preferencias JSONB DEFAULT '{"newsletter": true, "notificaciones": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- bot_intent_cache: unión de columnas de las 2 versiones (texto_norm + mensaje_hash).
CREATE TABLE IF NOT EXISTS bot_intent_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texto_norm TEXT UNIQUE,
  intent TEXT NOT NULL,
  nivel TEXT,
  mensaje_hash TEXT,
  confianza REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

// Limpia Supabase-ismos: RLS, policies, grants, storage, FK a auth.users.
function clean(sql) {
  return sql
    .replace(/CREATE\s+POLICY[\s\S]*?;/gi, "")
    .replace(/DROP\s+POLICY[\s\S]*?;/gi, "")
    .replace(/ALTER\s+TABLE\s+[\w".]+\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY\s*;/gi, "")
    .replace(/GRANT[\s\S]*?;/gi, "")
    .replace(/REVOKE[\s\S]*?;/gi, "")
    .replace(/INSERT\s+INTO\s+storage\.[\s\S]*?;/gi, "")
    // FK a auth.users dentro de defs que igual se saltan: neutraliza la cláusula.
    .replace(/\s+REFERENCES\s+auth\.users\s*\(\s*id\s*\)(\s+ON\s+DELETE\s+\w+( \w+)?)?/gi, "");
}

let full = PREPEND + "\n";
for (const f of ORDER) {
  full += `\n-- ===== ${f} =====\n` + clean(read(f)) + "\n";
}
writeFileSync(path.join(__dirname, "schema-cloudsql.sql"), full, "utf8");

// Tokenizador: separa en statements respetando '...' y $tag$...$tag$.
function splitStatements(sql) {
  const out = [];
  let cur = "";
  let i = 0;
  let inSq = false; // single quote
  let dollarTag = null; // p.ej. "$$" o "$func$"
  while (i < sql.length) {
    const ch = sql[i];
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        cur += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (inSq) {
      cur += ch;
      if (ch === "'") inSq = false;
      i++;
      continue;
    }
    // Comentarios fuera de strings: -- hasta fin de línea, /* */ en bloque.
    if (ch === "-" && sql[i + 1] === "-") {
      const nl = sql.indexOf("\n", i);
      i = nl === -1 ? sql.length : nl;
      continue;
    }
    if (ch === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }
    if (ch === "'") {
      inSq = true;
      cur += ch;
      i++;
      continue;
    }
    if (ch === "$") {
      const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (m) {
        dollarTag = m[0];
        cur += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }
    if (ch === ";") {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function run() {
  const schemaonly = process.argv.includes("--schema-only");
  const statements = splitStatements(full);
  const seeds = schemaonly
    ? []
    : [
        ...splitStatements(read("seed-shopify-products.sql")),
        ...splitStatements(read("seed-sandbox-demo.sql")),
      ];

  const client = new pg.Client({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME || "printup",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  let ok = 0;
  const errors = [];
  for (const [label, list] of [["SCHEMA", statements], ["SEED", seeds]]) {
    for (const st of list) {
      try {
        await client.query(st);
        ok++;
      } catch (e) {
        errors.push({ label, msg: e.message, sql: st.slice(0, 90).replace(/\s+/g, " ") });
      }
    }
  }
  await client.end();

  console.log(`OK statements: ${ok}`);
  console.log(`ERRORES: ${errors.length}`);
  for (const e of errors) console.log(`  [${e.label}] ${e.msg}  ::  ${e.sql}`);
}
run().catch((e) => {
  console.error("FATAL", e.message);
  process.exit(1);
});
