import type { Metadata } from "next";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Truck, MapPin, Clock, Package, CircleDollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Politica de Envio",
  description:
    "Conoce nuestras politicas de envio, zonas de cobertura, tarifas y tiempos de entrega en PrintUp.",
};

export default function EnvioPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Politicas", href: "/politicas/envio" },
          { label: "Envio" },
        ]}
      />

      {/* Header */}
      <section className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] flex items-center justify-center">
          <Truck className="size-8 text-white" />
        </div>
        <h1
          className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-3"
          style={{ letterSpacing: "-0.02em" }}
        >
          Politica de <span className="text-[#00B4D8]">Envio</span>
        </h1>
        <p className="text-[#64748B] max-w-xl mx-auto">
          En PrintUp nos esforzamos por entregar tus pedidos de manera rapida y
          segura en la Region de O&apos;Higgins.
        </p>
      </section>

      {/* Dias de despacho */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
              <Clock className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1B2A6B] mb-1">
                Dias de Despacho
              </h2>
              <p className="text-[#475569]">
                Realizamos despachos los dias <strong>Miercoles</strong> y{" "}
                <strong>Viernes</strong>. Los pedidos confirmados antes de las
                12:00 del dia anterior al despacho seran incluidos en la
                proxima salida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Zonas y tarifas */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
              <MapPin className="size-5 text-[#00B4D8]" />
            </div>
            <h2 className="text-xl font-extrabold text-[#1B2A6B]">
              Zonas y Tarifas
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#E2E8F0] p-5 bg-[#F0F7FF]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-[#1B2A6B]">
                  Zona 1 - Cercania
                </h3>
                <span className="text-lg font-extrabold text-[#00B4D8]">
                  $3.500
                </span>
              </div>
              <p className="text-sm text-[#475569]">
                Donihue, Coltauco, Coinco
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] p-5 bg-[#F0F7FF]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-[#1B2A6B]">
                  Zona 2 - Intermedia
                </h3>
                <span className="text-lg font-extrabold text-[#00B4D8]">
                  $4.500
                </span>
              </div>
              <p className="text-sm text-[#475569]">
                Rancagua, Machali, Olivar
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] p-5 bg-gradient-to-r from-[#1B2A6B] to-[#00B4D8] text-white">
              <div className="flex items-center gap-2 mb-1">
                <CircleDollarSign className="size-5" />
                <h3 className="font-bold">Envio Gratis</h3>
              </div>
              <p className="text-sm text-white/80">
                En compras sobre <strong className="text-white">$50.000</strong>{" "}
                el envio es totalmente gratuito para ambas zonas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Retiro en tienda */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
              <Package className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1B2A6B] mb-1">
                Retiro en Tienda
              </h2>
              <p className="text-[#475569]">
                El retiro en tienda es <strong>gratuito</strong>. Puedes pasar a
                buscar tu pedido en nuestra direccion:
              </p>
              <p className="mt-2 font-medium text-[#1B2A6B]">
                Errazuriz 09, Donihue, Region de O&apos;Higgins
              </p>
              <p className="text-sm text-[#64748B] mt-1">
                Horario de retiro: Lunes a Viernes de 9:00 a 18:00
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tiempos de produccion */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
              <Clock className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1B2A6B] mb-1">
                Tiempos de Produccion
              </h2>
              <p className="text-[#475569] mb-3">
                Los tiempos de produccion varian segun el tipo de producto y la
                cantidad solicitada:
              </p>
              <ul className="space-y-2 text-[#475569]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Productos estandar:</strong> 2-3 dias habiles
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Productos personalizados:</strong> 3-5 dias habiles
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Pedidos grandes o especiales:</strong> consultar
                    plazo por WhatsApp o email
                  </span>
                </li>
              </ul>
              <p className="text-sm text-[#64748B] mt-3">
                Los tiempos de produccion no incluyen el dia de despacho. Una
                vez listo tu pedido, sera despachado en el proximo dia de envio
                disponible (Miercoles o Viernes).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nota final */}
      <div className="text-center text-sm text-[#64748B]">
        <p>
          Para consultas sobre envios, contactanos a{" "}
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
