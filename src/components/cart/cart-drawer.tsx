"use client";

import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { formatCLP } from "@/lib/format";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount } = useCart();

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-[#1E293B]">
            Carrito ({getItemCount()})
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Cerrar carrito"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <ShoppingBag className="size-16 text-gray-300" />
              <p className="text-[#64748B]">Tu carrito esta vacio</p>
              <Button nativeButton={false} render={<Link href="/productos" onClick={onClose} />}>
                Explorar productos
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => {
                const variantKey = item.variante
                  ? Object.values(item.variante).join("-")
                  : "";
                const key = `${item.producto_id}-${variantKey}`;
                const unitPrice = item.precio + item.precio_extra;

                return (
                  <li
                    key={key}
                    className="flex gap-3 p-3 rounded-lg border border-[#E2E8F0]"
                  >
                    <div className="w-16 h-16 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0 overflow-hidden">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="size-6 text-[#00B4D8]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">
                        {item.nombre}
                      </p>
                      {item.variante && Object.keys(item.variante).length > 0 && (
                        <p className="text-xs text-[#64748B]">
                          {Object.entries(item.variante)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" | ")}
                        </p>
                      )}
                      <p className="text-sm font-bold text-[#1B2A6B] mt-1">
                        {formatCLP(unitPrice)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.producto_id,
                              item.cantidad - 1,
                              item.variante
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center rounded border border-[#E2E8F0] hover:bg-gray-50"
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.producto_id,
                              item.cantidad + 1,
                              item.variante
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center rounded border border-[#E2E8F0] hover:bg-gray-50"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="size-3" />
                        </button>
                        <button
                          onClick={() =>
                            removeItem(item.producto_id, item.variante)
                          }
                          className="ml-auto text-xs text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Subtotal</span>
              <span className="font-bold text-[#1E293B]">
                {formatCLP(getSubtotal())}
              </span>
            </div>
            <Button
              nativeButton={false} render={<Link href="/carrito" onClick={onClose} />}
              className="w-full bg-[#1B2A6B] hover:bg-[#152259] text-white"
            >
              Ver Carrito
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
