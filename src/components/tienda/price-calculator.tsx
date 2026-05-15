"use client";

import { useState, useMemo, useRef } from "react";
import {
  Calculator, AlertTriangle, Info, Ruler, MessageCircle, Upload,
  User, Mail, Phone, FileText, CheckCircle, X, Send, Plus, Trash2,
  Settings, Layers, Eye, Maximize2, ChevronDown, ChevronUp,
} from "lucide-react";
import { formatCLP } from "@/lib/format";
import { toast } from "sonner";

interface PriceCalculatorProps {
  precioM2: number;
  anchoMaxCm?: number;
  altoMaxCm?: number;
  areaMinCm2?: number;
  materiales?: { nombre: string; multiplicador: number }[];
  acabados?: { nombre: string; precioExtra: number }[];
  productoNombre: string;
  onAddToCart?: (data: { ancho: number; alto: number; material: string; acabado: string; precio: number; area: number }) => void;
}

interface Grafica {
  id: number;
  anchoCm: string;
  altoCm: string;
  cantidad: number;
}

// ─── Pano Visualization ──────────────────────────────────────────
function PanoVisualization({
  graficas,
  printableWidth,
  rollWidth,
  separacion,
  nesting,
}: {
  graficas: Grafica[];
  printableWidth: number;
  rollWidth: number;
  separacion: number;
  nesting: NestingResult;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!nesting.valid) return null;

  // Scale: 1cm = X px. Fit within ~320px wide container
  const maxDisplayW = 320;
  const scale = maxDisplayW / rollWidth;
  const displayRollW = rollWidth * scale;
  const displayPrintW = printableWidth * scale;
  const marginSide = ((rollWidth - printableWidth) / 2) * scale;

  // Build graphic rectangles for visualization
  const rects: { x: number; y: number; w: number; h: number; label: string; color: string }[] = [];
  const colors = ["#00B4D8", "#8b5cf6", "#F97316", "#10b981", "#E91E8C", "#f59e0b"];
  let currentY = separacion;

  nesting.graficaDetails.forEach((detail, gi) => {
    const g = graficas[gi];
    if (!g) return;
    const gw = parseFloat(g.anchoCm) || 0;
    const gh = parseFloat(g.altoCm) || 0;
    if (gw <= 0 || gh <= 0) return;
    const color = colors[gi % colors.length];

    let placed = 0;
    for (let row = 0; row < detail.rows && placed < g.cantidad; row++) {
      let xPos = separacion;
      for (let col = 0; col < detail.perRow && placed < g.cantidad; col++) {
        rects.push({
          x: marginSide + xPos * scale,
          y: currentY * scale,
          w: gw * scale,
          h: gh * scale,
          label: `G${gi + 1}`,
          color,
        });
        xPos += gw + separacion;
        placed++;
      }
      currentY += gh + separacion;
    }
  });

  const displayH = Math.max(nesting.totalLength * scale, 60);

  return (
    <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B2A6B] to-[#00355a] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-[#00B4D8]" />
          <span className="text-xs font-bold text-white">Vista de pano del trabajo</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-[#00B4D8] hover:text-white transition-colors flex items-center gap-1"
        >
          <Maximize2 className="size-3" />
          {expanded ? "Reducir" : "Ver pano completo"}
        </button>
      </div>

      {/* Visualization */}
      <div className={`bg-[#F8FAFC] p-4 transition-all ${expanded ? "" : "max-h-[250px] overflow-hidden"}`}>
        {/* Dimension label top */}
        <div className="flex items-center justify-center mb-2">
          <div className="flex items-center gap-1 text-[10px] text-[#64748B]">
            <div className="w-6 h-px bg-[#64748B]" />
            <span className="font-semibold">Ancho imprimible: {(printableWidth / 100).toFixed(2)} m</span>
            <div className="w-6 h-px bg-[#64748B]" />
          </div>
        </div>

        <div className="flex items-start gap-2">
          {/* Pano SVG */}
          <div className="flex-1 flex justify-center">
            <svg
              width={displayRollW}
              height={displayH}
              viewBox={`0 0 ${displayRollW} ${displayH}`}
              className="border border-[#CBD5E1] rounded bg-white"
              style={{ maxWidth: "100%" }}
            >
              {/* Roll background */}
              <rect x={0} y={0} width={displayRollW} height={displayH} fill="#F1F5F9" />

              {/* Printable area */}
              <rect
                x={marginSide}
                y={0}
                width={displayPrintW}
                height={displayH}
                fill="white"
                stroke="#CBD5E1"
                strokeWidth={0.5}
                strokeDasharray="4 2"
              />

              {/* Graphic rectangles */}
              {rects.map((r, i) => (
                <g key={i}>
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill={r.color}
                    fillOpacity={0.15}
                    stroke={r.color}
                    strokeWidth={1.5}
                    rx={2}
                  />
                  <text
                    x={r.x + r.w / 2}
                    y={r.y + r.h / 2 + 4}
                    textAnchor="middle"
                    fontSize={Math.min(r.w * 0.25, 14)}
                    fontWeight="bold"
                    fill={r.color}
                  >
                    {r.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Side dimension label */}
          <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: displayH }}>
            <div className="h-4 w-px bg-[#64748B]" />
            <span className="text-[9px] text-[#64748B] font-semibold whitespace-nowrap [writing-mode:vertical-lr] rotate-180 py-1">
              {(nesting.totalLength / 100).toFixed(2)} m
            </span>
            <div className="h-4 w-px bg-[#64748B]" />
          </div>
        </div>

        {/* Nesting details text */}
        <div className="mt-3 p-2.5 bg-[#EFF6FF] rounded-lg border border-[#DBEAFE]">
          <p className="text-[10px] text-[#475569] leading-relaxed">
            Pano calculado: rollo fisico {(rollWidth / 100).toFixed(2)} m, ancho imprimible {(printableWidth / 100).toFixed(2)} m,
            largo a imprimir {(nesting.totalLength / 100).toFixed(2)} m,
            separacion {separacion} cm,{" "}
            {nesting.totalGraficas} grafica{nesting.totalGraficas > 1 ? "s" : ""},
            aprovechamiento aprox. {nesting.utilization}%,
            area fisica de pano {nesting.physicalArea.toFixed(2)} m².{" "}
            <span className="font-semibold">Area imprimible calculada: {nesting.printableArea.toFixed(2)} m².</span>
          </p>
        </div>
        <p className="text-[9px] text-[#94A3B8] mt-1.5">
          Separacion entre piezas y bordes usada: {separacion} cm (default global).
        </p>
      </div>
    </div>
  );
}

// ─── Nesting Calculation ──────────────────────────────────────────
interface GraficaDetail {
  perRow: number;
  rows: number;
  lengthCm: number;
}

interface NestingResult {
  valid: boolean;
  graficaDetails: GraficaDetail[];
  totalLength: number;
  totalGraficas: number;
  physicalArea: number;
  printableArea: number;
  utilization: number;
  graphicArea: number;
  errors: string[];
  warnings: string[];
}

function calculateNesting(
  graficas: Grafica[],
  printableWidth: number,
  rollWidth: number,
  separacion: number,
  areaMinCm2: number,
): NestingResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const graficaDetails: GraficaDetail[] = [];
  let totalLength = separacion; // top margin
  let totalGraficas = 0;
  let graphicAreaTotal = 0;

  const validGraficas = graficas.filter((g) => {
    const w = parseFloat(g.anchoCm) || 0;
    const h = parseFloat(g.altoCm) || 0;
    return w > 0 && h > 0;
  });

  if (validGraficas.length === 0) {
    return { valid: false, graficaDetails: [], totalLength: 0, totalGraficas: 0, physicalArea: 0, printableArea: 0, utilization: 0, graphicArea: 0, errors: [], warnings: [] };
  }

  for (let i = 0; i < validGraficas.length; i++) {
    const g = validGraficas[i];
    const gw = parseFloat(g.anchoCm) || 0;
    const gh = parseFloat(g.altoCm) || 0;

    if (gw > printableWidth) {
      errors.push(`Grafica ${i + 1}: ancho ${gw}cm excede el ancho imprimible ${printableWidth}cm. Requiere empalme o reducir medida.`);
    }

    const perRow = Math.max(1, Math.floor((printableWidth + separacion) / (gw + separacion)));
    const rows = Math.ceil(g.cantidad / perRow);
    const lengthCm = rows * (gh + separacion);

    graficaDetails.push({ perRow, rows, lengthCm });
    totalLength += lengthCm;
    totalGraficas += g.cantidad;
    graphicAreaTotal += (gw * gh * g.cantidad);
  }

  const physicalArea = (rollWidth / 100) * (totalLength / 100);
  const printableArea = (printableWidth / 100) * (totalLength / 100);
  const utilization = physicalArea > 0 ? Math.round((graphicAreaTotal / 10000) / physicalArea * 100) : 0;

  // Check minimum area
  if (graphicAreaTotal < areaMinCm2 && graphicAreaTotal > 0) {
    warnings.push(`Area total ${(graphicAreaTotal / 10000).toFixed(2)} m² es menor al minimo ${(areaMinCm2 / 10000).toFixed(2)} m². Se cobra el area minima.`);
  }

  return {
    valid: errors.length === 0 && validGraficas.length > 0,
    graficaDetails,
    totalLength,
    totalGraficas,
    physicalArea,
    printableArea,
    utilization,
    graphicArea: graphicAreaTotal / 10000,
    errors,
    warnings,
  };
}

// ─── Main Component ──────────────────────────────────────────────
export function PriceCalculator({
  precioM2,
  anchoMaxCm = 300,
  altoMaxCm = 0,
  areaMinCm2 = 900,
  materiales = [],
  acabados = [],
  productoNombre,
  onAddToCart,
}: PriceCalculatorProps) {
  // Graphics
  const [graficas, setGraficas] = useState<Grafica[]>([
    { id: 1, anchoCm: "", altoCm: "", cantidad: 1 },
  ]);
  const nextId = useRef(2);

  // Material
  const [material, setMaterial] = useState(materiales[0]?.nombre || "Estandar");

  // Terminaciones (multiple selection via checkboxes)
  const [selectedTerminaciones, setSelectedTerminaciones] = useState<string[]>([]);

  // Options
  const [separacion, setSeparacion] = useState(3);
  const [showOptions, setShowOptions] = useState(false);
  const [showSepEdit, setShowSepEdit] = useState(false);

  // Quotation form state
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteNombre, setQuoteNombre] = useState("");
  const [quoteEmail, setQuoteEmail] = useState("");
  const [quoteTelefono, setQuoteTelefono] = useState("");
  const [quoteNotas, setQuoteNotas] = useState("");
  const [quoteTipoDoc, setQuoteTipoDoc] = useState<"boleta" | "factura">("boleta");
  const [quoteFiles, setQuoteFiles] = useState<File[]>([]);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived values
  const rollWidth = anchoMaxCm + 10; // physical roll width
  const printableWidth = anchoMaxCm;

  const selectedMaterial = materiales.find((m) => m.nombre === material);
  const multiplicador = selectedMaterial?.multiplicador || 1;

  const terminacionesExtra = useMemo(() => {
    return acabados
      .filter((a) => selectedTerminaciones.includes(a.nombre))
      .reduce((sum, a) => sum + a.precioExtra, 0);
  }, [acabados, selectedTerminaciones]);

  // Nesting calculation
  const nesting = useMemo(() => {
    return calculateNesting(graficas, printableWidth, rollWidth, separacion, areaMinCm2);
  }, [graficas, printableWidth, rollWidth, separacion, areaMinCm2]);

  // Price calculation
  const calculo = useMemo(() => {
    if (!nesting.valid || nesting.graphicArea <= 0) return null;

    const effectiveArea = nesting.graphicArea < (areaMinCm2 / 10000)
      ? areaMinCm2 / 10000
      : nesting.printableArea;

    const precioBase = effectiveArea * precioM2 * multiplicador;
    const precioTerminaciones = terminacionesExtra * effectiveArea;
    const total = Math.ceil((precioBase + precioTerminaciones) / 100) * 100;

    return {
      effectiveArea,
      precioBase,
      precioTerminaciones,
      total,
    };
  }, [nesting, precioM2, multiplicador, terminacionesExtra, areaMinCm2]);

  // Graphic management
  const addGrafica = () => {
    if (graficas.length >= 20) return;
    setGraficas((prev) => [...prev, { id: nextId.current++, anchoCm: "", altoCm: "", cantidad: 1 }]);
  };

  const removeGrafica = (id: number) => {
    if (graficas.length <= 1) return;
    setGraficas((prev) => prev.filter((g) => g.id !== id));
  };

  const updateGrafica = (id: number, field: keyof Grafica, value: string | number) => {
    setGraficas((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const toggleTerminacion = (nombre: string) => {
    setSelectedTerminaciones((prev) =>
      prev.includes(nombre)
        ? prev.filter((t) => t !== nombre)
        : [...prev, nombre]
    );
  };

  // WhatsApp
  const handleWhatsApp = () => {
    if (!calculo) return;
    const graficasText = graficas
      .filter((g) => (parseFloat(g.anchoCm) || 0) > 0 && (parseFloat(g.altoCm) || 0) > 0)
      .map((g, i) => `  G${i + 1}: ${g.anchoCm}cm x ${g.altoCm}cm x${g.cantidad}`)
      .join("\n");

    const lines = [
      `Hola PrintUp! Quiero cotizar:`,
      ``,
      `Producto: ${productoNombre}`,
      `Graficas:`,
      graficasText,
      ...(materiales.length > 0 ? [`Material: ${material}`] : []),
      ...(selectedTerminaciones.length > 0 ? [`Terminaciones: ${selectedTerminaciones.join(", ")}`] : []),
      `Area: ${nesting.printableArea.toFixed(2)} m²`,
      `Precio estimado: ${formatCLP(calculo.total)}`,
    ];
    window.open(
      `https://wa.me/56966126645?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank"
    );
  };

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 25 * 1024 * 1024;
    const valid = files.filter((f) => f.size <= maxSize);
    if (valid.length < files.length) toast.error("Algunos archivos superan 25MB y fueron descartados");
    setQuoteFiles((prev) => [...prev, ...valid].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => setQuoteFiles((prev) => prev.filter((_, i) => i !== index));

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Submit quote
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculo || !quoteNombre.trim() || !quoteEmail.trim()) return;
    setQuoteSending(true);
    try {
      const folderName = `cotizacion-${productoNombre.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      const uploadedFiles: { nombre: string; tamaño: number; tipo: string; url: string }[] = [];

      for (const file of quoteFiles) {
        try {
          const urlRes = await fetch("/api/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: file.name, folderName, contentType: file.type }),
          });
          if (!urlRes.ok) continue;
          const { signedUrl, token, publicUrl } = await urlRes.json();
          await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type, "x-upsert": "true", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: file,
          });
          uploadedFiles.push({ nombre: file.name, tamaño: file.size, tipo: file.type, url: publicUrl || "" });
        } catch { /* skip */ }
      }

      const graficasText = graficas
        .filter((g) => (parseFloat(g.anchoCm) || 0) > 0 && (parseFloat(g.altoCm) || 0) > 0)
        .map((g, i) => `G${i + 1}: ${g.anchoCm}x${g.altoCm}cm x${g.cantidad}`)
        .join(" | ");

      await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: quoteNombre.trim(),
          email: quoteEmail.trim(),
          telefono: quoteTelefono.trim() || null,
          material: `${productoNombre} | ${graficasText} | ${material} | ${selectedTerminaciones.join(", ") || "Sin terminacion"} | ${quoteTipoDoc}`,
          mensaje: `Cotizacion desde calculadora.\n\nProducto: ${productoNombre}\nGraficas: ${graficasText}\nMaterial: ${material}\nTerminaciones: ${selectedTerminaciones.join(", ") || "Ninguna"}\nArea: ${nesting.printableArea.toFixed(2)} m²\nPrecio estimado: ${formatCLP(calculo.total)}\nDocumento: ${quoteTipoDoc === "factura" ? "Factura" : "Boleta"}\n\nNotas: ${quoteNotas || "Sin notas"}`,
          archivos: uploadedFiles,
          folderName,
        }),
      });

      setQuoteSent(true);
      toast.success("Cotizacion enviada!");
    } catch {
      toast.error("Error al enviar. Intenta por WhatsApp.");
    } finally {
      setQuoteSending(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ━━━ HEADER ━━━ */}
      <div className="rounded-xl border-2 border-[#00B4D8]/30 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B2A6B] to-[#00355a] px-5 py-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-[#00B4D8]/20 flex items-center justify-center">
              <Calculator className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Configura tu trabajo</h3>
              <p className="text-[11px] text-white/60 leading-snug">
                Primero define medidas, cantidad y material real. El precio se mueve en vivo.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#F0F7FF] to-white space-y-5">

          {/* ━━━ GRAFICAS DEL TRABAJO ━━━ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-[#1B2A6B]" />
                <span className="text-sm font-bold text-[#1E293B]">Graficas del trabajo</span>
              </div>
              <button
                onClick={addGrafica}
                disabled={graficas.length >= 20}
                className="text-[11px] font-semibold text-[#00B4D8] hover:text-[#1B2A6B] transition-colors flex items-center gap-1 disabled:opacity-40"
              >
                <Plus className="size-3.5" />
                Agregar otra grafica
              </button>
            </div>

            <p className="text-[10px] text-[#64748B] mb-3">
              Medidas en centimetros. Tambien las usamos para revisar nitidez del archivo.
            </p>

            <div className="space-y-3">
              {graficas.map((g, i) => (
                <div key={g.id} className="relative">
                  {/* Grafica label */}
                  {graficas.length > 1 && (
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-[#00B4D8] uppercase tracking-wider">
                        Grafica {i + 1}
                      </span>
                      <button
                        onClick={() => removeGrafica(g.id)}
                        className="text-[10px] text-red-400 hover:text-red-600 transition-colors flex items-center gap-0.5"
                      >
                        <Trash2 className="size-3" />
                        Quitar
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                    <div>
                      <label className="text-[10px] font-semibold text-[#64748B] block mb-1">
                        Ancho (cm)
                      </label>
                      <input
                        type="number"
                        value={g.anchoCm}
                        onChange={(e) => updateGrafica(g.id, "anchoCm", e.target.value)}
                        placeholder="100"
                        min="1"
                        className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[#64748B] block mb-1">
                        Alto (cm)
                      </label>
                      <input
                        type="number"
                        value={g.altoCm}
                        onChange={(e) => updateGrafica(g.id, "altoCm", e.target.value)}
                        placeholder="70"
                        min="1"
                        className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[#64748B] block mb-1">
                        Cant.
                      </label>
                      <div className="flex items-center">
                        <button
                          onClick={() => updateGrafica(g.id, "cantidad", Math.max(1, g.cantidad - 1))}
                          className="w-8 h-[38px] rounded-l-lg border border-r-0 border-[#E2E8F0] bg-white flex items-center justify-center text-sm font-bold text-[#64748B] hover:bg-[#F0F7FF]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={g.cantidad}
                          onChange={(e) => updateGrafica(g.id, "cantidad", Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          className="w-10 h-[38px] text-center border-y border-[#E2E8F0] text-sm font-bold text-[#1E293B] bg-white focus:outline-none"
                        />
                        <button
                          onClick={() => updateGrafica(g.id, "cantidad", g.cantidad + 1)}
                          className="w-8 h-[38px] rounded-r-lg border border-l-0 border-[#E2E8F0] bg-white flex items-center justify-center text-sm font-bold text-[#64748B] hover:bg-[#F0F7FF]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {/* Visual multiplier */}
                    {g.cantidad > 1 && (
                      <div className="flex items-center h-[38px]">
                        <span className="text-xs font-bold text-[#00B4D8]">x{g.cantidad}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {graficas.length < 20 && (
              <p className="text-[9px] text-[#94A3B8] mt-2">
                Max. 20 disenos o medidas distintas por cotizacion. Puedes cotizar muchas unidades de cada uno.
              </p>
            )}
          </div>

          {/* ━━━ PANO VISUALIZATION ━━━ */}
          {nesting.valid && (
            <PanoVisualization
              graficas={graficas}
              printableWidth={printableWidth}
              rollWidth={rollWidth}
              separacion={separacion}
              nesting={nesting}
            />
          )}

          {/* Errors & warnings */}
          {(nesting.errors.length > 0 || nesting.warnings.length > 0) && (
            <div className="space-y-2">
              {nesting.errors.map((err, i) => (
                <div key={`e${i}`} className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
              {nesting.warnings.map((warn, i) => (
                <div key={`w${i}`} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  <Info className="size-3.5 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}

          {/* ━━━ OPCIONES REALES DEL TALLER ━━━ */}
          <div>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-[#1B2A6B]" />
                <span className="text-sm font-bold text-[#1E293B]">Opciones reales del taller</span>
              </div>
              {showOptions ? <ChevronUp className="size-4 text-[#64748B]" /> : <ChevronDown className="size-4 text-[#64748B]" />}
            </button>

            {showOptions && (
              <div className="mt-3 space-y-3">
                {/* Roll info */}
                <div className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#1E293B]">Rollo automatico recomendado</p>
                      <p className="text-[10px] text-[#64748B]">El sistema elige el ancho mas eficiente</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-[#10b981]/10 text-[10px] font-bold text-[#10b981]">
                      {rollWidth} cm
                    </span>
                  </div>
                </div>

                {/* Separation */}
                <div className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#1E293B]">Separacion entre piezas y bordes</p>
                      <p className="text-[10px] text-[#64748B]">{separacion} cm (default global)</p>
                    </div>
                    <button
                      onClick={() => setShowSepEdit(!showSepEdit)}
                      className="text-[10px] font-semibold text-[#00B4D8] hover:text-[#1B2A6B]"
                    >
                      Editar
                    </button>
                  </div>
                  {showSepEdit && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        value={separacion}
                        onChange={(e) => setSeparacion(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                        min="0"
                        max="10"
                        className="w-16 px-2 py-1.5 rounded border border-[#E2E8F0] text-xs text-center"
                      />
                      <span className="text-[10px] text-[#64748B]">cm (0-10)</span>
                    </div>
                  )}
                </div>

                {/* Material selector */}
                {materiales.length > 0 && (
                  <div className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                    <label className="text-xs font-semibold text-[#1E293B] block mb-2">
                      Material de impresion
                    </label>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8] cursor-pointer"
                    >
                      {materiales.map((m) => (
                        <option key={m.nombre} value={m.nombre}>
                          {m.nombre} {m.multiplicador !== 1 ? `(x${m.multiplicador})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Terminaciones as checkboxes */}
                {acabados.length > 0 && (
                  <div className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                    <p className="text-xs font-semibold text-[#1E293B] mb-1">
                      Terminaciones opcionales
                    </p>
                    <p className="text-[10px] text-[#64748B] mb-3">
                      Ojetillos, bolsillo, bastidor u otros acabados si los necesitas.
                    </p>
                    <div className="space-y-2">
                      {acabados.map((a) => {
                        const isChecked = selectedTerminaciones.includes(a.nombre);
                        return (
                          <label
                            key={a.nombre}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isChecked
                                ? "border-[#00B4D8] bg-[#00B4D8]/5"
                                : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                              isChecked
                                ? "bg-[#00B4D8] border-[#00B4D8]"
                                : "border-[#CBD5E1] bg-white"
                            }`}>
                              {isChecked && <CheckCircle className="size-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-[#1E293B]">{a.nombre}</span>
                            </div>
                            <span className="text-xs font-semibold text-[#00B4D8] shrink-0">
                              {a.precioExtra > 0 ? `+${formatCLP(a.precioExtra)}/m²` : "Incluido"}
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTerminacion(a.nombre)}
                              className="sr-only"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ━━━ PRICE DISPLAY ━━━ */}
          <div className="text-center py-5 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
            {calculo ? (
              <>
                <p className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Precio estimado</p>
                <p className="text-[40px] font-extrabold text-[#1B2A6B] leading-none">
                  {formatCLP(calculo.total)}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-[#64748B] flex-wrap">
                  <span>{nesting.printableArea.toFixed(2)} m²</span>
                  <span className="w-1 h-1 rounded-full bg-[#64748B]" />
                  <span>{formatCLP(Math.round(precioM2 * multiplicador))}/m²</span>
                  <span className="w-1 h-1 rounded-full bg-[#64748B]" />
                  <span>{nesting.totalGraficas} grafica{nesting.totalGraficas > 1 ? "s" : ""}</span>
                  {nesting.utilization > 0 && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-[#64748B]" />
                      <span>{nesting.utilization}% aprovech.</span>
                    </>
                  )}
                </div>
                {selectedTerminaciones.length > 0 && calculo.precioTerminaciones > 0 && (
                  <p className="text-[10px] text-[#64748B] mt-1">
                    Incluye terminaciones: +{formatCLP(Math.round(calculo.precioTerminaciones))}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Desde</p>
                <p className="text-[40px] font-extrabold text-[#1B2A6B] leading-none">
                  {formatCLP(precioM2)}
                </p>
                <p className="text-xs text-[#64748B] mt-2">por metro cuadrado</p>
              </>
            )}
          </div>

          {/* ━━━ CTA BUTTONS ━━━ */}
          <div className="space-y-2">
            {onAddToCart && calculo && (
              <button
                onClick={() => {
                  const g = graficas[0];
                  if (!g || !calculo) return;
                  onAddToCart({
                    ancho: parseFloat(g.anchoCm) || 0,
                    alto: parseFloat(g.altoCm) || 0,
                    material,
                    acabado: selectedTerminaciones.join(", ") || "Sin terminacion",
                    precio: calculo.total,
                    area: nesting.printableArea,
                  });
                }}
                disabled={!calculo}
                className="w-full py-3.5 rounded-xl bg-[#1B2A6B] text-white font-bold text-sm hover:bg-[#152259] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                Agregar al Carrito
              </button>
            )}
            <button
              onClick={handleWhatsApp}
              disabled={!calculo}
              className="w-full py-3.5 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1ebe5a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="size-4" />
              Cotizar por WhatsApp
            </button>

            {calculo && (
              <button
                onClick={() => setShowQuoteForm(!showQuoteForm)}
                className="w-full py-3 rounded-xl border-2 border-[#E91E8C]/30 text-[#E91E8C] font-semibold text-sm hover:bg-[#E91E8C]/5 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="size-4" />
                {showQuoteForm ? "Ocultar formulario" : "Solicitar cotizacion formal"}
              </button>
            )}
          </div>

          {/* ━━━ QUOTATION FORM ━━━ */}
          {showQuoteForm && calculo && (
            quoteSent ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#10b981]/10 flex items-center justify-center">
                  <CheckCircle className="size-7 text-[#10b981]" />
                </div>
                <h4 className="font-bold text-[#1E293B]">Cotizacion enviada!</h4>
                <p className="text-sm text-[#64748B]">
                  Te responderemos en menos de 2 horas habiles a <span className="font-medium text-[#1E293B]">{quoteEmail}</span>
                </p>
                <button
                  onClick={() => { setQuoteSent(false); setShowQuoteForm(false); }}
                  className="text-sm text-[#00B4D8] hover:underline"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                  <Send className="size-4 text-[#E91E8C]" />
                  <p className="text-sm font-bold text-[#1E293B]">Solicitar cotizacion formal</p>
                </div>

                {/* File upload */}
                <div>
                  <label className="text-xs font-semibold text-[#1E293B] block mb-1.5">
                    <Upload className="size-3 inline mr-1" />
                    Sube tu diseno (opcional)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-4 text-center cursor-pointer hover:border-[#00B4D8] hover:bg-[#F0F7FF]/50 transition-colors"
                  >
                    <Upload className="size-6 mx-auto text-[#64748B] mb-2" />
                    <p className="text-xs text-[#64748B]">
                      <span className="text-[#00B4D8] font-semibold">Click para subir</span> o arrastra tu archivo
                    </p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">PDF, JPG, PNG, AI, PSD. Max 25MB. Max 5 archivos.</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.ai,.psd,.tiff,.tif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {quoteFiles.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {quoteFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#E2E8F0]">
                          <FileText className="size-4 text-[#00B4D8] shrink-0" />
                          <span className="text-xs text-[#1E293B] truncate flex-1">{file.name}</span>
                          <span className="text-[10px] text-[#64748B] shrink-0">{formatFileSize(file.size)}</span>
                          <button type="button" onClick={() => removeFile(i)} className="shrink-0 p-0.5 rounded hover:bg-red-50 text-[#64748B] hover:text-red-500">
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#1E293B] block mb-1.5">
                      <User className="size-3 inline mr-1" />Nombre *
                    </label>
                    <input
                      type="text" required value={quoteNombre}
                      onChange={(e) => setQuoteNombre(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#1E293B] block mb-1.5">
                        <Mail className="size-3 inline mr-1" />Email *
                      </label>
                      <input
                        type="email" required value={quoteEmail}
                        onChange={(e) => setQuoteEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#1E293B] block mb-1.5">
                        <Phone className="size-3 inline mr-1" />Telefono
                      </label>
                      <input
                        type="tel" value={quoteTelefono}
                        onChange={(e) => setQuoteTelefono(e.target.value)}
                        placeholder="+56 9 1234 5678"
                        className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                      />
                    </div>
                  </div>

                  {/* Boleta / Factura */}
                  <div>
                    <label className="text-xs font-semibold text-[#1E293B] block mb-1.5">
                      Tipo de documento
                    </label>
                    <div className="flex gap-2">
                      {(["boleta", "factura"] as const).map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setQuoteTipoDoc(tipo)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all capitalize ${
                            quoteTipoDoc === tipo
                              ? "border-[#1B2A6B] bg-[#1B2A6B] text-white"
                              : "border-[#E2E8F0] text-[#64748B] hover:border-[#00B4D8]"
                          }`}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#1E293B] block mb-1.5">
                      Notas adicionales
                    </label>
                    <textarea
                      value={quoteNotas}
                      onChange={(e) => setQuoteNotas(e.target.value)}
                      rows={2}
                      placeholder="Indicaciones especiales, plazo requerido, etc."
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white resize-none"
                    />
                  </div>
                </div>

                {/* Quote summary */}
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2 font-semibold">Resumen de tu cotizacion</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-[#64748B]">Producto</span><span className="text-[#1E293B] font-medium">{productoNombre}</span></div>
                    {graficas.filter((g) => (parseFloat(g.anchoCm) || 0) > 0).map((g, i) => (
                      <div key={g.id} className="flex justify-between">
                        <span className="text-[#64748B]">Grafica {i + 1}</span>
                        <span className="text-[#1E293B] font-medium">{g.anchoCm}x{g.altoCm}cm x{g.cantidad}</span>
                      </div>
                    ))}
                    <div className="flex justify-between"><span className="text-[#64748B]">Area</span><span className="text-[#1E293B] font-medium">{nesting.printableArea.toFixed(2)} m²</span></div>
                    {materiales.length > 0 && <div className="flex justify-between"><span className="text-[#64748B]">Material</span><span className="text-[#1E293B] font-medium">{material}</span></div>}
                    {selectedTerminaciones.length > 0 && <div className="flex justify-between"><span className="text-[#64748B]">Terminaciones</span><span className="text-[#1E293B] font-medium">{selectedTerminaciones.join(", ")}</span></div>}
                    <div className="flex justify-between pt-2 mt-2 border-t border-[#E2E8F0]">
                      <span className="font-bold text-[#1E293B]">Precio estimado</span>
                      <span className="font-extrabold text-[#1B2A6B] text-base">{formatCLP(calculo.total)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={quoteSending || !quoteNombre.trim() || !quoteEmail.trim()}
                  className="w-full py-3.5 rounded-xl bg-[#E91E8C] text-white font-bold text-sm hover:bg-[#d1187d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="size-4" />
                  {quoteSending ? "Enviando cotizacion..." : "Enviar cotizacion"}
                </button>

                <p className="text-[10px] text-[#64748B] text-center">
                  Te responderemos en menos de 2 horas habiles con el presupuesto confirmado.
                </p>
              </form>
            )
          )}

          <p className="text-[10px] text-[#64748B] text-center">
            Precio referencial. El valor final puede variar segun diseno y acabados.
          </p>

          {/* Recomendaciones */}
          <div className="p-3 bg-[#FFF7ED] rounded-lg border border-[#FFEDD5]">
            <p className="text-[11px] font-semibold text-[#92400E] mb-1.5">Recomendaciones de diseno:</p>
            <ul className="text-[10px] text-[#92400E]/80 space-y-0.5">
              <li>• Resolucion: 150 DPI para gran formato</li>
              <li>• Modo de color: CMYK preferido</li>
              <li>• Formatos: PDF, AI, PSD, JPG o PNG</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
