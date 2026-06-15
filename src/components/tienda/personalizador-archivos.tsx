"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, FileText, Lock, Loader2 } from "lucide-react";
import type { ArchivoDiseno } from "@/lib/types";

/**
 * Subida de archivos de diseño para productos personalizables.
 *
 * - Sólo PNG o PDF · hasta `max` archivos (5 por defecto).
 * - Cada archivo se ve como tarjeta: miniatura (PNG) o sello PDF, con una nota
 *   opcional por archivo (talla / color / observación) → "personalizar cada uno".
 * - Controlado: el lote vive en el padre y se agrega como UN producto al carrito.
 * - 100% client-side: la miniatura es un dataURL chico (cabe en localStorage).
 */

const MIME_OK = ["image/png", "application/pdf"];

async function miniatura(file: File): Promise<string | null> {
  if (file.type !== "image/png") return null; // PDF → sello, no miniatura
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 128;
      const scale = Math.min(max / img.width, max / img.height, 1);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      ctx.fillStyle = "#ffffff"; // fondo blanco para PNG transparentes
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

interface Props {
  archivos: ArchivoDiseno[];
  onChange: (archivos: ArchivoDiseno[]) => void;
  max?: number;
}

export function PersonalizadorArchivos({ archivos, onChange, max = 5 }: Props) {
  const [dragging, setDragging] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lleno = archivos.length >= max;

  const agregar = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const cupo = max - archivos.length;
    const validos = Array.from(files)
      .filter((f) => MIME_OK.includes(f.type) || /\.(png|pdf)$/i.test(f.name))
      .slice(0, cupo);
    if (validos.length === 0) return;
    setProcesando(true);
    const nuevos: ArchivoDiseno[] = [];
    for (const f of validos) {
      nuevos.push({
        nombre: f.name,
        tipo: f.type || (/\.pdf$/i.test(f.name) ? "application/pdf" : "image/png"),
        preview: await miniatura(f),
      });
    }
    setProcesando(false);
    onChange([...archivos, ...nuevos]);
  };

  const quitar = (i: number) => onChange(archivos.filter((_, idx) => idx !== i));
  const setNota = (i: number, nota: string) =>
    onChange(archivos.map((a, idx) => (idx === i ? { ...a, nota } : a)));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    agregar(e.dataTransfer.files);
  };

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--mc-line)" }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ImagePlus className="size-4" style={{ color: "var(--mc-accent)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--mc-ink)" }}>
            Sube tus diseños para imprimir
          </p>
        </div>
        <span className="mc-tech text-[11px]" style={{ color: archivos.length ? "var(--mc-accent-ink)" : "var(--mc-ink-3)" }}>
          {archivos.length}/{max}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.pdf,image/png,application/pdf"
        multiple
        onChange={(e) => {
          agregar(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* Dropzone — sólo cuando queda cupo */}
      {!lleno && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border-2 border-dashed px-4 py-3.5 text-left transition-all hover:-translate-y-0.5"
          style={{
            borderColor: "var(--mc-accent)",
            background: dragging ? "var(--mc-accent-soft)" : "linear-gradient(135deg, var(--mc-accent-soft), #ffffff 80%)",
          }}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--mc-accent)", color: "#fff" }}>
            {procesando ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold" style={{ color: "var(--mc-ink)" }}>
              {archivos.length ? "Agregar otro diseño" : "Sube tus diseños"}
              <span className="ml-1.5 font-normal" style={{ color: "var(--mc-ink-3)" }}>o arrástralos</span>
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: "var(--mc-ink-2)" }}>
              <span className="mc-tech rounded-md border px-1.5 py-0.5 font-semibold" style={{ borderColor: "var(--mc-line-2)" }}>PNG</span>
              <span className="mc-tech rounded-md border px-1.5 py-0.5 font-semibold" style={{ borderColor: "var(--mc-line-2)" }}>PDF</span>
              <span>· hasta {max} · 1 archivo = 1 impresión</span>
            </span>
          </span>
          <Lock className="size-3.5 shrink-0" style={{ color: "var(--mc-ink-3)" }} />
        </button>
      )}

      {/* Tarjetas de archivos */}
      {archivos.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {archivos.map((a, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border p-2" style={{ borderColor: "var(--mc-line-2)" }}>
              {/* Miniatura o sello PDF */}
              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border" style={{ borderColor: "var(--mc-line)", background: "#fff" }}>
                {a.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.preview} alt={a.nombre} className="size-full object-contain" />
                ) : (
                  <FileText className="size-6" style={{ color: "var(--mc-accent-ink)" }} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium" style={{ color: "var(--mc-ink)" }}>{a.nombre}</p>
                <input
                  type="text"
                  value={a.nota || ""}
                  onChange={(e) => setNota(i, e.target.value)}
                  placeholder="Nota: talla, color, observación…"
                  className="mt-1 w-full rounded-md border bg-white px-2 py-1 text-[12px] outline-none focus:border-[var(--mc-accent)]"
                  style={{ borderColor: "var(--mc-line)", color: "var(--mc-ink)" }}
                />
              </div>
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label={`Quitar ${a.nombre}`}
                className="mc-btn mc-btn-ghost shrink-0 px-2.5 py-2"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2.5 text-[11px] leading-relaxed" style={{ color: "var(--mc-ink-3)" }}>
        Imprimimos tu archivo tal como llega. Revisa medidas y resolución (300 ppi) en la
        descripción. Tus archivos quedan en tu navegador hasta que confirmes el pedido.
      </p>
    </div>
  );
}
