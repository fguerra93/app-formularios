"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, Clock } from "lucide-react";

/**
 * Hero minimal claro: fondo blanco, titular fuerte, 1 acento cyan, una imagen
 * de producto limpia. Sin video, círculos flotantes ni glassmorphism.
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
          <span className="mc-eyebrow">Imprenta en Doñihue · O&apos;Higgins</span>

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

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              { icon: ShieldCheck, label: "+500 clientes" },
              { icon: Truck, label: "Envío gratis +$50.000" },
              { icon: Clock, label: "Entrega 24–48h" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm" style={{ color: "var(--mc-ink-2)" }}>
                <Icon className="size-4" style={{ color: "var(--mc-accent)" }} />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Imagen */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <div className="mc-card overflow-hidden">
            <img
              src="https://cdn.shopify.com/s/files/1/0865/0077/0149/files/DTFTEXTIL2.jpg?v=1768931472"
              alt="Impresión DTF textil profesional"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          {/* Chip de precio — único detalle flotante, sobrio */}
          <div className="absolute -bottom-4 -left-4 bg-white border border-[#e8eaee] rounded-2xl shadow-[0_14px_34px_-12px_rgba(15,17,21,.18)] px-5 py-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--mc-ink-3)" }}>
              Gran formato desde
            </p>
            <p className="text-xl font-extrabold" style={{ color: "var(--mc-ink)" }}>
              $7.500<span className="text-sm font-medium" style={{ color: "var(--mc-ink-2)" }}>/m²</span>
            </p>
          </div>
        </motion.div>
      </div>
      <hr className="mc-rule max-w-7xl mx-auto" />
    </section>
  );
}
