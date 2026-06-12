import type { Metadata } from "next";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Shield, Database, Eye, Cookie, UserCheck, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Politica de Privacidad",
  description:
    "Politica de privacidad de PrintUp. Conoce como recopilamos, usamos y protegemos tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Politicas", href: "/politicas/privacidad" },
          { label: "Privacidad" },
        ]}
      />

      {/* Header */}
      <section className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#0f1115] to-[#00B4D8] flex items-center justify-center">
          <Shield className="size-8 text-white" />
        </div>
        <h1
          className="text-3xl md:text-4xl font-extrabold text-[#0f1115] mb-3"
          style={{ letterSpacing: "-0.02em" }}
        >
          Politica de{" "}
          <span className="text-[#00B4D8]">Privacidad</span>
        </h1>
        <p className="text-[#5b6472] max-w-xl mx-auto">
          En PrintUp valoramos tu privacidad. Esta politica describe como
          recopilamos, usamos y protegemos tu informacion personal.
        </p>
      </section>

      {/* Responsable */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#e8eaee] p-6 md:p-8">
          <h2 className="text-xl font-extrabold text-[#0f1115] mb-3">
            Responsable del Tratamiento de Datos
          </h2>
          <div className="text-[#475569] space-y-1">
            <p>
              <strong>Razon Social:</strong> Servicios Graficos Spa
            </p>
            <p>
              <strong>RUT:</strong> 78.114.353-7
            </p>
            <p>
              <strong>Direccion:</strong> Errazuriz 09, Donihue, Region de
              O&apos;Higgins, Chile
            </p>
            <p>
              <strong>Contacto:</strong>{" "}
              <a
                href="mailto:contacto@printup.cl"
                className="text-[#00B4D8] hover:underline"
              >
                contacto@printup.cl
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Datos recopilados */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#e8eaee] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#fafafb] flex items-center justify-center shrink-0">
              <Database className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0f1115] mb-1">
                Datos que Recopilamos
              </h2>
              <p className="text-[#475569] mb-3">
                Recopilamos la siguiente informacion cuando realizas una compra
                o te registras en nuestro sitio:
              </p>
              <ul className="space-y-2 text-[#475569]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Nombre completo</strong> - para identificar tu pedido
                    y personalizar la comunicacion
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Correo electronico</strong> - para confirmaciones de
                    pedido y comunicaciones
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Numero de telefono</strong> - para coordinar entregas
                    y resolver consultas
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Direccion de envio</strong> - para despachar tus
                    pedidos
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Uso de datos */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#e8eaee] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#fafafb] flex items-center justify-center shrink-0">
              <Eye className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0f1115] mb-1">
                Uso de la Informacion
              </h2>
              <p className="text-[#475569] mb-3">
                Utilizamos tus datos personales exclusivamente para:
              </p>
              <ul className="space-y-2 text-[#475569]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    Procesar y gestionar tus pedidos de impresion
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    Enviar confirmaciones de compra y actualizaciones de estado
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    Comunicar ofertas y novedades (solo si te suscribes a nuestro
                    newsletter)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    Mejorar nuestros servicios y experiencia de compra
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* No compartimos datos */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-[#0f1115] to-[#00B4D8] rounded-2xl p-6 md:p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Shield className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold mb-1">
                No Compartimos tus Datos
              </h2>
              <p className="text-white/85">
                Tu informacion personal <strong>no es compartida, vendida
                ni cedida a terceros</strong>. Solo es utilizada internamente
                para los fines descritos en esta politica. Los datos de pago son
                procesados de forma segura a traves de pasarelas de pago
                certificadas y no almacenamos informacion de tarjetas de credito.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cookies */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#e8eaee] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#fafafb] flex items-center justify-center shrink-0">
              <Cookie className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0f1115] mb-1">
                Cookies
              </h2>
              <p className="text-[#475569] mb-3">
                Nuestro sitio utiliza cookies para mejorar tu experiencia de
                navegacion:
              </p>
              <ul className="space-y-2 text-[#475569]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Cookies de sesion:</strong> necesarias para el
                    funcionamiento del sitio (carrito de compras, inicio de
                    sesion)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Cookies de analytics:</strong> nos ayudan a entender
                    como los usuarios navegan nuestro sitio para mejorar la
                    experiencia
                  </span>
                </li>
              </ul>
              <p className="text-sm text-[#5b6472] mt-3">
                Puedes desactivar las cookies en la configuracion de tu
                navegador, aunque esto puede afectar la funcionalidad del sitio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Derechos */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#e8eaee] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#fafafb] flex items-center justify-center shrink-0">
              <UserCheck className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0f1115] mb-1">
                Tus Derechos
              </h2>
              <p className="text-[#475569] mb-3">
                De acuerdo con la legislacion chilena vigente, tienes derecho a:
              </p>
              <ul className="space-y-2 text-[#475569]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Acceder</strong> a los datos personales que tenemos
                    sobre ti
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Rectificar</strong> cualquier dato incorrecto o
                    desactualizado
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                  <span>
                    <strong>Eliminar</strong> tus datos personales de nuestros
                    registros
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-[#e8eaee] p-6 md:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#fafafb] flex items-center justify-center shrink-0">
              <Mail className="size-5 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0f1115] mb-1">
                Ejercer tus Derechos
              </h2>
              <p className="text-[#475569]">
                Para ejercer cualquiera de estos derechos, contactanos a{" "}
                <a
                  href="mailto:contacto@printup.cl"
                  className="text-[#00B4D8] hover:underline font-medium"
                >
                  contacto@printup.cl
                </a>{" "}
                indicando tu nombre completo, RUT y la solicitud que deseas
                realizar. Responderemos tu solicitud en un plazo maximo de 10
                dias habiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nota final */}
      <div className="text-center text-sm text-[#5b6472]">
        <p>
          Ultima actualizacion: Mayo 2026
        </p>
        <p className="mt-1">
          Servicios Graficos Spa - RUT 78.114.353-7
        </p>
      </div>
    </div>
  );
}
