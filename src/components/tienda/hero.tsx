"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

/**
 * Hero "afiche de taller": fotografía REAL del trabajo a pantalla completa
 * bajo tinta, eslogan verdadero de la casa en tipografía de serigrafía
 * (Anton), trama de medios tonos y marquesina de servicios. Cero stock
 * genérico, cero tarjetas flotantes: el negocio en la cara.
 */

const SERVICIOS = [
  "Pendones y roller",
  "DTF textil",
  "Poleras personalizadas",
  "Gran formato",
  "Vinilo adhesivo",
  "Señalética",
  "Tazones y botellas",
  "Tote bags",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#0a0b0d" }}>
      {/* Pliego de prensa: planchas CMYK sobreimpresas (arte SVG propio) */}
      <img
        src="/img/hero-pliego.svg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      />
      {/* Velo de tinta suave para asegurar la lectura del texto */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(102deg, rgba(10,11,13,.88) 0%, rgba(10,11,13,.55) 45%, rgba(10,11,13,0) 75%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-24 min-h-[78vh] flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="mc-tech text-[12px] uppercase tracking-[0.16em] mb-5" style={{ color: "var(--mc-accent)" }}>
            Imprenta propia en Doñihue · respondemos en minutos
          </p>

          <h1 className="pl-poster text-white text-[15vw] sm:text-[11.5vw] lg:text-[6.6rem] xl:text-[7.2rem] max-w-5xl">
            Que tu marca
            <br />
            <span style={{ color: "var(--mc-accent)" }}>se vea en serio.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-white/75">
            Pendones, poleras, DTF y gran formato impresos en nuestro taller.
            Súbenos tu archivo o pruébalo aquí mismo: cotizas en minutos y lo
            tienes en 24–48&nbsp;h. Sin mínimos.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              href="/productos"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#0f1115] font-bold text-[15px] px-7 py-3.5 hover:bg-[#e8eaee] transition-colors"
            >
              Ver catálogo
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://wa.me/56966126645?text=Hola%2C%20quiero%20cotizar%20un%20producto"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold text-[15px] px-7 py-3.5 hover:border-white hover:bg-white/5 transition-colors"
            >
              Cotizar por WhatsApp
            </a>
          </div>

          {/* Qué resuelve, en una línea */}
          <div className="mt-7 flex flex-wrap gap-2.5">
            {["Cotiza en minutos, no en 48 h", "Desde 1 unidad", "Retiro gratis o despacho"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/75"
              >
                <Check className="size-3.5" style={{ color: "var(--mc-accent)" }} /> {t}
              </span>
            ))}
          </div>

          <p className="mc-tech mt-8 text-[12px] uppercase tracking-[0.1em] text-white/45">
            +500 clientes · +2.000 trabajos entregados · impreso en Doñihue
          </p>
        </motion.div>
      </div>

      {/* Marquesina de servicios — voz de taller, no carrusel de plantilla */}
      <div className="relative z-10 border-t border-white/12 overflow-hidden py-3.5" style={{ background: "rgba(10,11,13,.72)" }}>
        <div className="pl-marquee">
          {[0, 1].map((copia) => (
            <div key={copia} className="flex shrink-0" aria-hidden={copia === 1}>
              {SERVICIOS.map((s) => (
                <span key={`${copia}-${s}`} className="mc-tech flex items-center text-[12px] uppercase tracking-[0.14em] text-white/55 px-6">
                  <span className="mr-6" style={{ color: "var(--mc-accent)" }}>✕</span>
                  {s}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
