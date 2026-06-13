"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { formatCLP } from "@/lib/format";

/**
 * Configurador por m² — la herramienta ES la ficha.
 *
 * Preview a escala real con silueta humana (1,70 m) para que el cliente VEA
 * lo que significa su medida antes de pagar, presets de medidas estándar,
 * validación inmediata contra el ancho imprimible del rollo y precio total
 * en vivo con desglose. Reutiliza la misma matemática del taller que
 * `price-calculator.tsx` (nesting por filas + área mínima facturable).
 */

export interface ConfiguracionM2 {
  ancho: number;
  alto: number;
  cantidad: number;
  material: string;
  terminaciones: string[];
  areaFacturada: number;
  total: number;
}

interface ConfiguradorM2Props {
  precioM2: number;
  anchoMaxCm?: number;
  areaMinCm2?: number;
  materiales?: { nombre: string; multiplicador: number }[];
  acabados?: { nombre: string; precioExtra: number }[];
  productoNombre: string;
  /** Producto que se exhibe parado (roller, pendón): activa la silueta humana */
  vertical?: boolean;
  onAddToCart?: (config: ConfiguracionM2) => void;
}

const SEPARACION_CM = 3;

const PRESETS_VERTICAL = [
  { ancho: 60, alto: 160 },
  { ancho: 80, alto: 200 },
  { ancho: 85, alto: 200 },
  { ancho: 100, alto: 200 },
  { ancho: 150, alto: 200 },
];

const PRESETS_HORIZONTAL = [
  { ancho: 100, alto: 70 },
  { ancho: 150, alto: 100 },
  { ancho: 200, alto: 100 },
  { ancho: 300, alto: 150 },
];

// Misma matemática que price-calculator.tsx, para una gráfica repetida N veces
function calcular(
  w: number,
  h: number,
  qty: number,
  printableWidth: number,
  areaMinCm2: number,
  precioM2: number,
  multiplicador: number,
  extraTerminacionesM2: number,
) {
  if (w <= 0 || h <= 0 || qty <= 0) return null;

  const perRow = Math.max(1, Math.floor((printableWidth + SEPARACION_CM) / (w + SEPARACION_CM)));
  const rows = Math.ceil(qty / perRow);
  const totalLength = SEPARACION_CM + rows * (h + SEPARACION_CM);

  const graphicArea = (w * h * qty) / 10000; // m²
  const printableArea = (printableWidth / 100) * (totalLength / 100);
  const areaMin = areaMinCm2 / 10000;

  const cobraMinimo = graphicArea > 0 && graphicArea < areaMin;
  const areaFacturada = cobraMinimo ? areaMin : printableArea;

  const base = areaFacturada * precioM2 * multiplicador;
  const terminaciones = extraTerminacionesM2 * areaFacturada;
  const total = Math.ceil((base + terminaciones) / 100) * 100;

  return { graphicArea, areaFacturada, cobraMinimo, base, terminaciones, total };
}

