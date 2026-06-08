"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Send, PackageCheck, X, Trash2 } from "lucide-react";

const CLP = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CL")}`;

interface OC {
  id: string;
  numero_oc: number;
  proveedor_id: string | null;
  estado: string;
  total: number;
  notas: string | null;
  created_at: string;
}
interface OCItem {
  id: string;
  insumo_id: string | null;
  nombre: string | null;
  cantidad: number;
  precio_unitario: number;
  cantidad_recibida: number;
}
interface Insumo { id: string; nombre: string; costo_actual: number }
interface Proveedor { id: string; nombre: string }
interface NuevoItem { insumo_id: string; nombre: string; cantidad: string; precio_unitario: string }

const ESTADO_STYLE: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-600",
  enviada: "bg-blue-100 text-blue-700",
  recibida: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-red-100 text-red-600",
};

export default function OrdenesCompraPage() {
  const [ocs, setOcs] = useState<OC[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [detalle, setDetalle] = useState<{ oc: OC; items: OCItem[] } | null>(null);

  const cargar = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      fetch("/api/admin/ordenes-compra", { cache: "no-store" }),
      fetch("/api/admin/insumos", { cache: "no-store" }),
      fetch("/api/admin/proveedores", { cache: "no-store" }),
    ]);
    if (a.ok) setOcs(await a.json());
    if (b.ok) setInsumos(await b.json());
    if (c.ok) setProveedores(await c.json());
  }, []);

  useEffect(() => {
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  const proveedorNombre = (id: string | null) =>
    proveedores.find((p) => p.id === id)?.nombre || "—";

  const abrir = async (oc: OC) => {
    const res = await fetch(`/api/admin/ordenes-compra/${oc.id}`, { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setDetalle({ oc, items: d.items || [] });
    }
  };

  const accion = async (id: string, accion: string) => {
    await fetch(`/api/admin/ordenes-compra/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion }),
    });
    setDetalle(null);
    cargar();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Órdenes de Compra</h1>
          <p className="text-sm text-gray-500">Genera la OC, envíala al proveedor y registra la recepción.</p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#1B2A6B] px-3 py-2 text-sm font-medium text-white"
        >
          <Plus className="size-4" /> Nueva OC
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">OC</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ocs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Sin órdenes de compra.</td></tr>
              )}
              {ocs.map((oc) => (
                <tr key={oc.id} className="cursor-pointer hover:bg-gray-50" onClick={() => abrir(oc)}>
                  <td className="px-4 py-3 font-semibold text-[#1B2A6B]">OC #{oc.numero_oc}</td>
                  <td className="px-4 py-3 text-gray-700">{proveedorNombre(oc.proveedor_id)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${ESTADO_STYLE[oc.estado] || "bg-gray-100"}`}>
                      {oc.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{CLP(oc.total)}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(oc.created_at).toLocaleDateString("es-CL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creando && (
        <NuevaOC
          insumos={insumos}
          proveedores={proveedores}
          onClose={() => setCreando(false)}
          onCreated={() => {
            setCreando(false);
            cargar();
          }}
        />
      )}

      {detalle && (
        <DetalleOC
          oc={detalle.oc}
          items={detalle.items}
          proveedor={proveedorNombre(detalle.oc.proveedor_id)}
          onClose={() => setDetalle(null)}
          onAccion={accion}
        />
      )}
    </div>
  );
}

function NuevaOC({
  insumos,
  proveedores,
  onClose,
  onCreated,
}: {
  insumos: Insumo[];
  proveedores: Proveedor[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [proveedorId, setProveedorId] = useState("");
  const [items, setItems] = useState<NuevoItem[]>([]);
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems([...items, { insumo_id: "", nombre: "", cantidad: "1", precio_unitario: "0" }]);
  const setItem = (idx: number, patch: Partial<NuevoItem>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const total = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0), 0);

  const guardar = async () => {
    const validos = items.filter((it) => it.insumo_id || it.nombre);
    if (validos.length === 0) return;
    setSaving(true);
    await fetch("/api/admin/ordenes-compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proveedor_id: proveedorId || null,
        notas,
        items: validos.map((it) => {
          const ins = insumos.find((x) => x.id === it.insumo_id);
          return {
            insumo_id: it.insumo_id || null,
            nombre: ins?.nombre || it.nombre,
            cantidad: Number(it.cantidad) || 1,
            precio_unitario: Number(it.precio_unitario) || 0,
          };
        }),
      }),
    });
    setSaving(false);
    onCreated();
  };

  return (
    <Modal title="Nueva orden de compra" onClose={onClose}>
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-500">Proveedor</span>
          <select className="oc-input mt-1 w-full" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Selecciona…</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </label>

        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                className="oc-input flex-1"
                value={it.insumo_id}
                onChange={(e) => {
                  const ins = insumos.find((x) => x.id === e.target.value);
                  setItem(idx, { insumo_id: e.target.value, nombre: ins?.nombre || "", precio_unitario: String(ins?.costo_actual ?? it.precio_unitario) });
                }}
              >
                <option value="">Insumo…</option>
                {insumos.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
              </select>
              <input className="oc-input w-20" type="number" value={it.cantidad} onChange={(e) => setItem(idx, { cantidad: e.target.value })} placeholder="Cant" />
              <input className="oc-input w-28" type="number" value={it.precio_unitario} onChange={(e) => setItem(idx, { precio_unitario: e.target.value })} placeholder="Precio" />
              <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 className="size-4" /></button>
            </div>
          ))}
          <button onClick={addItem} className="flex items-center gap-1 text-sm text-[#00B4D8] hover:underline">
            <Plus className="size-4" /> Agregar ítem
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-gray-500">Notas</span>
          <textarea className="oc-input mt-1 w-full" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold text-gray-700">Total: {CLP(total)}</span>
          <button
            onClick={guardar}
            disabled={saving || items.length === 0}
            className="rounded-lg bg-[#1B2A6B] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Crear OC"}
          </button>
        </div>
      </div>
      <style>{`.oc-input{border:1px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.875rem;}`}</style>
    </Modal>
  );
}

