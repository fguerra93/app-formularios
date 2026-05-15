"use client";

import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { ModuleHero } from "@/components/tienda/module-hero";
import { StatsCounter } from "@/components/tienda/stats-counter";
import { FloatingCircles, PulsingDots, RotatingRing, GlassmorphCard } from "@/components/tienda/decorative";
import { ScheduleBadgeInline } from "@/components/tienda/schedule-badge";
import { ScrollReveal } from "@/components/tienda/motion";
import { MapPin, Clock, Phone, Mail, Printer, Palette, Shirt, Flag, Heart, Target, Award } from "lucide-react";

const servicios = [
  {
    icon: Printer,
    titulo: "Impresion Digital",
    descripcion: "Impresiones de alta calidad en diversos formatos y materiales para todo tipo de proyectos.",
    color: "#00B4D8",
  },
  {
    icon: Shirt,
    titulo: "DTF / DTG Textil",
    descripcion: "Estampado directo en textiles con tecnologia de ultima generacion. Colores vibrantes y durables.",
    color: "#8b5cf6",
  },
  {
    icon: Flag,
    titulo: "Pendones y Banderas",
    descripcion: "Roller banners, pendones PVC y banderas publicitarias de alta resistencia.",
    color: "#FF9710",
  },
  {
    icon: Palette,
    titulo: "Sublimacion",
    descripcion: "Productos sublimados: botellas, tazas, cojines, poleras y mucho mas.",
    color: "#10b981",
  },
];

const timeline = [
  {
    year: "Inicio",
    title: "Nace PrintUp",
    desc: "PrintUp nace en Donihue con la mision de acercar servicios de impresion profesional a emprendedores y empresas de la Region de O'Higgins.",
  },
  {
    year: "Crecimiento",
    title: "Tecnologia DTF y DTG",
    desc: "Incorporamos tecnologia de impresion DTF, DTG y sublimacion, ampliando nuestras capacidades para ofrecer soluciones integrales.",
  },
  {
    year: "Hoy",
    title: "Tu aliado de confianza",
    desc: "Mas de 500 clientes confian en nosotros. Desde una polera personalizada hasta campanas completas de pendones y banderas.",
  },
];

export default function NosotrosPage() {
  return (
    <div className="pb-0">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: "Sobre Nosotros" }]} />

        {/* Module Hero */}
        <ModuleHero
          title="Sobre PrintUp"
          subtitle="Tu impresion, nuestra huella. Desde Donihue para toda la Region de O'Higgins."
          icon={<Heart className="w-6 h-6" />}
          theme="nosotros"
        />

        {/* Timeline */}
        <section className="mb-16 relative">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2">
              Nuestra Historia
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#8b5cf6] to-[#00B4D8] mx-auto mt-4 rounded-full" />
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8b5cf6] via-[#00B4D8] to-[#10b981]" />

            <div className="space-y-8 md:space-y-12">
              {timeline.map((item, i) => (
                <ScrollReveal key={i}>
                  <div className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    {/* Dot */}
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-3 border-[#00B4D8] z-10 animate-pulse-dot" />

                    {/* Card */}
                    <div className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${i % 2 === 0 ? '' : 'md:ml-auto'}`}>
                      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 hover-glow transition-all">
                        <span className="inline-block px-3 py-1 rounded-full bg-[#00B4D8]/10 text-[#00B4D8] text-xs font-bold mb-3">
                          {item.year}
                        </span>
                        <h3 className="font-bold text-[#1E293B] text-lg mb-2">{item.title}</h3>
                        <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Servicios */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2">
              Nuestros Servicios
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#FF9710] to-[#00B4D8] mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {servicios.map((s) => (
              <div
                key={s.titulo}
                className="group bg-white rounded-xl border border-[#E2E8F0] p-6 flex gap-4 hover-glow transition-all"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    background: `${s.color}15`,
                    boxShadow: `0 0 20px ${s.color}20`,
                  }}
                >
                  <s.icon className="size-7" style={{ color: s.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B] mb-1">{s.titulo}</h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">{s.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Valores */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Nuestra Mision", desc: "Entregar soluciones de impresion de calidad, accesibles para todos, con atencion personalizada.", color: "#00B4D8" },
              { icon: Award, title: "Calidad Garantizada", desc: "Usamos la mejor tecnologia y materiales para que cada proyecto quede perfecto.", color: "#FF9710" },
              { icon: Heart, title: "Compromiso", desc: "Tu satisfaccion es nuestra prioridad. Cumplimos plazos y superamos expectativas.", color: "#10b981" },
            ].map((v) => (
              <div key={v.title} className="text-center p-6 rounded-xl bg-white border border-[#E2E8F0] hover-glow transition-all">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${v.color}15`, boxShadow: `0 0 20px ${v.color}15` }}
                >
                  <v.icon className="size-7" style={{ color: v.color }} />
                </div>
                <h3 className="font-bold text-[#1E293B] mb-2">{v.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Visitanos */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2">
              Visitanos
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#14b8a6] to-[#00B4D8] mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5">
              {/* Schedule badge */}
              <div className="flex justify-start">
                <ScheduleBadgeInline />
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00B4D8]/10 flex items-center justify-center shrink-0">
                  <MapPin className="size-5 text-[#00B4D8]" />
                </div>
                <div>
                  <p className="font-medium text-[#1E293B]">Direccion</p>
                  <p className="text-sm text-[#64748B]">
                    Errazuriz 09, Donihue, Region de O&apos;Higgins
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center shrink-0">
                  <Clock className="size-5 text-[#8b5cf6]" />
                </div>
                <div>
                  <p className="font-medium text-[#1E293B]">Horario</p>
                  <p className="text-sm text-[#64748B]">Lunes a Viernes: 9:00 - 18:00</p>
                  <p className="text-sm text-[#64748B]">Sabado: 10:00 - 14:00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center shrink-0">
                  <Phone className="size-5 text-[#10b981]" />
                </div>
                <div>
                  <p className="font-medium text-[#1E293B]">Telefono / WhatsApp</p>
                  <a href="tel:+56966126645" className="text-sm text-[#00B4D8] hover:underline">+56 9 66126645</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF9710]/10 flex items-center justify-center shrink-0">
                  <Mail className="size-5 text-[#FF9710]" />
                </div>
                <div>
                  <p className="font-medium text-[#1E293B]">Email</p>
                  <a href="mailto:contacto@printup.cl" className="text-sm text-[#00B4D8] hover:underline">contacto@printup.cl</a>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/56966126645?text=Hola%20PrintUp,%20quiero%20visitarlos!"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebe5a] transition-colors"
              >
                Escribenos por WhatsApp
              </a>
            </div>

            {/* Google Maps embed */}
            <div className="rounded-xl overflow-hidden border border-[#E2E8F0] min-h-[350px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.5!2d-70.9456!3d-34.1083!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sErrazuriz%2009%2C%20Donihue!5e0!3m2!1ses!2scl!4v1700000000000"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 350 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicacion PrintUp en Google Maps"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Stats - full width */}
      <StatsCounter />
    </div>
  );
}
