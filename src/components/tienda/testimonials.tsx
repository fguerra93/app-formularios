'use client'

import { useState, useEffect } from 'react'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { FloatingCircles } from './decorative'

const testimonials = [
  {
    name: 'Carolina Munoz',
    company: 'Cafe & Bistro Santiago',
    rating: 5,
    text: 'Excelente calidad en los pendones y la atencion fue rapida. Los colores quedaron perfectos y el material es muy resistente. Totalmente recomendados.',
    avatar: null,
  },
  {
    name: 'Andres Rojas',
    company: 'Gimnasio FitZone',
    rating: 5,
    text: 'Hicimos poleras DTF para todo el equipo y quedaron increibles. La impresion se mantiene como nueva despues de muchos lavados.',
    avatar: null,
  },
  {
    name: 'Maria Jose Tapia',
    company: 'Eventos MJT',
    rating: 5,
    text: 'Siempre recurro a PrintUp para mis eventos. La calidad de impresion es superior y los precios son muy competitivos. El despacho siempre es puntual.',
    avatar: null,
  },
  {
    name: 'Felipe Contreras',
    company: 'Constructora FC',
    rating: 4,
    text: 'Muy buen servicio para nuestras necesidades de senaletica y material publicitario. Responden rapido por WhatsApp y cumplen con los plazos.',
    avatar: null,
  },
]

export function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isPaused])

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)
  const next = () => setCurrent((c) => (c + 1) % testimonials.length)

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-[#F0F7FF] to-white">
      <FloatingCircles theme="testimonios" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1B2A6B]">
            Lo que dicen nuestros clientes
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#ec4899] to-[#f59e0b] mx-auto mt-4 rounded-full" />
        </div>

        <div
          className="max-w-3xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Quote icon */}
          <div className="flex justify-center mb-6">
            <Quote className="w-10 h-10 text-[#00B4D8]/20" />
          </div>

          {/* Testimonial card */}
          <div className="relative glass-white rounded-2xl p-8 md:p-10 text-center shadow-lg">
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5"
                  fill={i < testimonials[current].rating ? '#FFD100' : 'transparent'}
                  stroke={i < testimonials[current].rating ? '#FFD100' : '#D1D5DB'}
                />
              ))}
            </div>

            {/* Text */}
            <p className="text-[#1E293B] text-base md:text-lg leading-relaxed mb-6 italic">
              &ldquo;{testimonials[current].text}&rdquo;
            </p>

            {/* Author */}
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #1B2A6B, #00B4D8)' }}
              >
                {testimonials[current].name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-semibold text-[#1B2A6B] text-sm">
                  {testimonials[current].name}
                </div>
                <div className="text-xs text-[#64748B]">
                  {testimonials[current].company}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#F0F7FF] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#1B2A6B]" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? 'bg-[#00B4D8] w-6'
                      : 'bg-[#1B2A6B]/20 hover:bg-[#1B2A6B]/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#F0F7FF] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#1B2A6B]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
