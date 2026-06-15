import Link from "next/link";
import {
  FileCheck2,
  ShoppingCart,
  Package,
  FileText,
  Image as ImageIcon,
  Layers,
  Ruler,
  Check,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Breadcrumb } from "@/components/tienda/breadcrumb";

export const metadata = {
  title: "Cómo comprar — PrintUp",
  description:
    "De tu archivo a tu pedido en 3 pasos: prepara tu diseño (PNG/PDF, 300 ppi), haz tu pedido y retira o recibe en 24–48 h.",
};

const pasos = [
  {
    n: "01",
    icon: FileCheck2,
    title: "Prepara tu archivo",
    desc: "PNG o PDF, 300 ppi en tamaño real y fondo transparente (textil). Revisa las medidas en la descripción de cada producto.",
  },
  {
    n: "02",
    icon: ShoppingCart,
    title: "Haz tu pedido",
    desc: "Elige el producto, sube tus diseños (hasta 5) o cotiza por WhatsApp, y paga en línea con Webpay.",
  },
  {
    n: "03",
    icon: Package,
    title: "Producción y retiro",
    desc: "Imprimimos en 24–48 h y te avisamos. Retiras en Doñihue (tienda o taller) o coordinamos despacho.",
  },
];

const requisitos = [
  { k: "Formato", v: "PNG o PDF", icon: FileText },
  { k: "Resolución", v: "300 ppi en tamaño real", icon: ImageIcon },
  { k: "Fondo", v: "Transparente (textil)", icon: Layers },
  { k: "Medidas", v: "Según el producto", icon: Ruler },
];

const checklist = [
  "Fondo transparente, sin capas de color ocultas",
  "300 ppi a tamaño real de impresión",
  "Respeta el ancho y largo máximo del producto",
  "La suma de tus archivos = lo que compraste",
];

export default function ComoComprarPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb items={[{ label: "Cómo comprar" }]} />

      {/* Header */}
      <div className="mx-auto mt-4 mb-12 max-w-2xl text-center">
        <p className="mc-tech text-[12px] uppercase tracking-[0.16em]" style={{ color: "var(--mc-accent-ink)" }}>
          Guía de compra
        </p>
        <h1 className="mc-display mt-2 text-3xl md:text-5xl">De tu archivo a tu pedido</h1>
        <p className="mc-sub mt-4">Tres pasos simples, sin enredos.</p>
      </div>

      {/* 3 pasos */}
      <div className="grid gap-5 md:grid-cols-3">
        {pasos.map((p) => (
          <div key={p.n} className="relative overflow-hidden rounded-2xl border bg-white p-6" style={{ borderColor: "var(--mc-line)" }}>
            <span
              className="pl-poster absolute right-3 top-1 text-6xl leading-none"
              style={{ color: "transparent", WebkitTextStroke: "1.5px var(--mc-line-2)" }}
              aria-hidden="true"
            >
              {p.n}
            </span>
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl" style={{ background: "var(--mc-accent-soft)" }}>
              <p.icon className="size-5" style={{ color: "var(--mc-accent-ink)" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--mc-ink)" }}>{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--mc-ink-2)" }}>{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Requisitos del archivo */}
      <section className="mt-10 rounded-2xl border bg-white p-6 md:p-8" style={{ borderColor: "var(--mc-line)" }}>
        <h2 className="text-xl font-bold" style={{ color: "var(--mc-ink)" }}>Requisitos del archivo</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--mc-ink-2)" }}>
          Lo esencial para que tu impresión salga perfecta. Las medidas varían por producto — revisa siempre su descripción.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {requisitos.map((r) => (
            <div key={r.k} className="rounded-xl border p-4" style={{ borderColor: "var(--mc-line)", background: "var(--mc-surface)" }}>
              <r.icon className="size-5" style={{ color: "var(--mc-accent-ink)" }} />
              <p className="mc-tech mt-3 text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--mc-ink-3)" }}>{r.k}</p>
              <p className="text-sm font-semibold" style={{ color: "var(--mc-ink)" }}>{r.v}</p>
            </div>
          ))}
        </div>
        <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {checklist.map((c) => (
            <li key={c} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--mc-ink)" }}>
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--mc-accent-soft)" }}>
                <Check className="size-3.5" style={{ color: "var(--mc-accent-ink)" }} />
              </span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* Qué incluye / no incluye */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border p-6" style={{ borderColor: "#bbf7d0", background: "#ecfdf5" }}>
          <h3 className="flex items-center gap-2 text-base font-bold" style={{ color: "#065f46" }}>
            <Check className="size-5" /> Incluye
          </h3>
          <ul className="mt-3 space-y-2 text-sm" style={{ color: "#065f46" }}>
            <li>Impresión profesional según tu archivo</li>
            <li>Revisión técnica (que sea imprimible)</li>
            <li>Asesoría por WhatsApp antes de imprimir</li>
          </ul>
        </div>
        <div className="rounded-2xl border p-6" style={{ borderColor: "#fed7aa", background: "var(--mc-warn-soft)" }}>
          <h3 className="flex items-center gap-2 text-base font-bold" style={{ color: "#9a3412" }}>
            <AlertTriangle className="size-5" /> No incluye
          </h3>
          <ul className="mt-3 space-y-2 text-sm" style={{ color: "#9a3412" }}>
            <li>Edición, limpieza de fondo ni vectorización</li>
            <li>Corrección de diseño, colores o medidas</li>
            <li>Imprimimos tu archivo tal como llega — revísalo antes de enviar</li>
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/productos" className="mc-btn mc-btn-primary">
          Ver catálogo <ArrowRight className="size-4" />
        </Link>
        <a
          href="https://wa.me/56966126645?text=Hola%2C%20tengo%20una%20duda%20para%20comprar"
          target="_blank"
          rel="noopener noreferrer"
          className="mc-btn mc-btn-ghost"
        >
          ¿Dudas? Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}
