'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'Que metodos de pago aceptan?',
    answer: 'Aceptamos MercadoPago (tarjetas de credito, debito y transferencia), transferencia bancaria directa y pago al retirar en tienda.',
  },
  {
    question: 'Cuanto demora el despacho?',
    answer: 'Realizamos despachos los dias miercoles y viernes. Los pedidos confirmados antes de las 14:00 del dia anterior se incluyen en el proximo despacho. Envio gratis en compras sobre $50.000.',
  },
  {
    question: 'En que formatos puedo enviar mi diseno?',
    answer: 'Aceptamos archivos en PDF, AI, PSD, EPS, SVG, PNG, JPG y TIFF. Para mejor calidad de impresion, recomendamos archivos vectoriales (AI, EPS, SVG) o imagenes en alta resolucion (300 DPI minimo).',
  },
  {
    question: 'Pueden hacer impresiones personalizadas?',
    answer: 'Si, todos nuestros productos son personalizables. Puedes enviar tu diseno o solicitar que nuestro equipo te ayude con el arte. Trabajamos con DTF, DTG, sublimacion, vinilo y mas.',
  },
  {
    question: 'Cual es la cantidad minima de pedido?',
    answer: 'No tenemos minimo de unidades. Puedes pedir desde 1 unidad. Para pedidos mayoristas ofrecemos precios especiales, consultanos por WhatsApp.',
  },
]

export function FaqAccordion({ limit }: { limit?: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const items = limit ? faqs.slice(0, limit) : faqs

  return (
    <div className="space-y-3">
      {items.map((faq, i) => (
        <div
          key={i}
          className="border border-[#e8eaee] rounded-xl overflow-hidden bg-white hover-glow transition-all"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-[#00B4D8] flex-shrink-0" />
              <span className="font-medium text-[#0f1115] text-sm md:text-base">
                {faq.question}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#5b6472] flex-shrink-0 transition-transform duration-300 ${
                openIndex === i ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === i ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-5 pb-4 pl-13 text-[#5b6472] text-sm leading-relaxed">
              {faq.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
