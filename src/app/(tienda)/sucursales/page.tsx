"use client";

import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { ModuleHero } from "@/components/tienda/module-hero";
import { ScheduleBadgeInline } from "@/components/tienda/schedule-badge";
import { FloatingCircles, PulsingDots } from "@/components/tienda/decorative";
import { MapPin, Clock, Phone, Mail, Printer, Shirt, Flag, Palette, Scissors, Package, Navigation } from "lucide-react";

const serviciosTaller = [
  { icon: Printer, title: "Impresion Digital", desc: "Gran formato, flyers, tarjetas y mas", color: "#00B4D8" },
  { icon: Shirt, title: "Estampado DTF/DTG", desc: "Poleras, buzos y textiles personalizados", color: "#8b5cf6" },
  { icon: Flag, title: "Pendones y Banderas", desc: "Roller banners y banderas publicitarias", color: "#FF9710" },
  { icon: Palette, title: "Sublimacion", desc: "Tazas, botellas, cojines y mas", color: "#10b981" },
  { icon: Scissors, title: "Corte y Terminaciones", desc: "Corte a medida, laminado y montaje", color: "#ec4899" },
  { icon: Package, title: "Retiro en Tienda", desc: "Retira tus pedidos sin costo", color: "#f59e0b" },
];

export default function SucursalesPage() {
  return (
    <div className="pb-0">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: "Nuestro Taller" }]} />

        {/* Module Hero */}
        <ModuleHero
          title="Nuestro Taller"
          subtitle="Conoce donde hacemos magia con tus disenos"
          icon={<MapPin className="w-6 h-6" />}
          theme="sucursales"
        />

        {/* Location Card */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl border border-[#e8eaee] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Info */}
              <div className="p-6 md:p-8 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#0f1115] mb-3">Taller PrintUp - Donihue</h2>
                  <ScheduleBadgeInline />
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#00B4D8]/10 flex items-center justify-center shrink-0">
                      <MapPin className="size-5 text-[#00B4D8]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#0f1115] text-sm">Direccion</p>
                      <p className="text-sm text-[#5b6472]">Errazuriz 09 / Francisco Lira 082</p>
                      <p className="text-sm text-[#5b6472]">Donihue, Region de O&apos;Higgins</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center shrink-0">
                      <Clock className="size-5 text-[#8b5cf6]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#0f1115] text-sm">Horario</p>
                      <p className="text-sm text-[#5b6472]">Lunes a Viernes: 9:00 - 18:00</p>
                      <p className="text-sm text-[#5b6472]">Sabado: 10:00 - 14:00</p>
                      <p className="text-sm text-[#5b6472]">Domingo: Cerrado</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center shrink-0">
                      <Phone className="size-5 text-[#10b981]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#0f1115] text-sm">Telefono / WhatsApp</p>
                      <a href="tel:+56966126645" className="text-sm text-[#00B4D8] hover:underline">+56 9 66126645</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF9710]/10 flex items-center justify-center shrink-0">
                      <Mail className="size-5 text-[#FF9710]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#0f1115] text-sm">Email</p>
                      <a href="mailto:contacto@printup.cl" className="text-sm text-[#00B4D8] hover:underline">contacto@printup.cl</a>
                    </div>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="https://wa.me/56966126645?text=Hola%20PrintUp,%20quiero%20agendar%20una%20visita"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebe5a] transition-colors"
                  >
                    Agenda tu visita
                  </a>
                  <a
                    href="https://maps.google.com/?q=Errazuriz+09,+Donihue,+Chile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#e8eaee] text-[#0f1115] font-semibold text-sm hover:bg-[#fafafb] transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Como llegar
                  </a>
                </div>
              </div>

              {/* Photo + Map */}
              <div className="flex flex-col">
                {/* Workshop photo */}
                <div className="h-[200px] bg-gradient-to-br from-[#0f1115] to-[#00B4D8] flex items-center justify-center">
                  <div className="text-center text-white/80">
                    <MapPin className="size-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Taller PrintUp</p>
                    <p className="text-xs opacity-60">Donihue, O&apos;Higgins</p>
                  </div>
                </div>
                {/* Map */}
                <div className="flex-1 min-h-[250px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.5!2d-70.9456!3d-34.1083!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sErrazuriz%2009%2C%20Donihue!5e0!3m2!1ses!2scl!4v1700000000000"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: 250 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicacion PrintUp en Google Maps"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como llegar - Directions */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-[#fafafb] to-white rounded-2xl border border-[#e8eaee] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#14b8a6]/10 flex items-center justify-center">
                <Navigation className="size-5 text-[#14b8a6]" />
              </div>
              <h3 className="font-bold text-[#0f1115] text-lg">Como llegar</h3>
            </div>
            <div className="space-y-3 text-sm text-[#5b6472]">
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-[#14b8a6] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <p>Desde Rancagua, tomar la Ruta H-30 hacia Donihue (15 min aprox).</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-[#14b8a6] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <p>Al llegar a Donihue, buscar calle Errazuriz (a cuadras de la plaza).</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-[#14b8a6] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <p>Esquina Errazuriz con Francisco Lira. Entrada por Francisco Lira 082.</p>
              </div>
              <div className="flex items-start gap-2 p-3 bg-[#FEF3C7] rounded-lg border border-[#F59E0B]/30">
                <span className="text-[#F59E0B] text-lg">&#128276;</span>
                <p className="text-[#92400E] font-medium">Tocar el timbre por favor. Estacionamiento disponible en la calle.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Servicios disponibles en taller */}
        <section className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0f1115] mb-2">
              Servicios en Nuestro Taller
            </h2>
            <p className="text-[#5b6472]">Todo lo que puedes hacer cuando nos visitas</p>
            <div className="w-16 h-1 bg-gradient-to-r from-[#14b8a6] to-[#00B4D8] mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {serviciosTaller.map((s) => (
              <div
                key={s.title}
                className="group bg-white rounded-xl border border-[#e8eaee] p-5 flex items-start gap-4 hover-glow transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    background: `${s.color}15`,
                    boxShadow: `0 0 20px ${s.color}15`,
                  }}
                >
                  <s.icon className="size-6" style={{ color: s.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0f1115] text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-[#5b6472]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA full width */}
      <section className="relative py-16 px-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}>
        <FloatingCircles theme="sucursales" />
        <PulsingDots color="rgba(255,255,255,0.3)" />
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
            Te esperamos en nuestro taller
          </h2>
          <p className="text-white/70 mb-8">
            Ven a conocernos, trae tu proyecto y juntos lo hacemos realidad
          </p>
          <a
            href="https://wa.me/56966126645?text=Hola%20PrintUp,%20quiero%20agendar%20una%20visita%20al%20taller"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0f766e] font-bold text-sm hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            Agenda por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
