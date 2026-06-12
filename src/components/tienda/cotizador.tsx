'use client'

import { useState } from 'react'
import { Send, Calculator } from 'lucide-react'
import { FloatingCircles, GlassmorphCard } from './decorative'

const productos = [
  'Poleras DTF/DTG',
  'Pendones / Roller',
  'Vinilo Adhesivo',
  'Flyers / Volantes',
  'Tarjetas de Presentacion',
  'Tela PVC / Lienzos',
  'Sublimacion',
  'Stickers / Etiquetas',
  'Senaletica',
  'Otro',
]

const materiales = [
  'Estandar',
  'Premium',
  'Vinilo',
  'Lona',
  'Tela',
  'Papel Couche',
  'Papel Bond',
  'Consultar',
]

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
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1115 0%, #0f1d5e 50%, #0f1115 100%)' }}>
      <FloatingCircles theme="hero" />

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm mb-4">
            <Calculator className="w-4 h-4" />
            Rapido y sin compromiso
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Cotiza tu proyecto en 30 segundos
          </h2>
          <p className="text-white/70 mt-2 text-sm md:text-base">
            Selecciona lo que necesitas y te respondemos al instante por WhatsApp
          </p>
        </div>

        <GlassmorphCard className="p-6 md:p-8 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Tipo */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Tipo de producto
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50 transition-colors"
              >
                <option value="" className="text-gray-800">Seleccionar...</option>
                {productos.map((p) => (
                  <option key={p} value={p} className="text-gray-800">{p}</option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Cantidad
              </label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej: 50"
                min={1}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50 transition-colors"
              />
            </div>

            {/* Material */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Material
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50 transition-colors"
              >
                <option value="" className="text-gray-800">Seleccionar...</option>
                {materiales.map((m) => (
                  <option key={m} value={m} className="text-gray-800">{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCotizar}
            className="w-full md:w-auto mx-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#0f1115] rounded-xl font-semibold text-sm hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            <Send className="w-4 h-4" />
            Obtener Cotizacion por WhatsApp
          </button>
        </GlassmorphCard>
      </div>
    </section>
  )
}
