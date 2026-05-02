"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { QuantitySelector } from "@/components/tienda/quantity-selector";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, Package } from "lucide-react";
import type { ZonaEnvio } from "@/lib/types";

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCart();
  const [zonas, setZonas] = useState<ZonaEnvio[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<"retiro_tienda" | "despacho">("retiro_tienda");
  const [zonaSeleccionada, setZonaSeleccionada] = useState<string>("");

  useEffect(() => {
    fetch("/api/zonas-envio")
      .then((r) => r.json())
      .then((data) => setZonas(Array.isArray(data) ? data : []));
  }, []);

  const subtotal = getSubtotal();
  const zona = zonas.find((z) => z.id === zonaSeleccionada);
  const envioGratis = zona?.envio_gratis_desde && subtotal >= zona.envio_gratis_desde;
  const costoEnvio = tipoEntrega === "despacho" && zona && !envioGratis ? zona.precio : 0;
  const total = subtotal + costoEnvio;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: "Carrito" }]} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="size-20 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Tu carrito esta vacio</h1>
          <p className="text-[#64748B] mb-6">Agrega productos para comenzar tu compra</p>
          <Button nativeButton={false} render={<Link href="/productos" />} className="bg-[#1B2A6B] hover:bg-[#152259]">
            Explorar Productos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Carrito" }]} />
      <h1 className="text-2xl font-extrabold text-[#1E293B] mb-8" style={{ letterSpacing: "-0.02em" }}>
        Mi Carrito
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const variantKey = item.variante
              ? Object.values(item.variante).join("-")
              : "";
            const key = `${item.producto_id}-${variantKey}`;
            const unitPrice = item.precio + item.precio_extra;

            return (
              <div
                key={key}
                className="flex gap-4 p-4 bg-white rounded-xl border border-[#E2E8F0]"
              >
                <Link
                  href={`/productos/${item.categoria_slug}/${item.slug}`}
                  className="w-20 h-20 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0 overflow-hidden"
                >
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="size-8 text-[#00B4D8]/30" />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/productos/${item.categoria_slug}/${item.slug}`}
                    className="font-semibold text-[#1E293B] hover:text-[#1B2A6B] transition-colors"
                  >
                    {item.nombre}
                  </Link>
                  {item.variante && Object.keys(item.variante).length > 0 && (
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {Object.entries(item.variante)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" | ")}
                    </p>
                  )}
                  <p className="text-sm font-bold text-[#1B2A6B] mt-1">
                    {formatCLP(unitPrice)}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <QuantitySelector
                      value={item.cantidad}
                      onChange={(q) =>
                        updateQuantity(item.producto_id, q, item.variante)
                      }
                    />
                    <span className="text-sm font-semibold text-[#1E293B]">
                      {formatCLP(unitPrice * item.cantidad)}
                    </span>
                    <button
                      onClick={() =>
                        removeItem(item.producto_id, item.variante)
                      }
                      className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 h-fit sticky top-20">
          <h2 className="font-bold text-[#1E293B] mb-4">Resumen del Pedido</h2>

          {/* Delivery type */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-semibold text-[#1E293B]">
              Tipo de entrega
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="entrega"
                  value="retiro_tienda"
                  checked={tipoEntrega === "retiro_tienda"}
                  onChange={() => setTipoEntrega("retiro_tienda")}
                  className="accent-[#1B2A6B]"
                />
                <div>
                  <p className="text-sm font-medium">Retiro en Tienda</p>
                  <p className="text-xs text-[#64748B]">Gratis - Donihue</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="entrega"
                  value="despacho"
                  checked={tipoEntrega === "despacho"}
                  onChange={() => setTipoEntrega("despacho")}
                  className="accent-[#1B2A6B]"
                />
                <div>
                  <p className="text-sm font-medium">Despacho a Domicilio</p>
                  <p className="text-xs text-[#64748B]">Miercoles y Viernes</p>
                </div>
              </label>
            </div>
          </div>

          {/* Zone selector */}
          {tipoEntrega === "despacho" && (
            <div className="mb-4">
              <label className="text-sm font-semibold text-[#1E293B] block mb-2">
                Zona de envio
              </label>
              <select
                value={zonaSeleccionada}
                onChange={(e) => setZonaSeleccionada(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white"
              >
                <option value="">Selecciona tu zona</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre} - {formatCLP(z.precio)}
                  </option>
                ))}
              </select>
              {zona && envioGratis && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Envio gratis aplicado (compra sobre {formatCLP(zona.envio_gratis_desde!)})
                </p>
              )}
            </div>
          )}

          <div className="border-t border-[#E2E8F0] pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Subtotal</span>
              <span className="font-medium">{formatCLP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Envio</span>
              <span className="font-medium">
                {tipoEntrega === "retiro_tienda"
                  ? "Gratis"
                  : costoEnvio === 0
                    ? zona ? "Gratis" : "Selecciona zona"
                    : formatCLP(costoEnvio)}
              </span>
            </div>
            <div className="border-t border-[#E2E8F0] pt-2 flex justify-between">
              <span className="font-bold text-[#1E293B]">Total</span>
              <span className="text-xl font-extrabold text-[#1B2A6B]">
                {formatCLP(total)}
              </span>
            </div>
          </div>

          <Button
            nativeButton={false} render={<Link href={`/checkout?tipo=${tipoEntrega}${zonaSeleccionada ? `&zona=${zonaSeleccionada}` : ""}`} />}
            className="w-full mt-4 bg-[#1B2A6B] hover:bg-[#152259] text-white font-bold py-6"
            size="lg"
          >
            Proceder al Checkout
          </Button>

          <Link
            href="/productos"
            className="block text-center text-sm text-[#00B4D8] hover:underline mt-3"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