function DetalleOC({
  oc,
  items,
  proveedor,
  onClose,
  onAccion,
}: {
  oc: OC;
  items: OCItem[];
  proveedor: string;
  onClose: () => void;
  onAccion: (id: string, accion: string) => void;
}) {
  return (
    <Modal title={`OC #${oc.numero_oc} — ${proveedor}`} onClose={onClose}>
      <div className="space-y-3">
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${ESTADO_STYLE[oc.estado] || "bg-gray-100"}`}>
          {oc.estado}
        </span>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2">Insumo</th>
              <th className="py-2 text-right">Cant.</th>
              <th className="py-2 text-right">Precio</th>
              <th className="py-2 text-right">Recibido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((it) => (
              <tr key={it.id}>
                <td className="py-2 text-gray-800">{it.nombre || "—"}</td>
                <td className="py-2 text-right tabular-nums">{it.cantidad}</td>
                <td className="py-2 text-right tabular-nums">{CLP(it.precio_unitario)}</td>
                <td className="py-2 text-right tabular-nums">{it.cantidad_recibida}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold text-gray-700">Total: {CLP(oc.total)}</span>
          <div className="flex gap-2">
            {oc.estado === "borrador" && (
              <button onClick={() => onAccion(oc.id, "enviar")} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
                <Send className="size-4" /> Enviar
              </button>
            )}
            {(oc.estado === "borrador" || oc.estado === "enviada") && (
              <button onClick={() => onAccion(oc.id, "recibir")} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">
                <PackageCheck className="size-4" /> Registrar recepción
              </button>
            )}
            {oc.estado !== "recibida" && oc.estado !== "cancelada" && (
              <button onClick={() => onAccion(oc.id, "cancelar")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600">
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="size-5 text-gray-500" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
