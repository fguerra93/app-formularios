"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";

const CLP = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CL")}`;

interface RentRow {
  producto_id: string;
  nombre: string;
  precio_venta: number;
  costo: number;
  margen: number;
  margen_pct: number;
  insumos: number;
  sin_bom: boolean;
}
interface Alerta {
  insumo_id: string;
  nombre: string;
  costo_actual: number;
  promedio_historico: number;
  variacion_pct: number;
}
interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  costo_actual: number;
  sku?: string | null;
}
interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
}
interface BomItem {
  id: string;
  producto_id: string;
  insumo_id: string;
  cantidad: number;
}

type Tab = "rentabilidad" | "insumos" | "proveedores" | "bom";

export default function CostosPage() {
  const [tab, setTab] = useState<Tab>("rentabilidad");
  const [rent, setRent] = useState<RentRow[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarCostos = useCallback(async () => {
    const res = await fetch("/api/admin/costos", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRent(d.rentabilidad || []);
      setAlertas(d.alertas || []);
    }
  }, []);
  const cargarInsumos = useCallback(async () => {
    const res = await fetch("/api/admin/insumos", { cache: "no-store" });
    if (res.ok) setInsumos(await res.json());
  }, []);
  const cargarProveedores = useCallback(async () => {
    const res = await fetch("/api/admin/proveedores", { cache: "no-store" });
    if (res.ok) setProveedores(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([cargarCostos(), cargarInsumos(), cargarProveedores()]).finally(() =>
      setLoading(false)
    );
  }, [cargarCostos, cargarInsumos, cargarProveedores]);

  const TABS: { key: Tab; label: string }[] = [
    { key: "rentabilidad", label: "Rentabilidad" },
    { key: "insumos", label: "Insumos" },
    { key: "proveedores", label: "Proveedores" },
    { key: "bom", label: "Ficha de costos (BOM)" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Costos &amp; Márgenes</h1>
      <p className="mb-5 text-sm text-gray-500">
        ¿Compro bien? Costo real por producto (BOM × insumos), márgenes y alertas de sobreprecio.
      </p>

      {/* Alertas globales */}
      {alertas.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="size-4" /> Insumos por sobre su promedio histórico
          </p>
          <ul className="space-y-1 text-sm text-amber-700">
            {alertas.map((a) => (
              <li key={a.insumo_id}>
                <strong>{a.nombre}</strong>: {CLP(a.costo_actual)} (+{a.variacion_pct}% vs promedio{" "}
                {CLP(a.promedio_historico)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-[#1B2A6B] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando…</p>
      ) : (
        <>
          {tab === "rentabilidad" && <Rentabilidad rows={rent} />}
          {tab === "insumos" && (
            <Insumos
              insumos={insumos}
              proveedores={proveedores}
              onChange={() => Promise.all([cargarInsumos(), cargarCostos()])}
            />
          )}
          {tab === "proveedores" && (
            <Proveedores proveedores={proveedores} onChange={cargarProveedores} />
          )}
          {tab === "bom" && (
            <Bom
              productos={rent}
              insumos={insumos}
              onChange={cargarCostos}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- Rentabilidad ---------------- */
function Rentabilidad({ rows }: { rows: RentRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3 text-right">Precio venta</th>
            <th className="px-4 py-3 text-right">Costo real</th>
            <th className="px-4 py-3 text-right">Margen</th>
            <th className="px-4 py-3 text-right">Margen %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                Sin productos.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.producto_id}>
              <td className="px-4 py-3 text-gray-800">
                {r.nombre}
                {r.sin_bom && (
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                    sin BOM
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{CLP(r.precio_venta)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-600">{CLP(r.costo)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{CLP(r.margen)}</td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    r.sin_bom
                      ? "bg-gray-100 text-gray-500"
                      : r.margen_pct < 20
                        ? "bg-red-100 text-red-700"
                        : r.margen_pct < 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {r.sin_bom ? "—" : `${r.margen_pct}%`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Insumos ---------------- */
function Insumos({
  insumos,
  proveedores,
  onChange,
}: {
  insumos: Insumo[];
  proveedores: Proveedor[];
  onChange: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("unidad");
  const [costo, setCosto] = useState("");

  const crear = async () => {
    if (!nombre) return;
    await fetch("/api/admin/insumos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, unidad, costo_actual: Number(costo) || 0 }),
    });
    setNombre("");
    setCosto("");
    onChange();
  };
  const eliminar = async (id: string) => {
    await fetch(`/api/admin/insumos/${id}`, { method: "DELETE" });
    onChange();
  };
  const registrarPrecio = async (insumoId: string) => {
    const precio = prompt("Precio pagado a proveedor (CLP):");
    if (!precio) return;
    const proveedor_id = proveedores[0]?.id || null;
    await fetch("/api/admin/precios-proveedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insumo_id: insumoId, proveedor_id, precio: Number(precio) || 0 }),
    });
    onChange();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <Field label="Insumo">
          <input className="adm-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Film DTF 58cm" />
        </Field>
        <Field label="Unidad">
          <input className="adm-input w-24" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
        </Field>
        <Field label="Costo actual">
          <input className="adm-input w-28" type="number" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="0" />
        </Field>
        <button onClick={crear} className="flex items-center gap-1.5 rounded-lg bg-[#1B2A6B] px-3 py-2 text-sm font-medium text-white">
          <Plus className="size-4" /> Agregar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Insumo</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3 text-right">Costo actual</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {insumos.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Sin insumos.</td></tr>
            )}
            {insumos.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-3 text-gray-800">{i.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{i.unidad}</td>
                <td className="px-4 py-3 text-right tabular-nums">{CLP(i.costo_actual)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => registrarPrecio(i.id)} className="mr-3 text-xs text-[#00B4D8] hover:underline">
                    + precio proveedor
                  </button>
                  <button onClick={() => eliminar(i.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="inline size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`.adm-input{border:1px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.875rem;}`}</style>
    </div>
  );
}

/* ---------------- Proveedores ---------------- */
function Proveedores({ proveedores, onChange }: { proveedores: Proveedor[]; onChange: () => void }) {
  const [form, setForm] = useState({ nombre: "", contacto: "", telefono: "", email: "" });
  const crear = async () => {
    if (!form.nombre) return;
    await fetch("/api/admin/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ nombre: "", contacto: "", telefono: "", email: "" });
    onChange();
  };
  const eliminar = async (id: string) => {
    await fetch(`/api/admin/proveedores/${id}`, { method: "DELETE" });
    onChange();
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3">
        {(["nombre", "contacto", "telefono", "email"] as const).map((k) => (
          <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
            <input
              className="adm-input"
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </Field>
        ))}
        <button onClick={crear} className="flex items-center gap-1.5 rounded-lg bg-[#1B2A6B] px-3 py-2 text-sm font-medium text-white">
          <Plus className="size-4" /> Agregar
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {proveedores.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Sin proveedores.</td></tr>
            )}
            {proveedores.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-gray-800">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{p.contacto}</td>
                <td className="px-4 py-3 text-gray-500">{p.telefono}</td>
                <td className="px-4 py-3 text-gray-500">{p.email}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => eliminar(p.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="inline size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`.adm-input{border:1px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.875rem;}`}</style>
    </div>
  );
}

/* ---------------- BOM ---------------- */
function Bom({
  productos,
  insumos,
  onChange,
}: {
  productos: RentRow[];
  insumos: Insumo[];
  onChange: () => void;
}) {
  const [productoId, setProductoId] = useState("");
  const [bom, setBom] = useState<BomItem[]>([]);
  const [insumoId, setInsumoId] = useState("");
  const [cantidad, setCantidad] = useState("1");

  const cargar = useCallback(async (pid: string) => {
    if (!pid) return setBom([]);
    const res = await fetch(`/api/admin/bom?producto_id=${pid}`, { cache: "no-store" });
    if (res.ok) setBom(await res.json());
  }, []);

  useEffect(() => {
    cargar(productoId);
  }, [productoId, cargar]);

  const agregar = async () => {
    if (!productoId || !insumoId) return;
    await fetch("/api/admin/bom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producto_id: productoId, insumo_id: insumoId, cantidad: Number(cantidad) || 1 }),
    });
    setInsumoId("");
    setCantidad("1");
    await cargar(productoId);
    onChange();
  };
  const quitar = async (id: string) => {
    await fetch(`/api/admin/bom?id=${id}`, { method: "DELETE" });
    await cargar(productoId);
    onChange();
  };

  const insumoNombre = (id: string) => insumos.find((i) => i.id === id)?.nombre || id;
  const insumoCosto = (id: string) => insumos.find((i) => i.id === id)?.costo_actual || 0;
  const costoTotal = bom.reduce((s, b) => s + b.cantidad * insumoCosto(b.insumo_id), 0);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <Field label="Producto">
          <select className="adm-input min-w-64" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
            <option value="">Selecciona un producto…</option>
            {productos.map((p) => (
              <option key={p.producto_id} value={p.producto_id}>{p.nombre}</option>
            ))}
          </select>
        </Field>
      </div>

      {productoId && (
        <>
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3">
            <Field label="Insumo">
              <select className="adm-input min-w-48" value={insumoId} onChange={(e) => setInsumoId(e.target.value)}>
                <option value="">Selecciona…</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>{i.nombre} ({CLP(i.costo_actual)})</option>
                ))}
              </select>
            </Field>
            <Field label="Cantidad por unidad">
              <input className="adm-input w-28" type="number" step="0.01" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </Field>
            <button onClick={agregar} className="flex items-center gap-1.5 rounded-lg bg-[#1B2A6B] px-3 py-2 text-sm font-medium text-white">
              <Plus className="size-4" /> Agregar al BOM
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Insumo</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Costo línea</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bom.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Sin insumos en este producto.</td></tr>
                )}
                {bom.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 text-gray-800">{insumoNombre(b.insumo_id)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{b.cantidad}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{CLP(b.cantidad * insumoCosto(b.insumo_id))}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => quitar(b.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="inline size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {bom.length > 0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-3 text-gray-700" colSpan={2}>Costo real por unidad</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1B2A6B]">{CLP(costoTotal)}</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      <style>{`.adm-input{border:1px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.875rem;}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}
