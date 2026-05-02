"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCLP } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Copy, MessageCircle, CreditCard } from "lucide-react";
import type { Pedido } from "@/lib/types";
import { toast } from "sonner";

export default function ConfirmacionPage() {
  return (
    <Suspense>
      <ConfirmacionContent />
    </Suspense>
  );
}

function ConfirmacionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const pagoStatus = searchParams.get("pago");
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetch(`/api/pedidos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setPedido(null);
        } else {
          setPedido(data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRetryPayment = async () => {
    setRetrying(true);
    try {
      const res = await fetch("/api/pagos/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: id }),
      });
      const data = await res.json();
      if (res.ok && data.init_point) {
        window.location.href = data.init_point;
      } else {
        toast.error("No se pudo crear el enlace de pago. Intenta mas tarde.");
      }
    } catch {
      toast.error("Error de conexion.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-64 mx-auto mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-4">Pedido no encontrado</h1>
        <Button nativeButton={false} render={<Link href="/" />}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  // Determine the effective payment status
  const isPagoOk = pagoStatus === "ok" || pedido.pago_estado === "pagado";
  const isPagoError = pagoStatus === "error" || pagoStatus === "error_mp";
  const isPagoPendiente = pagoStatus === "pendiente";
  const isTransferencia = pedido.pago_metodo === "transferencia";
  const isPagoRetiro = pedido.pago_metodo === "pago_retiro";
  const isMercadoPago = pedido.pago_metodo === "mercadopago";

  const whatsappMessage = encodeURIComponent(
    `Hola, acabo de realizar el pedido #${pedido.numero_pedido} por ${formatCLP(pedido.total)}. Mi nombre es ${pedido.cliente_nombre}.`
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Header based on payment status */}
      <div className="text-center mb-8">
        {isPagoOk ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="size-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
              Pago Confirmado
            </h1>
            <p className="text-[#64748B]">
              Tu pago para el pedido <strong>#{pedido.numero_pedido}</strong> fue procesado exitosamente.
              Te enviaremos un email de confirmacion a <strong>{pedido.cliente_email}</strong>.
            </p>
          </>
        ) : isPagoError ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="size-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
              Error en el Pago
            </h1>
            <p className="text-[#64748B]">
              Hubo un problema al procesar tu pago para el pedido <strong>#{pedido.numero_pedido}</strong>.
              Puedes intentar nuevamente o elegir otro metodo de pago.
            </p>
          </>
        ) : isPagoPendiente ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="size-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
              Pago Pendiente
            </h1>
            <p className="text-[#64748B]">
              Tu pago para el pedido <strong>#{pedido.numero_pedido}</strong> esta siendo procesado.
              Te notificaremos por email cuando se confirme.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="size-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
              Pedido #{pedido.numero_pedido} Confirmado
            </h1>
            <p className="text-[#64748B]">
              Hemos recibido tu pedido. Te enviaremos un email de confirmacion a{" "}
              <strong>{pedido.cliente_email}</strong>.
            </p>
          </>
        )}
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6">
        <h2 className="font-bold text-[#1E293B] mb-4">Detalle del Pedido</h2>
        <ul className="space-y-3 mb-4">
          {pedido.items.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-[#1E293B]">
                {item.nombre} x {item.cantidad}
              </span>
              <span className="font-medium">
                {formatCLP(item.precio_unitario * item.cantidad)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-[#E2E8F0] pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[#64748B]">Subtotal</span>
            <span>{formatCLP(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748B]">Envio</span>
            <span>{pedido.costo_envio > 0 ? formatCLP(pedido.costo_envio) : "Gratis"}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-[#E2E8F0] pt-2 mt-2">
            <span>Total</span>
            <span className="text-[#1B2A6B]">{formatCLP(pedido.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment-specific section */}
      {isPagoError && isMercadoPago && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6 mb-6">
          <h2 className="font-bold text-red-800 mb-3">Reintentar Pago</h2>
          <p className="text-sm text-red-700 mb-4">
            Tu pedido fue creado pero el pago no se completo. Puedes intentar pagar nuevamente con MercadoPago
            o contactarnos por WhatsApp para coordinar otro metodo.
          </p>
          <Button
            onClick={handleRetryPayment}
            disabled={retrying}
            className="w-full bg-[#009EE3] hover:bg-[#0082C0] text-white font-bold"
          >
            {retrying ? (
              <Clock className="size-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="size-4 mr-2" />
            )}
            {retrying ? "Redirigiendo..." : "Reintentar Pago con MercadoPago"}
          </Button>
        </div>
      )}

      {isTransferencia && !isPagoOk && (
        <div className="bg-[#F0F7FF] rounded-xl border border-[#00B4D8]/20 p-6 mb-6">
          <h2 className="font-bold text-[#1B2A6B] mb-3">Instrucciones de Pago</h2>
          <p className="text-sm text-[#1E293B] mb-4">
            Realiza una transferencia bancaria con los siguientes datos y luego confirma tu pago por WhatsApp:
          </p>
          <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Razon social:</span>
              <span className="font-medium">Servicios Graficos Spa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">RUT:</span>
              <span className="font-medium">78.114.353-7</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Monto:</span>
              <span className="font-bold text-[#1B2A6B]">{formatCLP(pedido.total)}</span>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `Servicios Graficos Spa - RUT 78.114.353-7 - Monto: ${formatCLP(pedido.total)} - Pedido #${pedido.numero_pedido}`
              );
              toast.success("Datos copiados al portapapeles");
            }}
            className="flex items-center gap-2 mt-3 text-sm text-[#00B4D8] hover:underline"
          >
            <Copy className="size-4" />
            Copiar datos de transferencia
          </button>
        </div>
      )}

      {isPagoRetiro && (
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-6 mb-6">
          <h2 className="font-bold text-orange-800 mb-3">Pago al Retirar</h2>
          <p className="text-sm text-orange-700">
            Tu pedido esta reservado. Pagaras <strong>{formatCLP(pedido.total)}</strong> al momento
            de retirar en nuestra tienda. Aceptamos efectivo y tarjeta.
          </p>
          <p className="text-sm text-orange-700 mt-2">
            Te contactaremos cuando tu pedido este listo para retirar.
          </p>
        </div>
      )}

      {isPagoOk && isMercadoPago && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-6">
          <h2 className="font-bold text-green-800 mb-3">Pago Exitoso</h2>
          <p className="text-sm text-green-700">
            Tu pago con MercadoPago fue procesado correctamente. Estamos preparando tu pedido.
          </p>
        </div>
      )}

      {isPagoPendiente && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6 mb-6">
          <h2 className="font-bold text-yellow-800 mb-3">Pago en Proceso</h2>
          <p className="text-sm text-yellow-700">
            Tu pago esta siendo procesado. Este proceso puede tomar algunos minutos.
            Recibirás un email cuando se confirme.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={`https://wa.me/56966126645?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#25D366] text-white font-bold text-sm hover:bg-[#20BD5A] transition-colors"
        >
          <MessageCircle className="size-5" />
          {isTransferencia ? "Confirmar Pago por WhatsApp" : "Contactar por WhatsApp"}
        </a>
        <Button nativeButton={false} render={<Link href="/productos" />} variant="outline" className="flex-1">
          Seguir Comprando
        </Button>
      </div>
    </div>
  );
}
