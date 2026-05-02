"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Package, User, MapPin, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { formatCLP } from "@/lib/format";
import { toast } from "sonner";
import type { Pedido } from "@/lib/types";

const estadoColors: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "#94A3B820", text: "#64748B" },
  confirmado: { bg: "#00B4D820", text: "#00B4D8" },
  preparando: { bg: "#FFD10020", text: "#B8860B" },
  enviado: { bg: "#8B5CF620", text: "#7C3AED" },
  entregado: { bg: "#10B98120", text: "#10B981" },
  cancelado: { bg: "#EF444420", text: "#EF4444" },
};

const estadoFlow = ["pendiente", "confirmado", "preparando", "enviado", "entregado"];

function PedidoDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/pedidos/${id}`)
      .then((res) => res.json())
      .then((data) => { setPedido(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const updateEstado = async (nuevoEstado: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (res.ok) {
        setPedido(data);
        toast.success(`Pedido actualizado a "${nuevoEstado}"`);
      } else {
        toast.error(data.error || "Error al actualizar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setUpdating(false);
  };

  const openWhatsApp = () => {
    if (!pedido) return;
    const phone = (pedido.cliente_telefono || "").replace(/\D/g, "");
    const msg = `Hola ${pedido.cliente_nombre}, tu pedido #${pedido.numero_pedido} ha sido ${pedido.estado}. Gracias por comprar en PrintUp!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="py-12 text-center">
        <p style={{ color: "#64748B" }}>Pedido no encontrado</p>
        <Link href="/admin/pedidos">
          <Button variant="outline" className="mt-4">Volver a pedidos</Button>
        </Link>
      </div>
    );
  }

  const ec = estadoColors[pedido.estado] || estadoColors.pendiente;
  const currentIdx = estadoFlow.indexOf(pedido.estado);
  const nextEstado = currentIdx >= 0 && currentIdx < estadoFlow.length - 1 ? estadoFlow[currentIdx + 1] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/pedidos">
            <Button variant="ghost" size="sm"><ArrowLeft className="size-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
              Pedido #{pedido.numero_pedido}
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>
              {new Date(pedido.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {nextEstado && pedido.estado !== "cancelado" && (
            <Button
              onClick={() => updateEstado(nextEstado)}
              disabled={updating}
              style={{ backgroundColor: "#1B2A6B" }}
              className="text-white hover:opacity-90"
            >
              Marcar como {nextEstado}
            </Button>
          )}
          {pedido.estado !== "cancelado" && pedido.estado !== "entregado" && (
            <Button
              variant="outline"
              onClick={() => updateEstado("cancelado")}
              disabled={updating}
              className="text-red-500 hover:bg-red-50"
            >
              Cancelar
            </Button>
          )}
          {pedido.cliente_telefono && (
            <Button variant="outline" onClick={openWhatsApp} className="gap-2">
              <MessageCircle className="size-4" />
              WhatsApp
            </Button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Order info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#1E293B" }}>
              <FileText className="size-4" />
              Informacion del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: "#64748B" }}>Estado</span>
              <span
                className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: ec.bg, color: ec.text }}
              >
                {pedido.estado}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#64748B" }}>Pago</span>
              <span className="text-sm font-medium">{pedido.pago_estado}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#64748B" }}>Metodo de pago</span>
              <span className="text-sm">{pedido.pago_metodo || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#64748B" }}>Tipo entrega</span>
              <span className="text-sm">{pedido.tipo_entrega === "despacho" ? "Despacho a domicilio" : "Retiro en tienda"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Client info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#1E293B" }}>
              <User className="size-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: "#64748B" }}>Nombre</span>
              <span className="font-medium">{pedido.cliente_nombre}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#64748B" }}>Email</span>
              <span className="text-sm">{pedido.cliente_email}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#64748B" }}>Telefono</span>
              <span className="text-sm">{pedido.cliente_telefono || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#64748B" }}>RUT</span>
              <span className="text-sm">{pedido.cliente_rut || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping address */}
      {pedido.tipo_entrega === "despacho" && pedido.direccion_envio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#1E293B" }}>
              <MapPin className="size-4" />
              Direccion de Envio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ color: "#1E293B" }}>
              {pedido.direccion_envio.calle} {pedido.direccion_envio.numero}
            </p>
            <p style={{ color: "#64748B" }}>
              {pedido.direccion_envio.comuna}, {pedido.direccion_envio.ciudad}, {pedido.direccion_envio.region}
            </p>
            {pedido.direccion_envio.notas && (
              <p className="mt-2 text-sm" style={{ color: "#64748B" }}>
                Notas: {pedido.direccion_envio.notas}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#1E293B" }}>
            <Package className="size-4" />
            Items del Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ color: "#64748B" }}>
                  <th className="pb-3 text-left font-medium">Producto</th>
                  <th className="pb-3 text-center font-medium">Cantidad</th>
                  <th className="pb-3 text-right font-medium">Precio Unit.</th>
                  <th className="pb-3 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.items.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="font-medium" style={{ color: "#1E293B" }}>{item.nombre}</div>
                      {item.variante && (
                        <div className="text-xs" style={{ color: "#64748B" }}>
                          {Object.entries(item.variante).map(([k, v]) => `${k}: ${v}`).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-center">{item.cantidad}</td>
                    <td className="py-3 text-right">{formatCLP(item.precio_unitario)}</td>
                    <td className="py-3 text-right font-medium">{formatCLP(item.precio_unitario * item.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: "#64748B" }}>Subtotal</span>
              <span>{formatCLP(pedido.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#64748B" }}>Envio</span>
              <span>{pedido.costo_envio === 0 ? "Gratis" : formatCLP(pedido.costo_envio)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold" style={{ color: "#1B2A6B" }}>
              <span>Total</span>
              <span>{formatCLP(pedido.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#1E293B" }}>
            <Clock className="size-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {estadoFlow.map((e, idx) => {
              const reached = estadoFlow.indexOf(pedido.estado) >= idx || (pedido.estado === "cancelado" && idx === 0);
              return (
                <div key={e} className="flex items-center gap-3">
                  <div
                    className="size-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: reached ? (estadoColors[e]?.text || "#64748B") : "#E2E8F0",
                    }}
                  />
                  <span
                    className="text-sm font-medium capitalize"
                    style={{ color: reached ? "#1E293B" : "#CBD5E1" }}
                  >
                    {e}
                  </span>
                  {e === pedido.estado && (
                    <span className="text-xs" style={{ color: "#64748B" }}>
                      — {new Date(pedido.updated_at || pedido.created_at).toLocaleDateString("es-CL", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              );
            })}
            {pedido.estado === "cancelado" && (
              <div className="flex items-center gap-3">
                <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: "#EF4444" }} />
                <span className="text-sm font-medium" style={{ color: "#EF4444" }}>Cancelado</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {pedido.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" style={{ color: "#1E293B" }}>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: "#64748B" }}>{pedido.notas}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard>
      <PedidoDetail params={params} />
    </AuthGuard>
  );
}
