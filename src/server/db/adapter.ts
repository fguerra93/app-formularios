import type { SupabaseClient } from "@supabase/supabase-js";
import { getPool } from "./pg";

/**
 * Adaptador de compatibilidad PostgREST → SQL (Cloud SQL Postgres).
 *
 * Implementa EXACTAMENTE el subconjunto del query-builder de Supabase que usan
 * los ~29 repositorios de `src/server/repositories` (medido, no especulado):
 *   from · select(+embeds 1-nivel) · eq/neq/gt/gte/lt/lte · in · is · like/ilike
 *   · or(ilike,cs) · overlaps · contains · not(in) · order · limit · range
 *   · single/maybeSingle · insert · update · delete · upsert(onConflict)
 *   · count:"exact"(+head) · rpc(fn escalar)
 *
 * Así `getDb()` se intercambia SIN tocar los repositorios (promesa de Fase 1).
 * Toda la traducción y el riesgo se concentran aquí, donde se testea a fondo.
 */

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string; code?: string } | null; count: number | null };

interface ColType {
  isJson: boolean; // jsonb / json
  isArray: boolean; // text[], int[]...
  udt: string; // p.ej. "_text" -> "text[]"
}

const typeCache = new Map<string, Record<string, ColType>>();

async function getTableTypes(table: string): Promise<Record<string, ColType>> {
  const cached = typeCache.get(table);
  if (cached) return cached;
  const { rows } = await getPool().query(
    `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  const map: Record<string, ColType> = {};
  for (const r of rows as { column_name: string; data_type: string; udt_name: string }[]) {
    map[r.column_name] = {
      isJson: r.data_type === "jsonb" || r.data_type === "json",
      isArray: r.data_type === "ARRAY",
      udt: r.udt_name,
    };
  }
  typeCache.set(table, map);
  return map;
}

/** Nombre Postgres de un array a partir de su udt ("_text" -> "text[]"). */
function arrayCast(udt: string): string {
  return (udt.startsWith("_") ? udt.slice(1) : "text") + "[]";
}

function singularize(table: string): string {
  if (table.endsWith("es")) return table.slice(0, -2);
  if (table.endsWith("s")) return table.slice(0, -1);
  return table;
}

interface Embed {
  key: string; // clave en el objeto resultado
  table: string; // tabla embebida
  fk: string; // columna FK en la tabla base
  cols: string; // columnas a traer ("*" o lista)
}

interface SelectSpec {
  plain: string[]; // columnas planas ("*" => ["*"])
  embeds: Embed[];
}

function parseSelect(columns: string): SelectSpec {
  const parts = splitTopLevel(columns);
  const plain: string[] = [];
  const embeds: Embed[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    if (part.includes("(")) {
      // [alias:]table(cols)
      const paren = part.indexOf("(");
      const head = part.slice(0, paren);
      const cols = part.slice(paren + 1, part.lastIndexOf(")")).trim() || "*";
      let alias: string | null = null;
      let table = head;
      if (head.includes(":")) {
        const [a, t] = head.split(":");
        alias = a.trim();
        table = t.trim();
      }
      const base = alias ?? singularize(table);
      embeds.push({ key: alias ?? table, table, fk: `${base}_id`, cols });
    } else if (part) {
      plain.push(part);
    }
  }
  if (plain.length === 0 && embeds.length === 0) plain.push("*");
  return { plain, embeds };
}

/** Split por comas de nivel superior (ignora las que están dentro de () o {}). */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(" || ch === "{") depth++;
    else if (ch === ")" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

type FilterKind =
  | { k: "cmp"; col: string; op: string; val: unknown }
  | { k: "in"; col: string; vals: unknown[]; negate: boolean }
  | { k: "is"; col: string; val: unknown }
  | { k: "ilike" | "like"; col: string; val: string }
  | { k: "arr"; col: string; op: "@>" | "&&"; vals: unknown[] }
  | { k: "or"; raw: string };

class Builder implements PromiseLike<Result> {
  private table: string;
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private sel: SelectSpec = { plain: ["*"], embeds: [] };
  private countMode: "exact" | null = null;
  private head = false;
  private filters: FilterKind[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private limitN: number | null = null;
  private offsetN: number | null = null;
  private rangeTo: number | null = null;
  private one: "single" | "maybe" | null = null;
  private payload: Row | Row[] | null = null;
  private onConflict: string | null = null;
  private returning = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*", opts?: { count?: "exact"; head?: boolean }): this {
    if (this.op === "select") {
      this.sel = parseSelect(columns);
    } else {
      this.returning = true;
      if (columns && columns !== "*") this.sel = parseSelect(columns);
    }
    if (opts?.count) this.countMode = opts.count;
    if (opts?.head) this.head = true;
    return this;
  }

  insert(values: Row | Row[]): this {
    this.op = "insert";
    this.payload = values;
    return this;
  }
  update(values: Row): this {
    this.op = "update";
    this.payload = values;
    return this;
  }
  upsert(values: Row | Row[], opts?: { onConflict?: string }): this {
    this.op = "upsert";
    this.payload = values;
    this.onConflict = opts?.onConflict ?? null;
    return this;
  }
  delete(): this {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: unknown): this { return this.cmp(col, "=", val); }
  neq(col: string, val: unknown): this { return this.cmp(col, "<>", val); }
  gt(col: string, val: unknown): this { return this.cmp(col, ">", val); }
  gte(col: string, val: unknown): this { return this.cmp(col, ">=", val); }
  lt(col: string, val: unknown): this { return this.cmp(col, "<", val); }
  lte(col: string, val: unknown): this { return this.cmp(col, "<=", val); }
  private cmp(col: string, op: string, val: unknown): this {
    this.filters.push({ k: "cmp", col, op, val });
    return this;
  }
  in(col: string, vals: unknown[]): this {
    this.filters.push({ k: "in", col, vals, negate: false });
    return this;
  }
  is(col: string, val: unknown): this {
    this.filters.push({ k: "is", col, val });
    return this;
  }
  like(col: string, val: string): this {
    this.filters.push({ k: "like", col, val });
    return this;
  }
  ilike(col: string, val: string): this {
    this.filters.push({ k: "ilike", col, val });
    return this;
  }
  overlaps(col: string, vals: unknown[]): this {
    this.filters.push({ k: "arr", col, op: "&&", vals });
    return this;
  }
  contains(col: string, vals: unknown[]): this {
    this.filters.push({ k: "arr", col, op: "@>", vals });
    return this;
  }
  or(raw: string): this {
    this.filters.push({ k: "or", raw });
    return this;
  }
  not(col: string, op: string, val: unknown): this {
    if (op === "in") {
      // val viene como "(a,b,c)"
      const inner = String(val).replace(/^\(|\)$/g, "");
      const vals = inner.length ? inner.split(",").map((v) => v.trim()) : [];
      this.filters.push({ k: "in", col, vals, negate: true });
    }
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orders.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number): this {
    this.limitN = n;
    return this;
  }
  range(from: number, to: number): this {
    this.offsetN = from;
    this.rangeTo = to;
    this.limitN = to - from + 1;
    return this;
  }
  single(): this {
    this.one = "single";
    return this;
  }
  maybeSingle(): this {
    this.one = "maybe";
    return this;
  }

  // --- ejecución (thenable) ---
  then<TR = Result, TE = never>(
    onfulfilled?: ((value: Result) => TR | PromiseLike<TR>) | null,
    onrejected?: ((reason: unknown) => TE | PromiseLike<TE>) | null
  ): Promise<TR | TE> {
    return this.exec().then(onfulfilled, onrejected);
  }

  private async exec(): Promise<Result> {
    try {
      const types = await getTableTypes(this.table);
      if (this.op === "select") return await this.execSelect(types);
      return await this.execMutation(types);
    } catch (e) {
      return { data: null, error: { message: (e as Error).message }, count: null };
    }
  }

  private renderWhere(types: Record<string, ColType>, params: unknown[]): string {
    const ph = (v: unknown) => `$${params.push(v)}`;
    const conds: string[] = [];
    for (const f of this.filters) {
      if (f.k === "cmp") conds.push(`"${f.col}" ${f.op} ${ph(f.val)}`);
      else if (f.k === "in") {
        if (f.vals.length === 0) conds.push(f.negate ? "true" : "false");
        else {
          const list = f.vals.map((v) => ph(v)).join(", ");
          conds.push(`"${f.col}" ${f.negate ? "NOT IN" : "IN"} (${list})`);
        }
      } else if (f.k === "is") {
        if (f.val === null) conds.push(`"${f.col}" IS NULL`);
        else conds.push(`"${f.col}" IS ${f.val ? "TRUE" : "FALSE"}`);
      } else if (f.k === "ilike") conds.push(`"${f.col}" ILIKE ${ph(f.val)}`);
      else if (f.k === "like") conds.push(`"${f.col}" LIKE ${ph(f.val)}`);
      else if (f.k === "arr") {
        const cast = types[f.col]?.isArray ? `::${arrayCast(types[f.col].udt)}` : "";
        conds.push(`"${f.col}" ${f.op} ${ph(f.vals)}${cast}`);
      } else if (f.k === "or") {
        conds.push(`(${this.renderOr(f.raw, params)})`);
      }
    }
    return conds.length ? ` WHERE ${conds.join(" AND ")}` : "";
  }

  private renderOr(raw: string, params: unknown[]): string {
    const ph = (v: unknown) => `$${params.push(v)}`;
    const terms = splitTopLevel(raw).map((t) => t.trim());
    const ors: string[] = [];
    for (const term of terms) {
      const first = term.indexOf(".");
      const col = term.slice(0, first);
      const rest = term.slice(first + 1);
      const second = rest.indexOf(".");
      const op = rest.slice(0, second);
      const val = rest.slice(second + 1);
      if (op === "ilike") ors.push(`"${col}" ILIKE ${ph(val)}`);
      else if (op === "like") ors.push(`"${col}" LIKE ${ph(val)}`);
      else if (op === "eq") ors.push(`"${col}" = ${ph(val)}`);
      else if (op === "cs") {
        // tags.cs.{term} -> "tags" @> ARRAY['term']
        const inner = val.replace(/^\{|\}$/g, "");
        ors.push(`"${col}" @> ARRAY[${ph(inner)}]::text[]`);
      }
    }
    return ors.length ? ors.join(" OR ") : "true";
  }

  private async execSelect(types: Record<string, ColType>): Promise<Result> {
    const params: unknown[] = [];
    const where = this.renderWhere(types, params);

    let count: number | null = null;
    if (this.countMode === "exact") {
      const cParams: unknown[] = [];
      const cWhere = this.renderWhere(types, cParams);
      const { rows } = await getPool().query(
        `SELECT count(*)::int AS c FROM "${this.table}"${cWhere}`,
        cParams
      );
      count = (rows[0] as { c: number }).c;
    }

    if (this.head) return { data: null, error: null, count };

    // columnas base (+ FK de cada embed para poder unir)
    let colsSql: string;
    if (this.sel.plain.includes("*")) colsSql = "*";
    else {
      const cols = new Set(this.sel.plain);
      for (const e of this.sel.embeds) cols.add(e.fk);
      colsSql = Array.from(cols).map((c) => `"${c}"`).join(", ");
    }

    let sql = `SELECT ${colsSql} FROM "${this.table}"${where}`;
    if (this.orders.length) {
      sql += " ORDER BY " + this.orders.map((o) => `"${o.col}" ${o.asc ? "ASC" : "DESC"}`).join(", ");
    }
    if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
    if (this.offsetN != null) sql += ` OFFSET ${this.offsetN}`;

    const { rows } = await getPool().query(sql, params);
    let data = rows as Row[];

    // embeds 1-nivel (many-to-one): batch fetch + stitch
    for (const e of this.sel.embeds) {
      const ids = Array.from(
        new Set(data.map((r) => r[e.fk]).filter((v) => v != null))
      );
      const map: Record<string, Row> = {};
      if (ids.length) {
        const ecols = e.cols === "*" ? "*" : splitTopLevel(e.cols).map((c) => `"${c.trim()}"`).join(", ");
        const inList = ids.map((_, i) => `$${i + 1}`).join(", ");
        const { rows: erows } = await getPool().query(
          `SELECT ${ecols === "*" ? "*" : ecols + ', "id"'} FROM "${e.table}" WHERE "id" IN (${inList})`,
          ids
        );
        for (const er of erows as Row[]) map[String(er.id)] = er;
      }
      for (const r of data) {
        const fkVal = r[e.fk];
        r[e.key] = fkVal != null ? map[String(fkVal)] ?? null : null;
      }
    }

    return this.shape(data, count);
  }

  private async execMutation(types: Record<string, ColType>): Promise<Result> {
    const params: unknown[] = [];
    const ser = (col: string, v: unknown) => {
      const t = types[col];
      if (t?.isJson && v !== null && v !== undefined) return JSON.stringify(v);
      return v;
    };
    const castFor = (col: string) => {
      const t = types[col];
      if (t?.isJson) return "::jsonb";
      if (t?.isArray) return `::${arrayCast(t.udt)}`;
      return "";
    };
    const ph = (col: string, v: unknown) => `$${params.push(ser(col, v))}${castFor(col)}`;

    let sql = "";
    if (this.op === "insert" || this.op === "upsert") {
      const rowsArr = Array.isArray(this.payload) ? this.payload : [this.payload!];
      const cols = Array.from(new Set(rowsArr.flatMap((r) => Object.keys(r))));
      const tuples = rowsArr
        .map((r) => `(${cols.map((c) => ph(c, r[c] ?? null)).join(", ")})`)
        .join(", ");
      sql = `INSERT INTO "${this.table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES ${tuples}`;
      if (this.op === "upsert" && this.onConflict) {
        const conflictCols = this.onConflict.split(",").map((c) => c.trim());
        const updates = cols
          .filter((c) => !conflictCols.includes(c))
          .map((c) => `"${c}" = EXCLUDED."${c}"`);
        sql += ` ON CONFLICT (${conflictCols.map((c) => `"${c}"`).join(", ")}) DO ${
          updates.length ? `UPDATE SET ${updates.join(", ")}` : "NOTHING"
        }`;
      }
    } else if (this.op === "update") {
      const row = this.payload as Row;
      const cols = Object.keys(row);
      const sets = cols.map((c) => `"${c}" = ${ph(c, row[c])}`).join(", ");
      sql = `UPDATE "${this.table}" SET ${sets}${this.renderWhere(types, params)}`;
    } else if (this.op === "delete") {
      sql = `DELETE FROM "${this.table}"${this.renderWhere(types, params)}`;
    }

    if (this.returning) {
      const cols = this.sel.plain.includes("*")
        ? "*"
        : this.sel.plain.map((c) => `"${c}"`).join(", ");
      sql += ` RETURNING ${cols}`;
    }

    const { rows } = await getPool().query(sql, params);
    if (!this.returning) return { data: null, error: null, count: null };
    return this.shape(rows as Row[], null);
  }

  private shape(rows: Row[], count: number | null): Result {
    if (this.one === "single") {
      if (rows.length === 1) return { data: rows[0], error: null, count };
      return {
        data: null,
        error: { message: rows.length === 0 ? "No rows found" : "Multiple rows", code: "PGRST116" },
        count,
      };
    }
    if (this.one === "maybe") {
      if (rows.length <= 1) return { data: rows[0] ?? null, error: null, count };
      return { data: null, error: { message: "Multiple rows", code: "PGRST116" }, count };
    }
    return { data: rows, error: null, count };
  }
}

async function rpc(fn: string, args: Record<string, unknown> = {}): Promise<Result> {
  try {
    const params: unknown[] = [];
    const named = Object.entries(args)
      .map(([k, v]) => {
        const isObj = v !== null && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v);
        const isArrObj = Array.isArray(v) && v.some((x) => x !== null && typeof x === "object");
        if (isObj || isArrObj) {
          params.push(JSON.stringify(v));
          return `${k} => $${params.length}::jsonb`;
        }
        params.push(v);
        return `${k} => $${params.length}`;
      })
      .join(", ");
    const { rows } = await getPool().query(`SELECT ${fn}(${named}) AS result`, params);
    const result = rows.length ? (rows[0] as { result: unknown }).result : null;
    return { data: result, error: null, count: null };
  } catch (e) {
    return { data: null, error: { message: (e as Error).message }, count: null };
  }
}

/** Cliente con la forma de SupabaseClient que consumen los repositorios. */
export function createPgDb(): SupabaseClient {
  const client = {
    from(table: string) {
      return new Builder(table);
    },
    rpc,
  };
  return client as unknown as SupabaseClient;
}
