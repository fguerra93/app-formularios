'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Banda de datos del taller — estilo "pliego": cifras tabulares grandes,
 * etiquetas en voz técnica, separadas por filetes. Sin iconos ni colores.
 * Los números muestran su valor final por defecto; el conteo es solo
 * una mejora progresiva cuando la banda entra en pantalla.
 */
const stats = [
  { value: 500, prefix: '+', suffix: '', label: 'Clientes atendidos' },
  { value: 2000, prefix: '+', suffix: '', label: 'Trabajos entregados' },
  { value: 5, prefix: '', suffix: ' años', label: 'Imprimiendo en O’Higgins' },
  { value: 24, prefix: '<', suffix: ' h', label: 'Respuesta por WhatsApp' },
]

function useCountUp(end: number, run: boolean, duration = 1200) {
  const [count, setCount] = useState(end)

  useEffect(() => {
    if (!run) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      setCount(Math.round(end * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end, run, duration])

  return count
}

export function StatsCounter() {
  const ref = useRef<HTMLElement>(null)
  const [run, setRun] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRun(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} style={{ background: 'var(--mc-surface)' }} className="border-y border-[#e8eaee]">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10">
          {stats.map((stat, i) => (
            <StatItem key={stat.label} {...stat} run={run} divider={i > 0} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatItem({
  value,
  prefix,
  suffix,
  label,
  run,
  divider,
}: (typeof stats)[0] & { run: boolean; divider: boolean }) {
  const count = useCountUp(value, run)

  return (
    <div
      className={`px-6 first:pl-0 ${divider ? 'md:border-l md:border-[#e8eaee]' : ''}`}
    >
      <div
        className="mc-tech text-4xl md:text-5xl font-bold tracking-tight"
        style={{ color: 'var(--mc-ink)' }}
      >
        {prefix}
        {count.toLocaleString('es-CL')}
        {suffix}
      </div>
      <div
        className="mc-tech mt-2 text-[11px] uppercase tracking-[0.1em]"
        style={{ color: 'var(--mc-ink-2)' }}
      >
        {label}
      </div>
    </div>
  )
}