// ─── Preview a escala con silueta humana ─────────────────────────
function PreviewEscala({
  w,
  h,
  cantidad,
  vertical,
  error,
  diseno,
}: {
  w: number;
  h: number;
  cantidad: number;
  vertical: boolean;
  error: boolean;
  diseno?: string | null;
}) {
  const ALTURA_PERSONA = 170; // cm

  const validW = w > 0 ? w : 80;
  const validH = h > 0 ? h : 200;

  // Escena en cm → escala a un lienzo de ~420×400
  const gap = vertical ? 36 : 0;
  const sceneW = validW + (vertical ? gap + 52 : 0) + 40;
  const sceneH = Math.max(validH, vertical ? ALTURA_PERSONA : 0) + 56;
  const S = Math.min(420 / sceneW, 380 / sceneH);

  const pad = 20 * S;
  const groundY = 14 + Math.max(validH, vertical ? ALTURA_PERSONA : 0) * S;

  const pw = validW * S;
  const ph = validH * S;
  const px = pad;
  const py = groundY - ph;

  // Silueta humana minimalista, 170 cm a escala
  const sh = ALTURA_PERSONA * S;
  const sx = px + pw + gap * S;
  const headR = sh * 0.075;

  const svgW = sx + (vertical ? 52 * S : 0) + pad + 8;
  const svgH = groundY + 42;

  const trans = { transition: "all .25s ease" } as const;

  return (
    <div className="rounded-2xl border p-5 md:p-6 h-full flex flex-col" style={{ borderColor: "var(--mc-line)", background: "var(--mc-surface)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="mc-tech text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--mc-ink-2)" }}>
          Vista a escala real
        </span>
        {vertical && (
          <span className="mc-tech text-[11px]" style={{ color: "var(--mc-ink-3)" }}>
            silueta: persona de 1,70 m
          </span>
        )}
      </div>

      <div className="flex-1 flex items-end justify-center">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[440px]" role="img" aria-label={`Vista a escala: ${validW} por ${validH} centímetros`}>
          {/* Pendón / gráfica */}
          <g style={trans}>
            <rect
              x={px}
              y={py}
              width={pw}
              height={ph}
              fill="#fff"
              stroke={error ? "var(--mc-danger)" : "var(--mc-ink)"}
              strokeWidth={1.5}
              style={trans}
            />
            {diseno ? (
              /* El diseño real del cliente, estirado a la medida elegida */
              <image
                href={diseno}
                x={px + 1}
                y={py + 1}
                width={Math.max(pw - 2, 1)}
                height={Math.max(ph - 2, 1)}
                preserveAspectRatio="xMidYMid slice"
                style={trans}
              />
            ) : (
              <>
                {/* Diagonales de "área de diseño" */}
                <line x1={px} y1={py} x2={px + pw} y2={py + ph} stroke="var(--mc-line-2)" strokeWidth={1} style={trans} />
                <line x1={px + pw} y1={py} x2={px} y2={py + ph} stroke="var(--mc-line-2)" strokeWidth={1} style={trans} />
                <text
                  x={px + pw / 2}
                  y={py + ph / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--mc-ink-2)"
                  style={{ ...trans, font: "600 11px ui-monospace, monospace", paintOrder: "stroke", stroke: "#fff", strokeWidth: 4 }}
                >
                  TU DISEÑO
                </text>
              </>
            )}
            <rect
              x={px}
              y={py}
              width={pw}
              height={ph}
              fill="none"
              stroke={error ? "var(--mc-danger)" : "var(--mc-ink)"}
              strokeWidth={1.5}
              style={trans}
            />
            {/* Base del roller */}
            {vertical && (
              <rect x={px - 6} y={groundY} width={pw + 12} height={5} rx={2} fill="var(--mc-ink)" style={trans} />
            )}
            {cantidad > 1 && (
              <g style={trans}>
                <rect x={px + pw - 34} y={py + 8} width={28} height={18} rx={4} fill="var(--mc-ink)" />
                <text x={px + pw - 20} y={py + 17} textAnchor="middle" dominantBaseline="middle" fill="#fff" style={{ font: "700 10px ui-monospace, monospace" }}>
                  ×{cantidad}
                </text>
              </g>
            )}
          </g>

          {/* Silueta humana */}
          {vertical && (
            <g fill="var(--mc-ink-3)" style={trans}>
              <circle cx={sx + sh * 0.14} cy={groundY - sh + headR} r={headR} />
              {/* torso + piernas como cápsulas simples */}
              <rect x={sx + sh * 0.14 - sh * 0.085} y={groundY - sh + headR * 2.3} width={sh * 0.17} height={sh * 0.42} rx={sh * 0.08} />
              <rect x={sx + sh * 0.14 - sh * 0.075} y={groundY - sh * 0.42} width={sh * 0.062} height={sh * 0.42} rx={sh * 0.03} />
              <rect x={sx + sh * 0.14 + sh * 0.013} y={groundY - sh * 0.42} width={sh * 0.062} height={sh * 0.42} rx={sh * 0.03} />
            </g>
          )}

          {/* Línea de piso */}
          <line x1={4} y1={groundY + 5.5} x2={svgW - 4} y2={groundY + 5.5} stroke="var(--mc-line-2)" strokeWidth={1} />

          {/* Cota de ancho */}
          <g stroke="var(--mc-ink-2)" strokeWidth={1} style={trans}>
            <line x1={px} y1={groundY + 22} x2={px + pw} y2={groundY + 22} />
            <line x1={px} y1={groundY + 17} x2={px} y2={groundY + 27} />
            <line x1={px + pw} y1={groundY + 17} x2={px + pw} y2={groundY + 27} />
          </g>
          <text
            x={px + pw / 2}
            y={groundY + 36}
            textAnchor="middle"
            fill="var(--mc-ink)"
            style={{ ...trans, font: "600 11px ui-monospace, monospace" }}
          >
            {validW} cm
          </text>

          {/* Cota de alto */}
          <g stroke="var(--mc-ink-2)" strokeWidth={1} style={trans}>
            <line x1={px - 10} y1={py} x2={px - 10} y2={groundY} />
            <line x1={px - 14.5} y1={py} x2={px - 5.5} y2={py} />
            <line x1={px - 14.5} y1={groundY} x2={px - 5.5} y2={groundY} />
          </g>
          <text
            x={px - 17}
            y={py + ph / 2}
            textAnchor="middle"
            fill="var(--mc-ink)"
            transform={`rotate(-90 ${px - 17} ${py + ph / 2})`}
            style={{ ...trans, font: "600 11px ui-monospace, monospace" }}
          >
            {validH} cm
          </text>
        </svg>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────
export function ConfiguradorM2({
  precioM2,
  anchoMaxCm = 300,
  areaMinCm2 = 900,
  materiales = [],
  acabados = [],
  productoNombre,
  vertical = false,
  onAddToCart,
}: ConfiguradorM2Props) {
  const presets = (vertical ? PRESETS_VERTICAL : PRESETS_HORIZONTAL).filter(
    (p) => p.ancho <= anchoMaxCm,
  );
  const inicial = presets[Math.min(1, Math.max(presets.length - 1, 0))] ?? { ancho: Math.min(80, anchoMaxCm), alto: 200 };

  const [anchoCm, setAnchoCm] = useState(String(inicial.ancho));
  // Por defecto compacto (≤100 cm de alto): 200 se ve alargado de entrada.
  const [altoCm, setAltoCm] = useState(String(Math.min(inicial.alto, 100)));
  const [cantidad, setCantidad] = useState(1);
  const [material, setMaterial] = useState(materiales[0]?.nombre || "");
  const [terminaciones, setTerminaciones] = useState<string[]>([]);
  const [diseno, setDiseno] = useState<string | null>(null);
  const disenoInputRef = useRef<HTMLInputElement>(null);

  const cargarDiseno = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setDiseno((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const w = parseFloat(anchoCm) || 0;
  const h = parseFloat(altoCm) || 0;

  const multiplicador = materiales.find((m) => m.nombre === material)?.multiplicador || 1;
  const extraTerminacionesM2 = useMemo(
    () => acabados.filter((a) => terminaciones.includes(a.nombre)).reduce((s, a) => s + a.precioExtra, 0),
    [acabados, terminaciones],
  );

  const excedeAncho = w > anchoMaxCm;
  const calculo = useMemo(
    () => (excedeAncho ? null : calcular(w, h, cantidad, anchoMaxCm, areaMinCm2, precioM2, multiplicador, extraTerminacionesM2)),
    [w, h, cantidad, anchoMaxCm, areaMinCm2, precioM2, multiplicador, extraTerminacionesM2, excedeAncho],
  );

  const esPreset = (p: { ancho: number; alto: number }) => p.ancho === w && p.alto === h;

  const toggleTerminacion = (nombre: string) =>
    setTerminaciones((prev) => (prev.includes(nombre) ? prev.filter((t) => t !== nombre) : [...prev, nombre]));

  const whatsappMsg = encodeURIComponent(
    `Hola PrintUp! Quiero ${productoNombre}:\n- Medida: ${w || "?"} × ${h || "?"} cm\n- Cantidad: ${cantidad}` +
      (material ? `\n- Material: ${material}` : "") +
      (terminaciones.length ? `\n- Terminaciones: ${terminaciones.join(", ")}` : "") +
      (calculo ? `\n- Total estimado: ${formatCLP(calculo.total)}` : ""),
  );

  const agregarAlCarrito = () => {
    if (!calculo || !onAddToCart) return;
    onAddToCart({
      ancho: w,
      alto: h,
      cantidad,
      material,
      terminaciones,
      areaFacturada: calculo.areaFacturada,
      total: calculo.total,
    });
  };

  return (
    <section id="configurador" className="grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-10 items-stretch">
      {/* Preview a escala */}
      <div className="flex flex-col gap-3">
        <PreviewEscala w={w} h={h} cantidad={cantidad} vertical={vertical} error={excedeAncho} diseno={diseno} />
        <div className="flex items-center gap-2">
          <input
            ref={disenoInputRef}
            type="file"
            accept="image/*"
            onChange={cargarDiseno}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => disenoInputRef.current?.click()}
            className="mc-btn mc-btn-ghost flex-1 gap-2 text-sm"
          >
            <ImagePlus className="size-4" />
            {diseno ? "Cambiar mi diseño" : "Sube tu diseño y míralo a escala"}
          </button>
          {diseno && (
            <button
              type="button"
              aria-label="Quitar diseño"
              onClick={() => {
                URL.revokeObjectURL(diseno);
                setDiseno(null);
              }}
              className="mc-btn mc-btn-ghost px-3"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controles + precio */}
      <div className="flex flex-col">
        {/* Medidas */}
        <div>
          <p className="mc-tech text-[11px] uppercase tracking-[0.12em] mb-2.5" style={{ color: "var(--mc-ink-2)" }}>
            Medida (ancho × alto)
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {presets.map((p) => (
              <button
                key={`${p.ancho}x${p.alto}`}
                onClick={() => {
                  setAnchoCm(String(p.ancho));
                  setAltoCm(String(p.alto));
                }}
                className="mc-tech px-3.5 py-2 rounded-lg text-[13px] font-semibold border transition-colors"
                style={
                  esPreset(p)
                    ? { background: "var(--mc-ink)", color: "#fff", borderColor: "var(--mc-ink)" }
                    : { background: "#fff", color: "var(--mc-ink-2)", borderColor: "var(--mc-line-2)" }
                }
              >
                {p.ancho} × {p.alto}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2 max-w-sm">
            <div>
              <label htmlFor="cfg-ancho" className="mc-label">Ancho (cm)</label>
              <input
                id="cfg-ancho"
                type="number"
                min={1}
                max={999}
                value={anchoCm}
                onChange={(e) => setAnchoCm(e.target.value)}
                className="mc-input mc-tech"
              />
            </div>
            <span className="pb-2.5 text-sm" style={{ color: "var(--mc-ink-3)" }}>×</span>
            <div>
              <label htmlFor="cfg-alto" className="mc-label">Alto (cm)</label>
              <input
                id="cfg-alto"
                type="number"
                min={1}
                max={9999}
                value={altoCm}
                onChange={(e) => setAltoCm(e.target.value)}
                className="mc-input mc-tech"
              />
            </div>
            <div className="pl-2">
              <label className="mc-label" htmlFor="cfg-cantidad">Cantidad</label>
              <div className="flex items-center rounded-[10px] border bg-white" style={{ borderColor: "var(--mc-line-2)" }}>
                <button
                  aria-label="Quitar una unidad"
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="px-2.5 py-2.5 hover:bg-[#fafafb]"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="mc-tech min-w-7 text-center text-sm font-semibold">{cantidad}</span>
                <button
                  aria-label="Agregar una unidad"
                  onClick={() => setCantidad((c) => Math.min(99, c + 1))}
                  className="px-2.5 py-2.5 hover:bg-[#fafafb]"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Validación en vivo, en el momento y en cristiano */}
          {excedeAncho && (
            <p className="mt-3 text-[13px] font-medium rounded-lg border px-3 py-2" style={{ color: "var(--mc-danger)", borderColor: "#fecdd3", background: "#fff1f2" }}>
              El ancho máximo imprimible es {anchoMaxCm} cm. Prueba girar la medida ({h > 0 ? `${h} × ${w}` : "alto × ancho"}) o escríbenos para imprimir con empalme.
            </p>
          )}
          {!excedeAncho && calculo?.cobraMinimo && (
            <p className="mt-3 text-[13px] rounded-lg border px-3 py-2" style={{ color: "var(--mc-warn)", borderColor: "#fed7aa", background: "var(--mc-warn-soft)" }}>
              Tu medida es menor al área mínima de impresión ({(areaMinCm2 / 10000).toLocaleString("es-CL")} m²): se cobra el mínimo.
            </p>
          )}
        </div>

        {/* Material */}
        {materiales.length > 0 && (
          <div className="mt-5">
            <label htmlFor="cfg-material" className="mc-tech text-[11px] uppercase tracking-[0.12em] block mb-2" style={{ color: "var(--mc-ink-2)" }}>
              Material
            </label>
            <select
              id="cfg-material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="mc-select max-w-sm"
            >
              {materiales.map((m) => (
                <option key={m.nombre} value={m.nombre}>
                  {m.nombre}{m.multiplicador !== 1 ? ` (×${m.multiplicador})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Terminaciones */}
        {acabados.length > 0 && (
          <div className="mt-5">
            <p className="mc-tech text-[11px] uppercase tracking-[0.12em] mb-2" style={{ color: "var(--mc-ink-2)" }}>
              Terminaciones
            </p>
            <div className="flex flex-wrap gap-2">
              {acabados.map((a) => {
                const active = terminaciones.includes(a.nombre);
                return (
                  <button
                    key={a.nombre}
                    onClick={() => toggleTerminacion(a.nombre)}
                    className="px-3.5 py-2 rounded-lg text-[13px] font-medium border transition-colors"
                    style={
                      active
                        ? { background: "var(--mc-accent-soft)", color: "var(--mc-accent-ink)", borderColor: "var(--mc-accent)" }
                        : { background: "#fff", color: "var(--mc-ink-2)", borderColor: "var(--mc-line-2)" }
                    }
                  >
                    {a.nombre} <span className="mc-tech">+{formatCLP(a.precioExtra)}/m²</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Precio en vivo */}
        <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--mc-line)" }}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="mc-tech text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--mc-ink-2)" }}>
              Total
            </span>
            <span className="mc-tech text-4xl font-bold" style={{ color: "var(--mc-ink)" }}>
              {calculo ? formatCLP(calculo.total) : "—"}
            </span>
          </div>
          <div className="mc-tech mt-2 text-[12px] leading-relaxed" style={{ color: "var(--mc-ink-2)" }}>
            {calculo ? (
              <>
                {calculo.areaFacturada.toLocaleString("es-CL", { maximumFractionDigits: 2 })} m² × {formatCLP(precioM2)}/m²
                {multiplicador !== 1 && <> · material ×{multiplicador}</>}
                {calculo.terminaciones > 0 && <> · terminaciones {formatCLP(Math.round(calculo.terminaciones))}</>}
              </>
            ) : (
              "Ingresa tus medidas para calcular el precio."
            )}
          </div>
          <p className="text-[12px] mt-1.5" style={{ color: "var(--mc-ink-3)" }}>
            IVA incluido. Si tu archivo necesita ajustes te avisamos antes de imprimir.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
            <button
              onClick={agregarAlCarrito}
              disabled={!calculo}
              className="mc-btn mc-btn-primary flex-1"
            >
              <ShoppingCart className="size-4" />
              Agregar al carrito
            </button>
            <a
              href={`https://wa.me/56966126645?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mc-btn mc-btn-ghost flex-1"
            >
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
