"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Truck, Clock, Printer, Layers, Palette } from "lucide-react";
import { FloatingCircles, RotatingRing, PulsingDots, DotPattern, AccentLine } from "./decorative";

const showcaseImages = [
  {
    src: "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/DTFTEXTIL2.jpg?v=1768931472",
    alt: "Impresion DTF Textil profesional",
    label: "DTF Textil",
  },
  {
    src: "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/Pendongenerico-tumarcaaqui.png?v=1768931843",
    alt: "Pendon Roller PVC para eventos y ferias",
    label: "Pendon Roller",
  },
  {
    src: "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/IMG_20250515_103817.jpg?v=1773951352",
    alt: "Impresion gran formato Tela PVC 10oz",
    label: "Gran Formato",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: "620px" }}>
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1B2A6B 0%, #0f1d5e 40%, #00355a 70%, #003d5c 100%)",
        }}
      />
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
        aria-hidden="true"
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
        <source src="/videos/hero-bg.webm" type="video/webm" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-[#1B2A6B]/60 via-transparent to-[#1B2A6B]/80" />

      {/* Decorative elements */}
      <FloatingCircles theme="hero" />
      <PulsingDots color="rgba(255,255,255,0.4)" />
      <DotPattern />
      <RotatingRing
        size={200}
        color="rgba(0, 180, 216, 0.15)"
        className="hidden md:block -right-16 top-1/4"
      />
      <RotatingRing
        size={140}
        color="rgba(255, 151, 16, 0.1)"
        className="hidden lg:block left-[15%] -bottom-10"
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-20 lg:py-24 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        {/* Left: text content */}
        <motion.div
          className="flex-1 text-center lg:text-left"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-white/90 text-sm mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Sparkles className="w-4 h-4 text-[#FFD100]" />
            La imprenta de confianza en Chile
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-5"
            style={{ letterSpacing: "-0.025em" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-white">Tu impresion, </span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg, #00B4D8, #00e5ff, #FF9710)",
              }}
            >
              nuestra huella
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-base md:text-lg text-white/70 max-w-xl mx-auto lg:mx-0 mb-6 leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Pendones, lienzos, DTF textil, poleras y articulos publicitarios.
            Impresion profesional en Donihue con despacho a todo Chile.
          </motion.p>

          {/* Service pills */}
          <motion.div
            className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[
              { label: "Gran Formato", icon: Printer },
              { label: "DTF & DTG", icon: Layers },
              { label: "Sublimacion", icon: Palette },
            ].map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold glass text-white"
              >
                <Icon className="w-3.5 h-3.5 text-[#00B4D8]" />
                {label}
              </span>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link
              href="/productos"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-[#1B2A6B] bg-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2"
            >
              Ver Catalogo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/56966126645?text=Hola%2C%20quiero%20cotizar%20un%20producto"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm border-2 border-white/30 text-white hover:bg-white/10 transition-all text-center"
              style={{
                boxShadow: "0 0 20px rgba(0, 180, 216, 0.2)",
              }}
            >
              Cotizar por WhatsApp
            </a>
          </motion.div>

          {/* Stats inline */}
          <motion.div
            className="flex flex-wrap items-center justify-center lg:justify-start gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />
              <span className="text-white/60 text-xs">+500 clientes</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#00B4D8]" />
              <span className="text-white/60 text-xs">Envio gratis +$50k</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF9710]" />
              <span className="text-white/60 text-xs">Entrega 24-48h</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: product showcase collage */}
        <motion.div
          className="hidden lg:flex flex-1 items-center justify-center relative"
          style={{ minHeight: "460px" }}
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          {/* Main featured image - DTF textil (largest, front) */}
          <motion.div
            className="absolute z-30 rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: "340px", height: "280px", top: "50px", left: "20px" }}
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <img
              src={showcaseImages[0].src}
              alt={showcaseImages[0].alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-white/95 text-[#1B2A6B] text-xs font-bold shadow-sm">
                {showcaseImages[0].label}
              </span>
              <span className="px-2 py-1 rounded-lg bg-[#00B4D8] text-white text-[10px] font-bold">
                POPULAR
              </span>
            </div>
          </motion.div>

          {/* Secondary image - Pendon Roller (top right, tilted) */}
          <motion.div
            className="absolute z-20 rounded-2xl overflow-hidden shadow-xl"
            style={{ width: "240px", height: "200px", top: "0", right: "0" }}
            initial={{ opacity: 0, y: -20, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 3 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <img
              src={showcaseImages[1].src}
              alt={showcaseImages[1].alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-white/95 text-[#1B2A6B] text-xs font-bold shadow-sm">
              {showcaseImages[1].label}
            </span>
          </motion.div>

          {/* Third image - Gran formato (bottom right) */}
          <motion.div
            className="absolute z-10 rounded-2xl overflow-hidden shadow-xl"
            style={{ width: "220px", height: "180px", bottom: "10px", right: "30px" }}
            initial={{ opacity: 0, y: 20, rotate: 1 }}
            animate={{ opacity: 1, y: 0, rotate: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <img
              src={showcaseImages[2].src}
              alt={showcaseImages[2].alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-white/95 text-[#1B2A6B] text-xs font-bold shadow-sm">
              {showcaseImages[2].label}
            </span>
          </motion.div>

          {/* Floating badge - glassmorphic (bottom left) */}
          <motion.div
            className="absolute z-40 glass-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-3"
            style={{ bottom: "30px", left: "-10px" }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B2A6B, #00B4D8)" }}>
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1B2A6B] leading-tight">1440 DPI</p>
              <p className="text-[10px] text-[#64748B] leading-tight">Resolucion profesional</p>
            </div>
          </motion.div>

          {/* Floating price badge (top left) */}
          <motion.div
            className="absolute z-40 glass-white rounded-xl shadow-xl px-4 py-2.5 text-center"
            style={{ top: "20px", left: "0" }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.3 }}
          >
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-medium">Gran formato desde</p>
            <p className="text-lg font-extrabold text-[#1B2A6B]">$7.500<span className="text-xs font-medium text-[#64748B]">/m²</span></p>
          </motion.div>

          {/* Glow behind collage */}
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-20 -z-10"
            style={{ background: "radial-gradient(circle at 40% 50%, #00B4D8 0%, transparent 60%), radial-gradient(circle at 80% 30%, #FF9710 0%, transparent 50%)" }}
          />
        </motion.div>

        {/* Mobile: single featured image */}
        <motion.div
          className="lg:hidden w-full max-w-sm mx-auto relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img
              src={showcaseImages[0].src}
              alt={showcaseImages[0].alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="px-3 py-1.5 rounded-lg bg-white/95 text-[#1B2A6B] text-xs font-bold shadow-sm">
                DTF Textil
              </span>
              <span className="px-3 py-1.5 rounded-lg glass text-white text-[10px] font-bold">
                Desde $7.500/m²
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gradient accent line at bottom */}
      <AccentLine />
    </section>
  );
}
