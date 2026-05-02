"use client";

import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { MapPin, Clock, Phone, Mail, Printer, Palette, Shirt, Flag } from "lucide-react";

const servicios = [
  {
    icon: Printer,
    titulo: "Impresion Digital",
    descripcion: "Impresiones de alta calidad en diversos formatos y materiales.",
  },
  {
    icon: Shirt,
    titulo: "DTF / DTG Textil",
    descripcion: "Estampado directo en textiles con tecnologia de ultima generacion.",
  },
  {
    icon: Flag,
    titulo: "Pendones y Banderas",
    descripcion: "Roller banners, pendones PVC y banderas publicitarias.",
  },
  {
    icon: Palette,
    titulo: "Sublimacion",
    descripcion: "Productos sublimados: botellas, tazas, cojines y mas.",
  },
];

export default function NosotrosPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Sobre Nosotros" }]} />

      {/* Hero */}
      <section className="text-center mb-16">
        <h1
          className="text-4xl md:text-5xl font-extrabold text-[#1E293B] mb-4"
          style={{ letterSpacing: "-0.02em" }}
        >
          Sobre <span className="text-[#00B4D8]">PrintUp</span>
        </h1>
        <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
          Tu impresion, nuestra huella. Desde Donihue para toda la Region de
          O&apos;Higgins, somos tu aliado en impresion y publicidad.
        </p>
      </section>

      {/* Historia */}
      <section className="mb-16">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 md:p-12">
          <h2 className="text-2xl font-extrabold text-[#1B2A6B] mb-4">
            Nuestra Historia
          </h2>
          <div className="space-y-4 text-[#475569] leading-relaxed">
            <p>
              PrintUp nace en Donihue con la mision de acercar servicios de
              impresion profesional a emprendedores, empresas y personas de la
              Region de O&apos;Higgins. Creemos que cada proyecto merece una
              impresion de calidad, sin importar su tamano.
            </p>
            <p>
              Con tecnologia de impresion DTF, DTG, sublimacion y grafica de
              gran formato, ofrecemos soluciones integrales para publicidad,
              merchandising y personalizacion de productos. Desde una polera
              personalizada hasta una campana completa de pendones y banderas.
            </p>
            <p>
              Nuestro compromiso es simple: entregar calidad, cumplir plazos y
              hacer que tu marca destaque. Tu impresion es nuestra huella.
            </p>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="mb-16">
        <h2 className="text-2xl font-extrabold text-[#1E293B] mb-6 text-center">
          Nuestros Servicios
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {servicios.map((s) => (
            <div
              key={s.titulo}
              className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] flex items-center justify-center shrink-0">
                <s.icon className="size-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B] mb-1">{s.titulo}</h3>
                <p className="text-sm text-[#64748B]">{s.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ubicacion y contacto */}
      <section className="mb-16">
        <h2 className="text-2xl font-extrabold text-[#1E293B] mb-6 text-center">
          Visitanos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="size-5 text-[#00B4D8] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-[#1E293B]">Direccion</p>
                <p className="text-sm text-[#64748B]">
                  Errazuriz 09, Donihue, Region de O&apos;Higgins
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="size-5 text-[#00B4D8] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-[#1E293B]">Horario</p>
                <p className="text-sm text-[#64748B]">
                  Lunes a Viernes: 9:00 - 18:00
                </p>
                <p className="text-sm text-[#64748B]">
                  Sabado: 10:00 - 14:00
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="size-5 text-[#00B4D8] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-[#1E293B]">Telefono</p>
                <p className="text-sm text-[#64748B]">+56 9 66126645</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="size-5 text-[#00B4D8] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-[#1E293B]">Email</p>
                <p className="text-sm text-[#64748B]">contacto@printup.cl</p>
              </div>
            </div>
          </div>

          {/* Google Maps embed */}
          <div className="rounded-xl overflow-hidden border border-[#E2E8F0] min-h-[300px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.5!2d-70.9456!3d-34.1083!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sErrazuriz%2009%2C%20Donihue!5e0!3m2!1ses!2scl!4v1700000000000"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 300 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicacion PrintUp en Google Maps"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
