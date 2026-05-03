"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#FAFBFF", minHeight: "580px" }}
    >
      {/* Decorative SVG shapes */}

      {/* Large navy semicircle bottom-left */}
      <svg
        aria-hidden="true"
        className="absolute -bottom-16 -left-16 pointer-events-none"
        width="360"
        height="360"
        viewBox="0 0 360 360"
        fill="none"
      >
        <path
          d="M0 360 A180 180 0 0 1 360 360 Z"
          fill="#1B2A6B"
          opacity="0.92"
        />
      </svg>

      {/* Orange circle right side */}
      <svg
        aria-hidden="true"
        className="absolute -right-20 top-1/2 -translate-y-1/2 pointer-events-none"
        width="320"
        height="320"
        viewBox="0 0 320 320"
        fill="none"
      >
        <circle cx="160" cy="160" r="160" fill="#FF9710" opacity="0.18" />
      </svg>

      {/* Teal small accent circle top-right area */}
      <svg
        aria-hidden="true"
        className="absolute top-8 right-1/3 pointer-events-none hidden md:block"
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
      >
        <circle cx="28" cy="28" r="28" fill="#00998E" opacity="0.55" />
      </svg>

      {/* Second teal dot bottom-center */}
      <svg
        aria-hidden="true"
        className="absolute bottom-10 left-1/3 pointer-events-none"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
      >
        <circle cx="14" cy="14" r="14" fill="#00998E" opacity="0.4" />
      </svg>

      {/* Navy small circle top-left */}
      <svg
        aria-hidden="true"
        className="absolute top-12 left-12 pointer-events-none hidden md:block"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
      >
        <circle cx="18" cy="18" r="18" fill="#1B2A6B" opacity="0.18" />
      </svg>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">

        {/* Left: text content */}
        <motion.div
          className="flex-1 text-center md:text-left"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div
            className="mb-6 flex justify-center md:justify-start"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <img
              src="https://printup.cl/cdn/shop/files/LOGO-2.gif?v=1768853492"
              alt="PrintUp logo"
              className="h-16 md:h-20 w-auto object-contain"
            />
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4"
            style={{ color: "#1B2A6B", letterSpacing: "-0.025em" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Tu impresion,
            <br />
            nuestra huella
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-base md:text-lg text-gray-500 max-w-xl mx-auto md:mx-0 mb-4 leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Impresion y publicidad de calidad en Donihue. Poleras, pendones,
            stickers, bolsas y mas. Todo personalizado con tu marca.
          </motion.p>

          {/* DTF y DTG highlight */}
          <motion.p
            className="text-sm font-semibold mb-8"
            style={{ color: "#00B4D8" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Tecnologia{" "}
            <span className="inline-block px-2 py-0.5 rounded bg-[#00B4D8]/10 text-[#00B4D8] font-bold">
              DTF
            </span>{" "}
            y{" "}
            <span className="inline-block px-2 py-0.5 rounded bg-[#00B4D8]/10 text-[#00B4D8] font-bold">
              DTG
            </span>{" "}
            — alta definicion, colores vibrantes.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link
              href="/productos"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg font-bold text-sm text-white shadow-md hover:opacity-90 transition-opacity text-center"
              style={{ background: "#1B2A6B" }}
            >
              Ver Productos
            </Link>
            <a
              href="https://wa.me/56966126645?text=Hola%2C%20quiero%20cotizar%20un%20producto"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg font-bold text-sm border-2 hover:bg-[#FF9710] hover:text-white hover:border-[#FF9710] transition-all text-center"
              style={{ color: "#FF9710", borderColor: "#FF9710", background: "transparent" }}
            >
              Cotizar por WhatsApp
            </a>
          </motion.div>
        </motion.div>

        {/* Right: product image */}
        <motion.div
          className="hidden md:flex flex-1 items-center justify-center relative"
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          {/* Image container with orange circle backdrop */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{ maxWidth: "420px", width: "100%" }}
          >
            <div
              className="absolute inset-0 rounded-3xl"
              style={{ background: "linear-gradient(135deg, #FF971022 0%, #1B2A6B11 100%)" }}
            />
            <img
              src="https://printup.cl/cdn/shop/files/POLERAS.jpg"
              alt="Poleras personalizadas PrintUp"
              className="w-full h-auto object-cover rounded-3xl relative z-10"
              style={{ maxHeight: "420px", objectPosition: "center" }}
            />
          </div>

          {/* Floating badge */}
          <motion.div
            className="absolute -bottom-4 -left-4 z-20 bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2 border border-gray-100"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <span className="text-lg">👕</span>
            <div>
              <p className="text-xs font-bold text-[#1B2A6B] leading-tight">Impresion DTF &amp; DTG</p>
              <p className="text-xs text-gray-400 leading-tight">Alta calidad garantizada</p>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
