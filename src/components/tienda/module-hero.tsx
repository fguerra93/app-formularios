'use client'

import { type ReactNode } from 'react'
import { FloatingCircles, RotatingRing, PulsingDots, AccentLine, type ThemeName, getTheme } from './decorative'

export function ModuleHero({
  title,
  subtitle,
  icon,
  theme = 'hero',
  actions,
  compact = false,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  theme?: ThemeName
  actions?: ReactNode
  compact?: boolean
}) {
  const t = getTheme(theme)

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
        }}
      />

      {/* Decorative elements */}
      <FloatingCircles theme={theme} />
      <PulsingDots color="rgba(255,255,255,0.5)" />

      {/* Rotating ring behind icon */}
      {icon && (
        <RotatingRing
          size={100}
          color="rgba(255,255,255,0.15)"
          className="top-1/2 left-6 -translate-y-1/2 hidden md:block"
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          compact ? 'px-6 py-5 md:px-8 md:py-6' : 'px-6 py-8 md:px-8 md:py-10'
        }`}
      >
        <div className="flex items-center gap-4">
          {icon && (
            <div
              className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.15)',
                boxShadow: `0 0 30px ${t.accent}40`,
              }}
            >
              <div className="text-white">{icon}</div>
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{title}</h1>
            {subtitle && (
              <p className="text-white/70 text-sm md:text-base mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      {/* Accent line at bottom */}
      <AccentLine colors={[t.from, '#ffffff80', t.to]} />
    </div>
  )
}
