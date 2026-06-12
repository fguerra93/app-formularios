'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, FolderCheck, Clock, Zap } from 'lucide-react'
import { FloatingCircles, PulsingDots } from './decorative'

function useCountUp(end: number, duration: number = 2000, startCounting: boolean = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!startCounting) return
    let start = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration, startCounting])

  return count
}

const stats = [
  { value: 500, suffix: '+', label: 'Clientes Felices', icon: Users, color: '#00B4D8' },
  { value: 2000, suffix: '+', label: 'Proyectos Entregados', icon: FolderCheck, color: '#10b981' },
  { value: 5, suffix: ' anos', label: 'De Experiencia', icon: Clock, color: '#f59e0b' },
  { value: 24, suffix: 'h', label: 'Tiempo de Respuesta', icon: Zap, color: '#8b5cf6' },
]

export function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative py-16 md:py-24 overflow-hidden" style={{ background: '#0f1115' }}>
      <FloatingCircles theme="stats" />
      <PulsingDots color="rgba(255,255,255,0.3)" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Numeros que nos respaldan
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#00B4D8] to-[#FF9710] mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatItem({
  value,
  suffix,
  label,
  icon: Icon,
  color,
  isVisible,
}: (typeof stats)[0] & { isVisible: boolean }) {
  const count = useCountUp(value, 2000, isVisible)

  return (
    <div className="text-center">
      <div
        className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{
          background: `${color}20`,
          boxShadow: `0 0 30px ${color}25`,
        }}
      >
        <Icon className="w-7 h-7 md:w-8 md:h-8" style={{ color }} />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-white/60 text-sm">{label}</div>
    </div>
  )
}
