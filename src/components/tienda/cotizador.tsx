'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

const productos = [
  'Poleras DTF/DTG',
  'Pendones / Roller',
  'Vinilo Adhesivo',
  'Flyers / Volantes',
  'Tarjetas de Presentación',
  'Tela PVC / Lienzos',
  'Sublimación',
  'Stickers / Etiquetas',
  'Señalética',
  'Otro',
]

const materiales = [
  'Estándar',
  'Premium',
  'Vinilo',
  'Lona',
  'Tela',
  'Papel Couché',
  'Papel Bond',
  'Consultar',
]

/**
 * Cotizador inline — "orden de cotización" de taller sobre tinta plana.
 * Sin vidrio, sin círculos, sin degradados: panel oscuro con formulario
 * técnico y la promesa que nos diferencia: precio en minutos, no en días.
 */
export function CotizadorInline() {
  const [tipo, setTipo] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [material, setMaterial] = useState('')

  const handleCotizar = () => {
    const msg = `Hola PrintUp! Quiero cotizar:\n- Producto: ${tipo || 'No especificado'}\n- Cantidad: ${cantidad || 'No especificada'}\n- Material: ${material || 'No especificado'}`
    const url = `https://wa.me/56966126645?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <section className="px-4 py-16 md:py-20" style={{ background: 'var(--mc-ink)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-center">
          {/* Promesa */}
          <div>
            <span className="mc-tech text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--mc-accent)' }}>
              Orden de cotización
            </span>
            <h2 className="pl-poster text-4xl md:text-5xl text-white mt-3 mb-4">
              Cotiza rápido,
              <br />
              <span style={{ color: "var(--mc-accent)" }}>responde en minutos.</span>
            </h2>
            <p className="text-white/60 max-w-md text-sm md:text-base leading-relaxed">
              Dinos qué necesitas y te respondemos por WhatsApp con precio y plazo.
              Sin formularios eternos y sin compromiso.
            </p>
            <p className="mc-tech mt-6 text-[11px] uppercase tracking-[0.1em] text-white/40">
              Lun–Vie 9:00–18:00 · Sáb 10:00–14:00 · Respuesta &lt; 2 h hábiles
            </p>
          </div>

          {/* Formulario técnico */}
          <div className="rounded-2xl border border-white/12 p-6 md:p-8" style={{ background: 'rgba(255,255,255,.04)' }}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label htmlFor="cotiza-producto" className="mc-label-ink">Producto</label>
                <select
                  id="cotiza-producto"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="mc-select-ink"
                >
                  <option value="">Seleccionar…</option>
                  {productos.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cotiza-cantidad" className="mc-label-ink">Cantidad</label>
                <input
                  id="cotiza-cantidad"
                  type="number"
                  min={1}
                  placeholder="ej. 50"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="mc-input-ink mc-tech"
                />
              </div>
              <div>
                <label htmlFor="cotiza-material" className="mc-label-ink">Material</label>
                <select
                  id="cotiza-material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="mc-select-ink"
                >
                  <option value="">Seleccionar…</option>
                  {materiales.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCotizar}
              className="mc-btn mc-btn-accent w-full mt-6"
            >
              <Send className="size-4" />
              Cotizar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
