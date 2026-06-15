"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { QuantitySelector } from "@/components/tienda/quantity-selector";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, Package, ChevronDown, ChevronUp, Tag, X, FileText } from "lucide-react";
import { toast } from "sonner";
import type { ZonaEnvio } from "@/lib/types";

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCart();
  const [zonas, setZonas] = useState<ZonaEnvio[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<"retiro_tienda" | "despacho">("retiro_tienda");
  const [zonaSeleccionada, setZonaSeleccionada] = useState<string>("");
  const [cuponOpen, setCuponOpen] = useState(false);
  const [cuponInput, setCuponInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<{
    codigo: string;
    descuento: number;
  } | null>(null);
  const [cuponError, setCuponError] = useState("");
  const [cuponLoading, setCuponLoading] = useState(false);

  useEffect(() => {
    fetch("/api/zonas-envio")
      .then((r) => r.json())
      .then((data) => setZonas(Array.isArray(data) ? data : []));
  }, []);

  const subtotal = getSubtotal();
  const zona = zonas.find((z) => z.id === zonaSeleccionada);
  const envioGratis = zona?.envio_gratis_desde && subtotal >= zona.envio_gratis_desde;
  const costoEnvio = tipoEntrega === "despacho" && zona && !envioGratis ? zona.precio : 0;
  const descuento = cuponAplicado?.descuento || 0;
  const total = subtotal - descuento + costoEnvio;

  const handleAplicarCupon = async () => {
    if (!cuponInput.trim()) return;
    setCuponLoading(true);
    setCuponError("");
    try {
      const res = await fetch("/api/cupones/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: cuponInput.toUpperCase().trim(),
          subtotal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valido) {
        setCuponAplicado({
          codigo: cuponInput.toUpperCase().trim(),
          descuento: data.descuento,
        });
        setCuponError("");
        toast.success(`Cupon ${cuponInput.toUpperCase().trim()} aplicado`);
      } else {
        setCuponError(data.error || "Cupon no valido");
        setCuponAplicado(null);
      }
    } catch {
      setCuponError("Error al validar cupon");
    }
    setCuponLoading(false);
  };

  const handleQuitarCupon = () => {
    setCuponAplicado(null);
    setCuponInput("");
    setCuponError("");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: "Carrito" }]} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="size-20 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-[#0f1115] mb-2">Tu carrito esta vacio</h1>
          <p className="text-[#5b6472] mb-6">Agrega productos para comenzar tu compra</p>
          <Button nativeButton={false} render={<Link href="/productos" />} className="bg-[#0f1115] hover:bg-[#000000]">
            Explorar Productos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Carrito" }]} />
      <h1 className="text-2xl font-extrabold text-[#0f1115] mb-8" style={{ letterSpacing: "-0.02em" }}>
        Mi Carrito
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Coupon section */}
          <div className="bg-white rounded-xl border border-[#e8eaee] overflow-hidden">
            <button
              onClick={() => setCuponOpen(!cuponOpen)}
              className="w-full flex items-center justify-between p-4 text-sm font-semibold text-[#0f1115] hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Tag className="size-4 text-[#00B4D8]" />
                Tienes un cupon?
              </span>
              {cuponOpen ? (
                <ChevronUp className="size-4 text-[#5b6472]" />
              ) : (
                <ChevronDown className="size-4 text-[#5b6472]" />
              )}
            </button>
            {cuponOpen && (
              <div className="px-4 pb-4">
                {cuponAplicado ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm font-medium text-green-700">
                      Cupon {cuponAplicado.codigo} aplicado: -{formatCLP(cuponAplicado.descuento)}
                    </span>
                    <button
                      onClick={handleQuitarCupon}
                      className="p-1 hover:bg-green-100 rounded"
                    >
                      <X className="size-4 text-green-700" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cuponInput}
                        onChange={(e) => setCuponInput(e.target.value.toUpperCase())}
                        placeholder="Codigo del cupon"
                        className="flex-1 px-3 py-2 rounded-lg border border-[#e8eaee] text-sm uppercase"
                      />
                      <Button
                        onClick={handleAplicarCupon}
                        disabled={cuponLoading}
                        variant="outline"
                        className="shrink-0"
                      >
                        {cuponLoading ? "..." : "Aplicar"}
                      </Button>
                    </div>
                    {cuponError && (
                      <p className="text-xs text-red-500 mt-2">{cuponError}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {items.map((item) => {
            const variantKey = item.variante
              ? Object.values(item.variante).join("-")
              : "";
            const key = `${item.producto_id}-${variantKey}`;
            const unitPrice = item.precio + item.precio_extra;

            return (
              <div
                key={key}
                className="flex gap-4 p-4 bg-white rounded-xl border border-[#e8eaee]"
              >
                <Link
                  href={`/productos/${item.categoria_slug}/${item.slug}`}
                  className="w-20 h-20 rounded-lg bg-[#fafafb] flex items-center justify-center shrink-0 overflow-hidden"
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
                    className="font-semibold text-[#0f1115] hover:text-[#0f1115] transition-colors"
                  >
                    {item.nombre}
                  </Link>
                  {item.variante && Object.keys(item.variante).filter((k) => !k.startsWith("__")).length > 0 && (
                    <p className="text-xs text-[#5b6472] mt-0.5">
                      {Object.entries(item.variante)
                        .filter(([k]) => !k.startsWith("__"))
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" | ")}
                    </p>
                  )}
                  {item.archivos && item.archivos.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {item.archivos.map((a, i) => (
                        <span
                          key={i}
                          title={a.nombre + (a.nota ? ` — ${a.nota}` : "")}
                          className="flex size-11 items-center justify-center overflow-hidden rounded-md border border-[#e8eaee] bg-white"
                        >
                          {a.preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.preview} alt={a.nombre} className="size-full object-contain" />
                          ) : (
                            <FileText className="size-5 text-[#0e7490]" />
                          )}
                        </span>
                      ))}
                      <span className="text-xs text-[#8b94a3]">
                        {item.archivos.length} diseño{item.archivos.length > 1 ? "s" : ""} · 1 archivo = 1 impresión
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-bold text-[#0f1115] mt-1">
                    {formatCLP(unitPrice)}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    {item.archivos && item.archivos.length > 0 ? (
                      <span className="text-sm font-medium text-[#0f1115]">
                        {item.cantidad} {item.cantidad > 1 ? "unidades" : "unidad"}
                      </span>
                    ) : (
                      <QuantitySelector
                        value={item.cantidad}
                        onChange={(q) =>
                          updateQuantity(item.producto_id, q, item.variante)
                        }
                      />
                    )}
                    <span className="text-sm font-semibold text-[#0f1115]">
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
        <div className="bg-white rounded-xl border border-[#e8eaee] p-6 h-fit sticky top-20">
          <h2 className="font-bold text-[#0f1115] mb-4">Resumen del Pedido</h2>

          {/* Delivery type */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-semibold text-[#0f1115]">
              Tipo de entrega
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#e8eaee] cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="entrega"
                  value="retiro_tienda"
                  checked={tipoEntrega === "retiro_tienda"}
                  onChange={() => setTipoEntrega("retiro_tienda")}
                  className="accent-[#0f1115]"
                />
                <div>
                  <p className="text-sm font-medium">Retiro en Tienda</p>
                  <p className="text-xs text-[#5b6472]">Gratis - Donihue</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#e8eaee] cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="entrega"
                  value="despacho"
                  checked={tipoEntrega === "despacho"}
                  onChange={() => setTipoEntrega("despacho")}
                  className="accent-[#0f1115]"
                />
                <div>
                  <p className="text-sm font-medium">Despacho a Domicilio</p>
                  <p className="text-xs text-[#5b6472]">Miercoles y Viernes</p>
                </div>
              </label>
            </div>
          </div>

          {/* Zone selector */}
          {tipoEntrega === "despacho" && (
            <div className="mb-4">
              <label className="text-sm font-semibold text-[#0f1115] block mb-2">
                Zona de envio
              </label>
              <select
                value={zonaSeleccionada}
                onChange={(e) => setZonaSeleccionada(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#e8eaee] text-sm bg-white"
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

          <div className="border-t border-[#e8eaee] pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#5b6472]">Subtotal</span>
              <span className="font-medium">{formatCLP(subtotal)}</span>
            </div>
            {cuponAplicado && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">
                  Cupon ({cuponAplicado.codigo})
                </span>
                <span className="font-medium text-green-600">
                  -{formatCLP(cuponAplicado.descuento)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#5b6472]">Envio</span>
              <span className="font-medium">
                {tipoEntrega === "retiro_tienda"
                  ? "Gratis"
                  : costoEnvio === 0
                    ? zona ? "Gratis" : "Selecciona zona"
                    : formatCLP(costoEnvio)}
              </span>
            </div>
            <div className="border-t border-[#e8eaee] pt-2 flex justify-between">
              <span className="font-bold text-[#0f1115]">Total</span>
              <span className="text-xl font-extrabold text-[#0f1115]">
                {formatCLP(total)}
              </span>
            </div>
          </div>

          <Button
            nativeButton={false} render={<Link href={`/checkout?tipo=${tipoEntrega}${zonaSeleccionada ? `&zona=${zonaSeleccionada}` : ""}${cuponAplicado ? `&cupon=${cuponAplicado.codigo}` : ""}`} />}
            className="w-full mt-4 bg-[#0f1115] hover:bg-[#000000] text-white font-bold py-6"
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
