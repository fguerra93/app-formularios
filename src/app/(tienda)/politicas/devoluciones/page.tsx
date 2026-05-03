import type { Metadata } from "next";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { RotateCcw, AlertTriangle, Camera, Clock, CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Politica de Devoluciones",
  description:
    "Conoce nuestra politica de devoluciones y reembolsos en PrintUp. Productos personalizados, plazos y proceso de reclamo.",
};

export default function DevolucionesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Politicas", href: "/politicas/devoluciones" },
          { label: "Devoluciones" },
        ]}
      />

      {/* Header */}
      <section className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] flex items-center justify-center">
          <RotateCcw className="size-8 text-white" />
        </div>
        <h1
          className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-3"
          style={{ letterSpacing: "-0.02em" }}
        >
          Politica de{" "}
          <span className="text-[#00B4D8]">Devoluciones</span>
        </h1>
        <p className="text-[#64748B] max-w-xl mx-auto">
          En PrintUp nos comprometemos con la calidad de nuestros productos. Aqui
          te explicamos nuestras condiciones de devolucion y reembolso.
        </p>
      </section>

      {/* Productos personalizados */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1B2A6B] mb-1">
                Productos Personalizados
              </h2>
              <p className="text-[#475569]">
                Debido a la naturaleza de nuestros productos, los{" "}
                <strong>articulos personalizados no tienen devolucion</strong>,
                excepto en casos de defectos de produccion comprobables. Esto
                incluye impresiones, estampados, pendones y cualquier producto
                fabricado a medida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Excepciones - Defectos */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
              <RotateCcw className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1B2A6B] mb-1">
                Excepciones por Defectos de Produccion
              </h2>
              <p className="text-[#475569] mb-3">
                Si tu producto presenta un defecto de fabricacion, aceptamos
                reclamos bajo las siguientes condiciones:
              </p>
              <ul className="space-y-2 text-[#475569]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    Errores de impresion (colores incorrectos, manchas, borrones)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    Danos en el material no atribuibles al transporte
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    Producto diferente al solicitado o aprobado previamente
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Plazo para reclamos */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
              <Clock className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1B2A6B] mb-1">
                Plazo para Reclamos
              </h2>
              <p className="text-[#475569]">
                Tienes un plazo de{" "}
                <strong className="text-[#1B2A6B]">
                  7 dias corridos desde la recepcion
                </strong>{" "}
                del producto para realizar tu reclamo. Pasado este plazo, no se
                aceptaran solicitudes de devolucion o reembolso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso de reclamo */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
              <Camera className="size-5 text-[#00B4D8]" />
            </div>
            <h2 className="text-xl font-extrabold text-[#1B2A6B]">
              Proceso de Reclamo
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] flex items-center justify-center shrink-0 text-white text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B] mb-1">
                  Contactanos
                </h3>
                <p className="text-sm text-[#475569]">
                  Escribenos por{" "}
                  <a
                    href="https://wa.me/56966126645"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00B4D8] hover:underline font-medium"
                  >
                    WhatsApp (+56 9 66126645)
                  </a>{" "}
                  o envia un correo a{" "}
                  <a
                    href="mailto:contacto@printup.cl"
                    className="text-[#00B4D8] hover:underline font-medium"
                  >
                    contacto@printup.cl
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] flex items-center justify-center shrink-0 text-white text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B] mb-1">
                  Envia evidencia
                </h3>
                <p className="text-sm text-[#475569]">
                  Adjunta fotos claras del problema, indicando tu numero de
                  pedido y una descripcion del defecto encontrado.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] flex items-center justify-center shrink-0 text-white text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B] mb-1">
                  Evaluacion
                </h3>
                <p className="text-sm text-[#475569]">
                  Nuestro equipo revisara tu caso y te contactara con una
                  solucion dentro de 48 horas habiles.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] flex items-center justify-center shrink-0 text-white text-sm font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B] mb-1">
                  Resolucion
                </h3>
                <p className="text-sm text-[#475569]">
                  Segun el caso, ofreceremos reimpresion del producto o reembolso
                  del monto pagado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reembolsos */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
              <CreditCard className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1B2A6B] mb-1">
                Reembolsos
              </h2>
              <p className="text-[#475569]">
                Los reembolsos aprobados se procesan en un plazo de{" "}
                <strong className="text-[#1B2A6B]">
                  5 a 10 dias habiles
                </strong>{" "}
                desde la aprobacion del reclamo. El reembolso se realizara a
                traves del mismo medio de pago utilizado en la compra original.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nota final */}
      <div className="text-center text-sm text-[#64748B]">
        <p>
          Para cualquier consulta sobre devoluciones, contactanos a{" "}
          <a
            href="mailto:contacto@printup.cl"
            className="text-[#00B4D8] hover:underline"
          >
            contacto@printup.cl
          </a>{" "}
          o por{" "}
          <a
            href="https://wa.me/56966126645"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00B4D8] hover:underline"
          >
            WhatsApp
          </a>
          .
        </p>
        <p className="mt-1">
          Servicios Graficos Spa - RUT 78.114.353-7
        </p>
      </div>
    </div>
  );
}
