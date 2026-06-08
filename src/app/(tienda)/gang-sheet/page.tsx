"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Plus,
  Minus,
  Copy,
  LayoutGrid,
  Loader2,
  ShoppingCart,
  Info,
  Ruler,
  ArrowLeft,
} from "lucide-react";

/* ---------- Tipos ---------- */
interface Tarifa {
  id: string;
  material: string;
  ancho_pliego_cm: number;
  tarifa_por_cm2: number;
  merma_pct: number;
  precio_minimo: number;
  dias_produccion: number;
}

interface ArteItem {
  id: string;
  file: File | null;
  previewUrl: string;
  arte_url?: string; // se llena al subir (GCS)
  w_cm: number;
  h_cm: number;
  cantidad: number;
}

interface PlacedItem {
  arte_url?: string;
  x: number;
  y: number;
  w_cm: number;
  h_cm: number;
  rot: number;
}

interface Cotizacion {
  material: string;
  ancho_pliego_cm: number;
  alto_pliego_cm: number;
  items: PlacedItem[];
  area_usada_cm2: number;
  area_pliego_cm2: number;
  merma_cm2: number;
  precio: number;
  desglose: {
    tarifa_por_cm2: number;
    area_cobrada_cm2: number;
    subtotal: number;
    tramo_descuento_pct: number;
    descuento: number;
    precio_minimo: number;
    dias_produccion: number;
    eficiencia_pct: number;
    unidades: number;
    tarifa_por_defecto: boolean;
  };
}

const CLP = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;
const PX_TO_CM = (px: number) => Math.round((px / 300) * 2.54 * 10) / 10; // 300 dpi
let counter = 0;
const nextId = () => `gs-${++counter}-${Date.now()}`;

/* Tarifa de respaldo si la BD aún no tiene la tabla (degradación elegante). */
const TARIFAS_FALLBACK: Tarifa[] = [
  { id: "f1", material: "DTF Textil", ancho_pliego_cm: 58, tarifa_por_cm2: 6, merma_pct: 8, precio_minimo: 3000, dias_produccion: 3 },
  { id: "f2", material: "DTF UV", ancho_pliego_cm: 60, tarifa_por_cm2: 8, merma_pct: 10, precio_minimo: 4000, dias_produccion: 4 },
  { id: "f3", material: "Sublimacion", ancho_pliego_cm: 100, tarifa_por_cm2: 4.5, merma_pct: 6, precio_minimo: 3000, dias_produccion: 4 },
];

