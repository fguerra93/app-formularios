"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, MapPin } from "lucide-react";

/**
 * Hero "afiche de taller" — composición central (badge → titular → checks →
 * CTAs → métricas → ubicación) sobre el pliego CMYK propio. Estilo PrintUp
 * (acento cyan, tipografía de serigrafía Anton, marquesina de servicios).
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

const STATS = [
  { n: "+500", l: "clientes que confían" },
  { n: "+2.000", l: "trabajos entregados" },
  { n: "24–48 h", l: "y lo tienes listo" },
];

const CHECKS = ["Cotiza en minutos", "Desde 1 unidad", "Impreso en Doñihue", "Boleta y factura"];

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
      {/* Velo de tinta — scrim equilibrado para texto centrado legible */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,11,13,.82) 0%, rgba(10,11,13,.6) 36%, rgba(10,11,13,.62) 64%, rgba(10,11,13,.92) 100%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-14 pb-14 md:pt-20 md:pb-20 min-h-[82vh] flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <span
            className="mc-tech inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.16em]"
            style={{ borderColor: "rgba(0,180,216,.35)", background: "rgba(0,180,216,.10)", color: "var(--mc-accent)" }}
          >
            <span className="size-1.5 rounded-full" style={{ background: "var(--mc-accent)" }} />
            Imprenta propia en Doñihue · O&apos;Higgins
          </span>

          {/* Titular */}
          <h1 className="pl-poster mt-6 text-white text-[12.5vw] sm:text-[9vw] lg:text-[6rem] xl:text-[6.6rem] leading-[0.92]">
            Imprime tu marca
            <br />
            <span style={{ color: "var(--mc-accent)" }}>en 24–48 horas.</span>
          </h1>

          {/* Subtítulo */}
          <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-white/75">
            Pendones, poleras, DTF y gran formato impresos en nuestro taller.
            Calidad profesional, cotización en minutos y sin mínimos.
          </p>

          {/* Checks */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-white/70">
            {CHECKS.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5">
                <Check className="size-4" style={{ color: "var(--mc-accent)" }} /> {f}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/56966126645?text=Hola%2C%20quiero%20cotizar%20un%20producto"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold text-[15px] px-7 py-3.5 hover:bg-[#1ebe5a] transition-colors"
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.17 0-4.207-.666-5.895-1.803l-.422-.262-2.753.871.912-2.686-.29-.44A9.712 9.712 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" /></svg>
              Cotizar por WhatsApp
            </a>
            <Link
              href="/productos"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold text-[15px] px-7 py-3.5 hover:border-white hover:bg-white/5 transition-colors"
            >
              Ver catálogo
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Métricas */}
          <div className="mt-12 grid grid-cols-3 gap-6 sm:gap-12">
            {STATS.map((s) => (
              <div key={s.l}>
                <p className="pl-poster text-3xl md:text-4xl lg:text-5xl" style={{ color: "var(--mc-accent)" }}>{s.n}</p>
                <p className="mc-tech mt-1 text-[10px] uppercase tracking-[0.1em] text-white/50">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Ubicación */}
          <div
            className="mt-10 inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-[12px] text-white/65"
            style={{ borderColor: "rgba(255,255,255,.14)", background: "rgba(10,11,13,.45)" }}
          >
            <MapPin className="size-3.5" style={{ color: "var(--mc-accent)" }} />
            Taller en Doñihue · retiro gratis · despacho a todo Chile
          </div>
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
