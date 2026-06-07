"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Package, Loader2, RefreshCw, MessageCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import type { Pedido } from "@/lib/types";

const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  confirmado: { label: "Confirmado", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  preparando: { label: "Preparando", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  enviado: { label: "Enviado", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  entregado: { label: "Entregado", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  cancelado: { label: "Cancelado", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const pagoEstadoConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pago pendiente", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  pagado: { label: "Pagado", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  fallido: { label: "Pago fallido", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  reembolsado: { label: "Reembolsado", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MisPedidosPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPedidos = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/cliente/pedidos", { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error");
        setPedidos((json.data as Pedido[]) || []);
      } catch (err) {
        console.error("Error fetching pedidos:", err);
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [user]);

  const handleRepetirPedido = (pedido: Pedido) => {
    for (const item of pedido.items) {
      addItem({
        producto_id: item.producto_id,
        nombre: item.nombre,
        precio: item.precio_unitario,
        imagen: "",
        slug: "",
        categoria_slug: "",
        variante: item.variante || null,
        precio_extra: 0,
        cantidad: item.cantidad,
      });
    }
  };

  const getWhatsAppLink = (pedido: Pedido) => {
    const message = encodeURIComponent(
      `Hola, tengo una consulta sobre mi pedido #${pedido.numero_pedido}`
    );
    return `https://wa.me/56966126645?text=${message}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 text-[#1B2A6B] animate-spin" />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F0F7FF] flex items-center justify-center">
          <ShoppingBag className="size-10 text-[#1B2A6B]/40" />
        </div>
        <h2 className="text-xl font-bold text-[#1E293B] mb-2">No tienes pedidos aun</h2>
        <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
          Cuando realices tu primera compra, podras ver el historial aqui.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/productos" />}
          className="bg-[#1B2A6B] text-white hover:bg-[#152259]"
        >
          Explorar productos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#1E293B]">
        Mis Pedidos
        <span className="text-sm font-normal text-[#64748B] ml-2">({pedidos.length})</span>
      </h2>

      {pedidos.map((pedido) => {
        const estado = estadoConfig[pedido.estado] || estadoConfig.pendiente;
        const pago = pagoEstadoConfig[pedido.pago_estado] || pagoEstadoConfig.pendiente;
        const itemsSummary = pedido.items.slice(0, 2).map((i) => i.nombre);
        const remaining = pedido.items.length - 2;

        return (
          <div
            key={pedido.id}
            className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
                  <Package className="size-5 text-[#1B2A6B]" />
                </div>
                <div>
                  <p className="font-bold text-[#1E293B]">
                    Pedido #{pedido.numero_pedido}
                  </p>
                  <p className="text-xs text-[#64748B]">{formatDate(pedido.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${estado.bg} ${estado.color}`}
                >
                  {estado.label}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${pago.bg} ${pago.color}`}
                >
                  {pago.label}
                </span>
              </div>
            </div>

            {/* Items summary */}
            <div className="text-sm text-[#64748B]">
              <p>
                {itemsSummary.join(", ")}
                {remaining > 0 && (
                  <span className="text-[#1B2A6B] font-medium"> y {remaining} mas</span>
                )}
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
              <p className="text-lg font-extrabold text-[#1B2A6B]">{formatCLP(pedido.total)}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => handleRepetirPedido(pedido)}
                  variant="outline"
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className="size-3.5" />
                  Repetir pedido
                </Button>
                <Button
                  nativeButton={false}
                  render={
                    <a
                      href={getWhatsAppLink(pedido)}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  variant="outline"
                  className="text-xs gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                >
                  <MessageCircle className="size-3.5" />
                  Contactar por WhatsApp
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
