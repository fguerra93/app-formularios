'use client'

import { type ReactNode } from 'react'

/**
 * Cabecera de módulo minimal claro: eyebrow/ícono + título fuerte + bajada,
 * sobre blanco y cerrada con una regla de 1px. Sin gradientes, círculos
 * flotantes ni líneas degradadas. Mantiene la API previa (incluye `theme`,
 * que ahora se ignora visualmente) para no romper a quien la usa.
 */
export function ModuleHero({
  title,
  subtitle,
  icon,
  actions,
  compact = false,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  theme?: string
  actions?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={compact ? 'mb-7' : 'mb-9'}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border border-[#e8eaee] bg-white text-[#0f1115] shadow-[0_1px_2px_rgba(15,17,21,.04)]">
              {icon}
            </div>
          )}
          <div>
            <h1
              className={`mc-display text-balance ${compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'}`}
            >
              {title}
            </h1>
            {subtitle && <p className="mc-sub mt-1.5 max-w-xl">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      <hr className="mc-rule mt-5" />
    </div>
  )
}
