'use client'

import { type ReactNode } from 'react'

// ========== Color themes for modules ==========
const themes = {
  hero: { from: '#1B2A6B', to: '#00B4D8', accent: '#00B4D8' },
  productos: { from: '#3730a3', to: '#818cf8', accent: '#818cf8' },
  categorias: { from: '#0369a1', to: '#60a5fa', accent: '#60a5fa' },
  contacto: { from: '#be185d', to: '#e91e8c', accent: '#e91e8c' },
  nosotros: { from: '#5b21b6', to: '#8b5cf6', accent: '#8b5cf6' },
  cotizador: { from: '#047857', to: '#10b981', accent: '#10b981' },
  servicios: { from: '#b45309', to: '#f59e0b', accent: '#f59e0b' },
  stats: { from: '#1B2A6B', to: '#7c3aed', accent: '#7c3aed' },
  testimonios: { from: '#9d174d', to: '#ec4899', accent: '#ec4899' },
  faq: { from: '#334155', to: '#64748b', accent: '#64748b' },
  sucursales: { from: '#0f766e', to: '#14b8a6', accent: '#14b8a6' },
  portafolio: { from: '#7e22ce', to: '#a855f7', accent: '#a855f7' },
  newsletter: { from: '#3730a3', to: '#6366f1', accent: '#6366f1' },
} as const

export type ThemeName = keyof typeof themes

export function getTheme(name: ThemeName) {
  return themes[name]
}

// ========== Floating Circles ==========
export function FloatingCircles({
  theme = 'hero',
  className = '',
}: {
  theme?: ThemeName
  className?: string
}) {
  const t = themes[theme]
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <div
        className="absolute w-72 h-72 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: t.from, top: '10%', left: '-5%' }}
      />
      <div
        className="absolute w-96 h-96 rounded-full opacity-15 blur-3xl animate-float-delay"
        style={{ background: t.accent, bottom: '5%', right: '-8%' }}
      />
      <div
        className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl animate-float-slow"
        style={{ background: t.to, top: '40%', left: '50%' }}
      />
    </div>
  )
}

// ========== Rotating Ring ==========
export function RotatingRing({
  size = 120,
  color = '#00B4D8',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <div className={`absolute pointer-events-none ${className}`} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="animate-rotate-slow"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="8 6"
          opacity="0.3"
        />
      </svg>
    </div>
  )
}

// ========== Pulsing Dots ==========
export function PulsingDots({
  color = '#00B4D8',
  className = '',
}: {
  color?: string
  className?: string
}) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      <div
        className="absolute w-2 h-2 rounded-full animate-pulse-dot"
        style={{ background: color, top: '12%', right: '8%' }}
      />
      <div
        className="absolute w-1.5 h-1.5 rounded-full animate-pulse-dot"
        style={{ background: color, bottom: '15%', left: '10%', animationDelay: '0.5s' }}
      />
      <div
        className="absolute w-2.5 h-2.5 rounded-full animate-pulse-dot"
        style={{ background: color, top: '60%', right: '15%', animationDelay: '1s' }}
      />
      <div
        className="absolute w-1.5 h-1.5 rounded-full animate-pulse-dot hidden md:block"
        style={{ background: color, top: '25%', left: '30%', animationDelay: '1.5s' }}
      />
    </div>
  )
}

// ========== Glow Icon ==========
export function GlowIcon({
  children,
  color = '#00B4D8',
  size = 'md',
  className = '',
}: {
  children: ReactNode
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl ${sizes[size]} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        boxShadow: `0 0 24px ${color}30`,
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl animate-glow"
        style={{ '--tw-shadow-color': color } as React.CSSProperties}
      />
      <div className="relative z-10 text-white" style={{ color }}>
        {children}
      </div>
    </div>
  )
}

// ========== Accent Line ==========
export function AccentLine({
  className = '',
  colors,
}: {
  className?: string
  colors?: [string, string, string]
}) {
  const [c1, c2, c3] = colors || ['#1B2A6B', '#00B4D8', '#FF9710']
  return (
    <div
      className={`accent-line w-full rounded-full ${className}`}
      style={{
        background: `linear-gradient(90deg, ${c1}, ${c2}, ${c3}, ${c2}, ${c1})`,
        backgroundSize: '200% 100%',
      }}
    />
  )
}

// ========== Glassmorphism Card ==========
export function GlassmorphCard({
  children,
  className = '',
  variant = 'light',
}: {
  children: ReactNode
  className?: string
  variant?: 'light' | 'dark' | 'white'
}) {
  const variantClass = variant === 'dark' ? 'glass-dark' : variant === 'white' ? 'glass-white' : 'glass'
  return (
    <div className={`${variantClass} rounded-2xl ${className}`}>
      {children}
    </div>
  )
}

// ========== Dot Pattern Background ==========
export function DotPattern({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none opacity-[0.03] ${className}`} aria-hidden="true">
      <svg width="100%" height="100%">
        <pattern id="dotpattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="currentColor" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#dotpattern)" />
      </svg>
    </div>
  )
}
