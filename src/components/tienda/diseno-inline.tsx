"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Move, Sparkles, Lock } from "lucide-react";

/**
 * Prueba-tu-diseño inline para la ficha de producto estándar.
 *
 * Sin salir de la página: el cliente sube su arte (clic o arrastrando) y lo ve
 * superpuesto sobre la foto del producto, lo arrastra y lo escala. Es la versión
 * liviana para "ver cómo quedaría" al instante. Todo es client-side (objectURL),
 * no toca el backend.
 */
interface DisenoInlineProps {
  productoImagen: string;
  productoNombre: string;
}

export function DisenoInline({ productoImagen, productoNombre }: DisenoInlineProps) {
  const [diseno, setDiseno] = useState<string | null>(null);
  const [scale, setScale] = useState(42); // ancho del diseño en % del lienzo
  const [pos, setPos] = useState({ x: 50, y: 40 }); // centro del diseño en %
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const procesarArchivo = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setDiseno((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPos({ x: 50, y: 40 });
    setScale(42);
  };

  const cargar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    procesarArchivo(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    procesarArchivo(e.dataTransfer.files?.[0]);
  };

  const quitar = () => {
    if (diseno) URL.revokeObjectURL(diseno);
    setDiseno(null);
  };

  // Arrastrar el diseño con pointer events (mouse + touch)
  const onPointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = rect.left + (pos.x / 100) * rect.width;
    const cy = rect.top + (pos.y / 100) * rect.height;
    drag.current = { dx: e.clientX - cx, dy: e.clientY - cy };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - drag.current.dx - rect.left) / rect.width) * 100;
    const y = ((e.clientY - drag.current.dy - rect.top) / rect.height) * 100;
    setPos({ x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="mb-4 rounded-2xl border p-4" style={{ borderColor: "var(--mc-line)" }}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4" style={{ color: "var(--mc-accent)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--mc-ink)" }}>
          Pruébalo con tu diseño
        </p>
      </div>

      {!diseno ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-16px_rgba(0,0,0,0.32)]"
          style={{
            borderColor: "var(--mc-accent)",
            background: dragging ? "var(--mc-accent-soft)" : "linear-gradient(135deg, var(--mc-accent-soft), #ffffff 78%)",
            transform: dragging ? "scale(1.012)" : undefined,
          }}
        >
          {/* glow decorativo */}
          <span className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-50" style={{ background: "var(--mc-accent)" }} />

          {/* icono */}
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105 group-hover:rotate-3" style={{ background: "var(--mc-accent)", color: "#fff" }}>
            <ImagePlus className="size-5" />
            <span className="absolute inset-0 rounded-xl ring-2 ring-inset ring-white/30" />
          </span>

          {/* texto */}
          <span className="relative min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-bold" style={{ color: "var(--mc-ink)" }}>Sube tu diseño</span>
              <span className="mc-tech rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#fff", color: "var(--mc-accent-ink)", borderColor: "var(--mc-line-2)" }}>
                o arrástralo aquí
              </span>
            </span>
            <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: "var(--mc-ink-2)" }}>
              {dragging ? "Suelta para verlo sobre el producto" : "Míralo sobre el producto al instante"}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-1.5">
              {["PNG", "JPG", "SVG"].map((f) => (
                <span key={f} className="mc-tech rounded-md border px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "#fff", color: "var(--mc-ink-3)", borderColor: "var(--mc-line-2)" }}>{f}</span>
              ))}
              <span className="mc-tech ml-auto inline-flex items-center gap-1 text-[10px]" style={{ color: "var(--mc-ink-3)" }}>
                <Lock className="size-3" /> queda en tu navegador
              </span>
            </span>
          </span>
        </button>
      ) : (
        <>
          <div
            ref={canvasRef}
            className="relative mx-auto aspect-[4/5] w-full max-w-[360px] select-none overflow-hidden rounded-xl bg-white"
            style={{ touchAction: "none" }}
          >
            {productoImagen && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productoImagen}
                alt={productoNombre}
                className="pointer-events-none absolute inset-0 size-full object-contain"
                draggable={false}
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={diseno}
              alt="Tu diseño"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              draggable={false}
              className="absolute cursor-move drop-shadow-sm"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${scale}%`,
                transform: "translate(-50%, -50%)",
                touchAction: "none",
              }}
            />
            <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white">
              <Move className="size-3" /> arrastra para mover
            </span>
          </div>

          {/* Tamaño */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--mc-ink-3)" }}>
              Tamaño
            </span>
            <input
              type="range"
              min={12}
              max={85}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="h-1.5 flex-1 accent-[#0f1115]"
              aria-label="Tamaño del diseño"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mc-btn mc-btn-ghost flex-1 gap-2 text-sm"
            >
              <ImagePlus className="size-4" /> Cambiar
            </button>
            <button
              type="button"
              onClick={quitar}
              aria-label="Quitar diseño"
              className="mc-btn mc-btn-ghost px-3"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="mt-2 text-center text-[11px]" style={{ color: "var(--mc-ink-3)" }}>
            Vista referencial. La impresión final se ajusta con tu archivo en alta resolución.
          </p>
        </>
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={cargar} className="hidden" />
    </div>
  );
}
