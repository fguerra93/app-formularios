"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * Hero "pliego de taller": titular fuerte, foto real del trabajo con cota
 * de imprenta debajo y datos duros en voz técnica monoespaciada.
 * Sin video, sin círculos, sin glassmorphism, sin chips con iconitos.
 */
export function Hero() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="mc-eyebrow">Imprenta en Doñihue · Región de O&apos;Higgins</span>

          <h1 className="mc-display text-4xl md:text-5xl lg:text-6xl mt-4 mb-5">
            Tu impresión,
            <br />
            <span style={{ color: "var(--mc-accent-ink)" }}>lista cuando la necesitas.</span>
          </h1>

          <p className="mc-sub text-base md:text-lg max-w-lg mb-8">
            Pendones, lienzos, DTF textil, poleras y artículos publicitarios.
            Impresión profesional con despacho a todo Chile.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link href="/productos" className="mc-btn mc-btn-primary">
              Ver catálogo
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://wa.me/56966126645?text=Hola%2C%20quiero%20cotizar%20un%20producto"
              target="_blank"
              rel="noopener noreferrer"
              className="mc-btn mc-btn-ghost"
            >
              Cotizar por WhatsApp
            </a>
          </div>

          {/* Datos duros del taller, en voz técnica */}
          <p className="mc-tech text-[12px] uppercase tracking-[0.08em]" style={{ color: "var(--mc-ink-2)" }}>
            +500 clientes · +2.000 trabajos · sale en 24–48 h
          </p>
        </motion.div>

        {/* Imagen con cota de taller */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <div className="mc-card mc-cropmarks overflow-hidden">
            <img
              src="https://cdn.shopify.com/s/files/1/0865/0077/0149/files/DTFTEXTIL2.jpg?v=1768931472"
              alt="Impresión DTF textil profesional"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="mc-cota mt-4">
            <span>DTF textil · 1440 dpi · full color</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="mc-tech text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--mc-ink-3)" }}>
              Gran formato desde
            </span>
            <span className="mc-tech text-xl font-bold" style={{ color: "var(--mc-ink)" }}>
              $7.500<span className="text-sm font-medium" style={{ color: "var(--mc-ink-2)" }}>/m²</span>
            </span>
          </div>
        </motion.div>
      </div>
      <hr className="mc-rule max-w-7xl mx-auto" />
    </section>
  );
}