export default function GangSheetPage() {
  const router = useRouter();
  const { addItem } = useCart();

  const [tarifas, setTarifas] = useState<Tarifa[]>(TARIFAS_FALLBACK);
  const [material, setMaterial] = useState<string>(TARIFAS_FALLBACK[0].material);
  const [items, setItems] = useState<ArteItem[]>([]);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [cotizando, setCotizando] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tarifaActual = useMemo(
    () => tarifas.find((t) => t.material === material) ?? tarifas[0],
    [tarifas, material]
  );
  const anchoPliego = tarifaActual?.ancho_pliego_cm ?? 58;

  /* Cargar tarifas reales (si existen) */
  useEffect(() => {
    document.title = "Arma tu pliego (Gang Sheet) | PrintUp";
    fetch("/api/tarifas-gang-sheet")
      .then((r) => r.json())
      .then((data: Tarifa[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTarifas(data);
          setMaterial((m) => (data.some((t) => t.material === m) ? m : data[0].material));
        }
      })
      .catch(() => {});
  }, []);

  /* Subir arte(s) */
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const valid = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    Array.from(files).forEach((file) => {
      if (!valid.includes(file.type)) {
        toast.error(`Formato no soportado: ${file.name}`);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const w = PX_TO_CM(img.naturalWidth) || 10;
        const h = PX_TO_CM(img.naturalHeight) || 10;
        setItems((prev) => [
          ...prev,
          { id: nextId(), file, previewUrl, w_cm: Math.max(1, w), h_cm: Math.max(1, h), cantidad: 1 },
        ]);
      };
      img.onerror = () => {
        setItems((prev) => [
          ...prev,
          { id: nextId(), file, previewUrl, w_cm: 10, h_cm: 10, cantidad: 1 },
        ]);
      };
      img.src = previewUrl;
    });
  }, []);

  const updateItem = (id: string, patch: Partial<ArteItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));
  const dupItem = (id: string) =>
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      return it ? [...prev, { ...it, id: nextId() }] : prev;
    });

  /* Cotización en vivo (debounce) — envía el previewUrl como arte_url para que
     el auto-acomodo devuelto pueda dibujar la imagen en la vista previa. */
  useEffect(() => {
    if (items.length === 0) {
      setCotizacion(null);
      return;
    }
    const payload = {
      material,
      ancho_pliego_cm: anchoPliego,
      items: items.map((it) => ({
        arte_url: it.previewUrl,
        w_cm: it.w_cm,
        h_cm: it.h_cm,
        cantidad: it.cantidad,
      })),
    };
    setCotizando(true);
    const t = setTimeout(() => {
      fetch("/api/cotizar/gang-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) setCotizacion(data as Cotizacion);
        })
        .catch(() => {})
        .finally(() => setCotizando(false));
    }, 350);
    return () => clearTimeout(t);
  }, [items, material, anchoPliego]);

  /* Subir un arte a GCS (firmado). Si falla, devuelve null (precio sigue válido). */
  async function uploadArte(file: File): Promise<string | null> {
    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const r = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, folderName: "gang-sheets" }),
      });
      if (!r.ok) return null;
      const { signedUrl, publicUrl } = await r.json();
      const put = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) return null;
      return publicUrl as string;
    } catch {
      return null;
    }
  }

  /* Guardar pliego + agregar al carrito */
  async function agregarAlCarrito() {
    if (items.length === 0) {
      toast.error("Agrega al menos un arte al pliego");
      return;
    }
    setSaving(true);
    try {
      // Sube los artes (best-effort) para que la OP tenga el archivo real.
      const subidos = await Promise.all(
        items.map(async (it) => ({ ...it, arte_url: it.file ? await uploadArte(it.file) : it.arte_url }))
      );
      const res = await fetch("/api/gang-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material,
          ancho_pliego_cm: anchoPliego,
          nombre: `Pliego ${material}`,
          items: subidos.map((it) => ({
            arte_url: it.arte_url || undefined,
            w_cm: it.w_cm,
            h_cm: it.h_cm,
            cantidad: it.cantidad,
          })),
        }),
      });
      if (!res.ok) {
        toast.error("No se pudo guardar el pliego");
        setSaving(false);
        return;
      }
      const row = await res.json();
      addItem({
        producto_id: row.id,
        nombre: row.nombre || `Pliego ${material}`,
        precio: Number(row.precio) || 0,
        imagen: `/api/gang-sheets/${row.id}/pliego`,
        slug: "gang-sheet",
        categoria_slug: "gang-sheet",
        variante: { gang_sheet_id: row.id },
        precio_extra: 0,
      });
      toast.success("Pliego agregado al carrito");
      router.push("/carrito");
    } catch {
      toast.error("Error de conexión");
    }
    setSaving(false);
  }

  /* Escala de la vista previa del pliego */
  const previewScale = cotizacion && cotizacion.ancho_pliego_cm > 0 ? 340 / cotizacion.ancho_pliego_cm : 6;

  return (
    <div className="mc-section min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Encabezado */}
        <Link href="/productos" className="mc-link text-sm mb-4">
          <ArrowLeft className="size-4" /> Volver a productos
        </Link>
        <div className="mb-6">
          <p className="mc-eyebrow mb-1">Self-service · DTF / Sublimación</p>
          <h1 className="mc-h2 mb-2">Arma tu pliego (Gang Sheet)</h1>
          <p className="mc-sub max-w-2xl">
            Sube tus artes, indica el tamaño real de cada uno y la app los acomoda solos en el
            pliego para aprovechar el material. El precio se calcula al instante por cm².
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Columna izquierda: material + artes */}
          <div className="space-y-5">
            {/* Material */}
            <div className="mc-panel p-4">
              <label className="mc-label">Material</label>
              <div className="flex flex-wrap gap-2">
                {tarifas.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMaterial(t.material)}
                    className="mc-tab"
                    data-active={t.material === material}
                  >
                    {t.material}
                  </button>
                ))}
              </div>
              <p className="mc-sub text-xs mt-3 flex items-center gap-1.5">
                <Ruler className="size-3.5" />
                Ancho del pliego: <strong>{anchoPliego} cm</strong> · Tarifa{" "}
                {CLP(tarifaActual?.tarifa_por_cm2 ?? 0)}/cm² · {tarifaActual?.dias_produccion} días
              </p>
            </div>

            {/* Subir arte */}
            <div
              className="mc-panel p-6 border-dashed text-center cursor-pointer hover:border-[color:var(--mc-accent)]"
              style={{ borderStyle: "dashed", borderColor: "var(--mc-line-2)" }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="size-8 mx-auto mb-2 text-[color:var(--mc-accent-ink)]" />
              <p className="text-sm font-semibold text-[color:var(--mc-ink)]">
                Arrastra tus artes o haz clic para subir
              </p>
              <p className="mc-sub text-xs mt-1">PNG, JPG, SVG o WebP · puedes subir varios</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Lista de artes */}
            {items.length > 0 && (
              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={it.id} className="mc-card p-3 flex gap-3 items-center">
                    <div className="size-16 rounded-lg border border-[color:var(--mc-line)] bg-white flex-shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.previewUrl} alt={`Arte ${idx + 1}`} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[color:var(--mc-ink)] mb-1.5">Arte {idx + 1}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-[11px] text-[color:var(--mc-ink-2)] flex items-center gap-1">
                          Ancho
                          <input
                            type="number"
                            min={1}
                            value={it.w_cm}
                            onChange={(e) => updateItem(it.id, { w_cm: Math.max(1, Number(e.target.value)) })}
                            className="mc-input w-16 px-2 py-1 text-xs"
                          />
                          cm
                        </label>
                        <label className="text-[11px] text-[color:var(--mc-ink-2)] flex items-center gap-1">
                          Alto
                          <input
                            type="number"
                            min={1}
                            value={it.h_cm}
                            onChange={(e) => updateItem(it.id, { h_cm: Math.max(1, Number(e.target.value)) })}
                            className="mc-input w-16 px-2 py-1 text-xs"
                          />
                          cm
                        </label>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            className="mc-btn mc-btn-ghost p-1.5"
                            onClick={() => updateItem(it.id, { cantidad: Math.max(1, it.cantidad - 1) })}
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm mc-price">{it.cantidad}</span>
                          <button
                            type="button"
                            className="mc-btn mc-btn-ghost p-1.5"
                            onClick={() => updateItem(it.id, { cantidad: it.cantidad + 1 })}
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" className="mc-btn mc-btn-ghost p-1.5" title="Duplicar" onClick={() => dupItem(it.id)}>
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="mc-btn mc-btn-ghost p-1.5 text-[color:var(--mc-danger)]"
                        title="Eliminar"
                        onClick={() => removeItem(it.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: vista previa + precio (sticky) */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            {/* Vista previa del pliego */}
            <div className="mc-panel p-4">
              <p className="text-xs font-semibold text-[color:var(--mc-ink)] mb-3 flex items-center gap-1.5">
                <LayoutGrid className="size-4" /> Auto-acomodo del pliego
              </p>
              {cotizacion && cotizacion.items.length > 0 ? (
                <div
                  className="relative mx-auto border border-[color:var(--mc-ink)] bg-white overflow-hidden"
                  style={{
                    width: cotizacion.ancho_pliego_cm * previewScale,
                    height: Math.max(40, cotizacion.alto_pliego_cm * previewScale),
                  }}
                >
                  {cotizacion.items.map((p, i) => (
                    <div
                      key={i}
                      className="absolute border border-[color:var(--mc-accent)] bg-[color:var(--mc-accent-soft)]/40 overflow-hidden"
                      style={{
                        left: p.x * previewScale,
                        top: p.y * previewScale,
                        width: p.w_cm * previewScale,
                        height: p.h_cm * previewScale,
                      }}
                    >
                      {p.arte_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.arte_url} alt="" className="w-full h-full object-contain" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-center mc-sub text-xs border border-dashed border-[color:var(--mc-line-2)] rounded-lg">
                  Sube artes para ver el acomodo
                </div>
              )}
              {cotizacion && cotizacion.items.length > 0 && (
                <p className="mc-sub text-[11px] mt-2 text-center">
                  Pliego {cotizacion.ancho_pliego_cm}×{cotizacion.alto_pliego_cm} cm ·{" "}
                  Aprovechamiento {cotizacion.desglose.eficiencia_pct}%
                </p>
              )}
            </div>

            {/* Precio */}
            <div className="mc-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="mc-sub text-sm">Precio del pliego</span>
                {cotizando && <Loader2 className="size-4 animate-spin text-[color:var(--mc-ink-3)]" />}
              </div>
              <p className="mc-price text-3xl font-extrabold text-[color:var(--mc-ink)] mb-3">
                {cotizacion ? CLP(cotizacion.precio) : "—"}
              </p>

              {cotizacion && (
                <div className="space-y-1 text-xs mc-sub border-t border-[color:var(--mc-line)] pt-3">
                  <Row label={`Área usada`} value={`${cotizacion.area_usada_cm2} cm²`} />
                  <Row label={`Área cobrada (+merma)`} value={`${cotizacion.desglose.area_cobrada_cm2} cm²`} />
                  <Row
                    label={`Subtotal (${CLP(cotizacion.desglose.tarifa_por_cm2)}/cm²)`}
                    value={CLP(cotizacion.desglose.subtotal)}
                  />
                  {cotizacion.desglose.tramo_descuento_pct > 0 && (
                    <Row
                      label={`Descuento por tamaño (${cotizacion.desglose.tramo_descuento_pct}%)`}
                      value={`- ${CLP(cotizacion.desglose.descuento)}`}
                    />
                  )}
                  <Row label="Plazo" value={`${cotizacion.desglose.dias_produccion} días hábiles`} />
                </div>
              )}

              <button
                type="button"
                disabled={saving || items.length === 0}
                onClick={agregarAlCarrito}
                className="mc-btn mc-btn-primary w-full mt-4"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
                {saving ? "Guardando…" : "Agregar al carrito"}
              </button>

              {cotizacion?.desglose.tarifa_por_defecto && (
                <p className="mc-sub text-[11px] mt-2 flex items-start gap-1">
                  <Info className="size-3.5 flex-shrink-0 mt-0.5" />
                  Usando tarifa de referencia (configura las tarifas reales en el admin).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="mc-price text-[color:var(--mc-ink)]">{value}</span>
    </div>
  );
}
