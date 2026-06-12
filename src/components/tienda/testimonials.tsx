'use client'

import { useState, useEffect } from 'react'
import { Star, ArrowLeft, ArrowRight } from 'lucide-react'

const testimonials = [
  {
    name: 'Carolina Muñoz',
    company: 'Café & Bistró Santiago',
    rating: 5,
    text: 'Excelente calidad en los pendones y la atención fue rápida. Los colores quedaron perfectos y el material es muy resistente. Totalmente recomendados.',
  },
  {
    name: 'Andrés Rojas',
    company: 'Gimnasio FitZone',
    rating: 5,
    text: 'Hicimos poleras DTF para todo el equipo y quedaron increíbles. La impresión se mantiene como nueva después de muchos lavados.',
  },
  {
    name: 'María José Tapia',
    company: 'Eventos MJT',
    rating: 5,
    text: 'Siempre recurro a PrintUp para mis eventos. La calidad de impresión es superior y los precios son muy competitivos. El despacho siempre es puntual.',
  },
  {
    name: 'Felipe Contreras',
    company: 'Constructora FC',
    rating: 4,
    text: 'Muy buen servicio para nuestras necesidades de señalética y material publicitario. Responden rápido por WhatsApp y cumplen con los plazos.',
  },
]

/**
 * Testimonios editoriales — cita grande alineada a la izquierda, autor con
 * filete, paginación en voz técnica. Sin blobs, sin carrusel centrado de
 * plantilla, sin estrellas amarillas.
 */
export function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused])

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)
  const next = () => setCurrent((c) => (c + 1) % testimonials.length)
  const t = testimonials[current]

  return (
    <section style={{ background: 'var(--mc-surface)' }} className="border-y border-[#e8eaee]">
      <div
        className="max-w-7xl mx-auto px-4 py-16 md:py-20 grid lg:grid-cols-[1fr_2fr] gap-10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Columna izquierda: título + controles */}
        <div className="flex flex-col justify-between gap-8">
          <div>
            <span className="mc-eyebrow">Clientes</span>
            <h2 className="mc-h2 mt-3">Lo que dicen de nuestro trabajo</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={prev}
              aria-label="Testimonio anterior"
              className="size-10 rounded-lg border bg-white flex items-center justify-center transition-colors hover:border-[#0f1115]"
              style={{ borderColor: 'var(--mc-line-2)', color: 'var(--mc-ink)' }}
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              onClick={next}
              aria-label="Testimonio siguiente"
              className="size-10 rounded-lg border bg-white flex items-center justify-center transition-colors hover:border-[#0f1115]"
              style={{ borderColor: 'var(--mc-line-2)', color: 'var(--mc-ink)' }}
            >
              <ArrowRight className="size-4" />
            </button>
            <span className="mc-tech text-xs ml-1" style={{ color: 'var(--mc-ink-2)' }}>
              {String(current + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Cita */}
        <figure className="border-l pl-8 md:pl-12" style={{ borderColor: 'var(--mc-line-2)' }}>
          <div className="flex gap-1 mb-5" aria-label={`${t.rating} de 5 estrellas`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-4"
                fill={i < t.rating ? 'var(--mc-ink)' : 'transparent'}
                stroke={i < t.rating ? 'var(--mc-ink)' : 'var(--mc-line-2)'}
              />
            ))}
          </div>
          <blockquote
            className="text-xl md:text-2xl font-medium leading-snug tracking-tight"
            style={{ color: 'var(--mc-ink)' }}
          >
            “{t.text}”
          </blockquote>
          <figcaption className="mt-6">
            <span className="font-semibold text-sm" style={{ color: 'var(--mc-ink)' }}>{t.name}</span>
            <span className="mc-tech text-xs ml-3 uppercase tracking-[0.08em]" style={{ color: 'var(--mc-ink-2)' }}>
              {t.company}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
