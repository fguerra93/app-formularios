'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

function getChileTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }))
}

function getScheduleStatus() {
  const now = getChileTime()
  const day = now.getDay() // 0=Sunday
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const time = hours * 60 + minutes

  // Mon-Fri: 9:00 - 18:00
  if (day >= 1 && day <= 5) {
    if (time >= 540 && time < 1080) {
      const remaining = 1080 - time
      const h = Math.floor(remaining / 60)
      const m = remaining % 60
      return {
        isOpen: true,
        text: 'Abierto ahora',
        detail: `Cierra en ${h}h ${m}m`,
      }
    }
  }

  // Sat: 10:00 - 14:00
  if (day === 6) {
    if (time >= 600 && time < 840) {
      const remaining = 840 - time
      const h = Math.floor(remaining / 60)
      const m = remaining % 60
      return {
        isOpen: true,
        text: 'Abierto ahora',
        detail: `Cierra en ${h}h ${m}m`,
      }
    }
  }

  // Closed - find next opening
  let nextDay = ''
  if (day === 6 && time >= 840) nextDay = 'Lunes 09:00'
  else if (day === 0) nextDay = 'Lunes 09:00'
  else if (day >= 1 && day <= 4 && time >= 1080) nextDay = 'manana 09:00'
  else if (day === 5 && time >= 1080) nextDay = 'Sabado 10:00'
  else if (day >= 1 && day <= 5 && time < 540) nextDay = 'hoy 09:00'
  else if (day === 6 && time < 600) nextDay = 'hoy 10:00'
  else nextDay = 'Lunes 09:00'

  return {
    isOpen: false,
    text: 'Cerrado',
    detail: `Abre ${nextDay}`,
  }
}

export function ScheduleBadge({ showDetail = true }: { showDetail?: boolean }) {
  const [status, setStatus] = useState<ReturnType<typeof getScheduleStatus> | null>(null)

  useEffect(() => {
    setStatus(getScheduleStatus())
    const interval = setInterval(() => setStatus(getScheduleStatus()), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!status) return null

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status.isOpen ? 'status-dot-open' : 'status-dot-closed'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            status.isOpen ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </span>
      <span className={status.isOpen ? 'text-green-400' : 'text-red-400'}>
        {status.text}
      </span>
      {showDetail && (
        <span className="text-white/50 hidden sm:inline">· {status.detail}</span>
      )}
    </div>
  )
}

export function ScheduleBadgeInline() {
  const [status, setStatus] = useState<ReturnType<typeof getScheduleStatus> | null>(null)

  useEffect(() => {
    setStatus(getScheduleStatus())
    const interval = setInterval(() => setStatus(getScheduleStatus()), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!status) return null

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
      <Clock className="w-3.5 h-3.5 text-white/60" />
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status.isOpen ? 'status-dot-open' : 'status-dot-closed'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            status.isOpen ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </span>
      <span className={`text-xs font-medium ${status.isOpen ? 'text-green-400' : 'text-red-400'}`}>
        {status.text}
      </span>
      <span className="text-white/40 text-xs">· Lun-Vie 9-18 · Sab 10-14</span>
    </div>
  )
}
