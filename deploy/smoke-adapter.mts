// Valida el adaptador PostgREST->SQL contra la instancia Cloud SQL real.
//   npx tsx deploy/smoke-adapter.mts
import { createPgDb } from "../src/server/db/adapter";

const db = createPgDb();
let fail = 0;
const check = (name: string, cond: boolean, extra?: unknown) => {
  console.log(`${cond ? "OK  " : "FAIL"} ${name}`, cond ? "" : JSON.stringify(extra));
  if (!cond) fail++;
};

// 1. embed many-to-one + filtro + limit
const r1 = await db.from("productos").select("*, categoria:categorias(*)").eq("activo", true).limit(2);
check("embed productos+categoria", !r1.error && Array.isArray(r1.data) && (r1.data as unknown[]).length > 0, r1.error);
const p0 = (r1.data as Record<string, unknown>[])[0];
check("embed trae objeto categoria", p0 && typeof p0.categoria === "object", p0?.categoria);

// 2. or + count exact + range
const r2 = await db
  .from("productos")
  .select("*", { count: "exact" })
  .or("nombre.ilike.%polera%,descripcion.ilike.%dtf%")
  .range(0, 4);
check("or+count exact", !r2.error && typeof r2.count === "number", r2.error);

// 3. upsert onConflict + single read
const r3 = await db
  .from("configuracion")
  .upsert({ clave: "smoke_test", valor: "ok", updated_at: new Date().toISOString() }, { onConflict: "clave" });
check("upsert configuracion", !r3.error, r3.error);
const r4 = await db.from("configuracion").select("valor").eq("clave", "smoke_test").single();
check("single read tras upsert", !r4.error && (r4.data as { valor: string })?.valor === "ok", r4.error);

// 4. rpc escalar (int)
const r5 = await db.rpc("liberar_reservas_vencidas", { p_minutos: 30 });
check("rpc liberar_reservas_vencidas", !r5.error && typeof r5.data === "number", r5.error ?? r5.data);

// 5. insert con jsonb + returning single
const r6 = await db
  .from("pedidos")
  .insert({
    cliente_nombre: "Smoke Test",
    cliente_email: "smoke@test.cl",
    tipo_entrega: "retiro_tienda",
    items: [{ producto_id: "x", nombre: "Item", cantidad: 1, precio_unitario: 1000 }],
    subtotal: 1000,
    costo_envio: 0,
    total: 1000,
  })
  .select()
  .single();
check("insert pedido jsonb+returning", !r6.error && !!(r6.data as { id: string })?.id, r6.error);

// 6. in() + ilike
const r7 = await db.from("pedidos").select("id, estado").in("estado", ["pendiente", "confirmado"]).limit(5);
check("in() filtro", !r7.error, r7.error);

// limpieza
if ((r6.data as { id?: string })?.id) {
  await db.from("pedidos").delete().eq("id", (r6.data as { id: string }).id);
}
await db.from("configuracion").delete().eq("clave", "smoke_test");

console.log(fail === 0 ? "\n✅ ADAPTER OK" : `\n❌ ${fail} fallas`);
process.exit(fail === 0 ? 0 : 1);
