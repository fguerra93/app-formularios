"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, Store, Loader2, Package } from "lucide-react";
import type { ZonaEnvio } from "@/lib/types";

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getSubtotal, clearCart } = useCart();

  const tipoEntrega = (searchParams.get("tipo") as "retiro_tienda" | "despacho") || "retiro_tienda";
  const zonaId = searchParams.get("zona") || "";

  const [zonas, setZonas] = useState<ZonaEnvio[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pagoMetodo, setPagoMetodo] = useState<"mercadopago" | "transferencia" | "retiro">(
    tipoEntrega === "retiro_tienda" ? "retiro" : "mercadopago"
  );

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rut: "",
    calle: "",
    numero: "",
    comuna: "",
    ciudad: "",
    region: "O'Higgins",
    notas: "",
  });

  useEffect(() => {
    fetch("/api/zonas-envio")
      .then((r) => r.json())
      .then((data) => setZonas(Array.isArray(data) ? data : []));
  }, []);

  const zona = zonas.find((z) => z.id === zonaId);
  const subtotal = getSubtotal();
  const envioGratis = zona?.envio_gratis_desde && subtotal >= zona.envio_gratis_desde;
  const costoEnvio = tipoEntrega === "despacho" && zona && !envioGratis ? zona.precio : 0;
  const total = subtotal + costoEnvio;

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = "Ingresa tu nombre";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Ingresa un email valido";
    if (tipoEntrega === "despacho") {
      if (!form.calle.trim()) errs.calle = "Ingresa la calle";
      if (!form.numero.trim()) errs.numero = "Ingresa el numero";
      if (!form.comuna.trim()) errs.comuna = "Ingresa la comuna";
      if (!form.ciudad.trim()) errs.ciudad = "Ingresa la ciudad";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) return;

    setLoading(true);

    try {
      const pedidoItems = items.map((item) => ({
        producto_id: item.producto_id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio + item.precio_extra,
        variante: item.variante,
      }));

      const body = {
        cliente_nombre: form.nombre.trim(),
        cliente_email: form.email.trim(),
        cliente_telefono: form.telefono.trim() || null,
        cliente_rut: form.rut.trim() || null,
        direccion_envio:
          tipoEntrega === "despacho"
            ? {
                calle: form.calle.trim(),
                numero: form.numero.trim(),
                comuna: form.comuna.trim(),
                ciudad: form.ciudad.trim(),
                region: form.region.trim(),
                notas: form.notas.trim(),
              }
            : null,
        tipo_entrega: tipoEntrega,
        items: pedidoItems,
        subtotal,
        costo_envio: costoEnvio,
        total,
        pago_metodo: pagoMetodo === "mercadopago" ? "mercadopago" : pagoMetodo === "transferencia" ? "transferencia" : "pago_retiro",
      };

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const pedidoId = data.pedido.id;

        if (pagoMetodo === "mercadopago") {
          // Create MercadoPago preference and redirect
          const mpRes = await fetch("/api/pagos/crear-preferencia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pedido_id: pedidoId }),
          });
          const mpData = await mpRes.json();

          if (mpRes.ok && mpData.init_point) {
            clearCart();
            window.location.href = mpData.init_point;
            return;
          } else {
            // MercadoPago failed, fallback to confirmation page
            clearCart();
            router.push(`/checkout/confirmacion/${pedidoId}?pago=error_mp`);
            return;
          }
        }

        clearCart();
        router.push(`/checkout/confirmacion/${pedidoId}`);
      } else {
        alert(data.error || "Error al crear el pedido");
      }
    } catch {
      alert("Error de conexion. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-4">Tu carrito esta vacio</h1>
        <Button nativeButton={false} render={<Link href="/productos" />}>
          Ver productos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Carrito", href: "/carrito" },
          { label: "Checkout" },
        ]}
      />

      <h1 className="text-2xl font-extrabold text-[#1E293B] mb-8" style={{ letterSpacing: "-0.02em" }}>
        Finalizar Compra
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client data */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <h2 className="font-bold text-[#1E293B] mb-4">Datos del Cliente</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre completo *</Label>
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => updateField("nombre", e.target.value)}
                    placeholder="Tu nombre"
                    className={errors.nombre ? "border-red-500" : ""}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="tu@email.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => updateField("telefono", e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="rut">RUT (opcional)</Label>
                  <Input
                    id="rut"
                    value={form.rut}
                    onChange={(e) => updateField("rut", e.target.value)}
                    placeholder="12.345.678-9"
                  />
                </div>
              </div>
            </div>

            {/* Shipping address */}
            {tipoEntrega === "despacho" && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                <h2 className="font-bold text-[#1E293B] mb-4">Direccion de Envio</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="calle">Calle *</Label>
                    <Input
                      id="calle"
                      value={form.calle}
                      onChange={(e) => updateField("calle", e.target.value)}
                      placeholder="Nombre de la calle"
                      className={errors.calle ? "border-red-500" : ""}
                    />
                    {errors.calle && (
                      <p className="text-xs text-red-500 mt-1">{errors.calle}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="numero">Numero *</Label>
                    <Input
                      id="numero"
                      value={form.numero}
                      onChange={(e) => updateField("numero", e.target.value)}
                      placeholder="123"
                      className={errors.numero ? "border-red-500" : ""}
                    />
                    {errors.numero && (
                      <p className="text-xs text-red-500 mt-1">{errors.numero}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="comuna">Comuna *</Label>
                    <Input
                      id="comuna"
                      value={form.comuna}
                      onChange={(e) => updateField("comuna", e.target.value)}
                      placeholder="Donihue"
                      className={errors.comuna ? "border-red-500" : ""}
                    />
                    {errors.comuna && (
                      <p className="text-xs text-red-500 mt-1">{errors.comuna}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    <Input
                      id="ciudad"
                      value={form.ciudad}
                      onChange={(e) => updateField("ciudad", e.target.value)}
                      placeholder="Rancagua"
                      className={errors.ciudad ? "border-red-500" : ""}
                    />
                    {errors.ciudad && (
                      <p className="text-xs text-red-500 mt-1">{errors.ciudad}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={form.region}
                      onChange={(e) => updateField("region", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notas">Notas de entrega</Label>
                    <Input
                      id="notas"
                      value={form.notas}
                      onChange={(e) => updateField("notas", e.target.value)}
                      placeholder="Depto, referencias..."
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Payment method */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <h2 className="font-bold text-[#1E293B] mb-4">Metodo de Pago</h2>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    pagoMetodo === "mercadopago"
                      ? "border-[#00B4D8] bg-[#F0F7FF]"
                      : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <input
                    type="radio"
                    name="pago"
                    value="mercadopago"
                    checked={pagoMetodo === "mercadopago"}
                    onChange={() => setPagoMetodo("mercadopago")}
                    className="accent-[#00B4D8]"
                  />
                  <CreditCard className="size-5 text-[#009EE3]" />
                  <div className="flex-1">
                    <p className="font-medium text-[#1E293B]">MercadoPago</p>
                    <p className="text-xs text-[#64748B]">
                      Tarjeta de credito/debito, cuenta MercadoPago
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    pagoMetodo === "transferencia"
                      ? "border-[#00B4D8] bg-[#F0F7FF]"
                      : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <input
                    type="radio"
                    name="pago"
                    value="transferencia"
                    checked={pagoMetodo === "transferencia"}
                    onChange={() => setPagoMetodo("transferencia")}
                    className="accent-[#00B4D8]"
                  />
                  <Banknote className="size-5 text-[#1B2A6B]" />
                  <div className="flex-1">
                    <p className="font-medium text-[#1E293B]">Transferencia Bancaria</p>
                    <p className="text-xs text-[#64748B]">
                      Transferencia manual y confirmacion por WhatsApp
                    </p>
                  </div>
                </label>

                {tipoEntrega === "retiro_tienda" && (
                  <label
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      pagoMetodo === "retiro"
                        ? "border-[#00B4D8] bg-[#F0F7FF]"
                        : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pago"
                      value="retiro"
                      checked={pagoMetodo === "retiro"}
                      onChange={() => setPagoMetodo("retiro")}
                      className="accent-[#00B4D8]"
                    />
                    <Store className="size-5 text-[#F97316]" />
                    <div className="flex-1">
                      <p className="font-medium text-[#1E293B]">Pago al Retirar</p>
                      <p className="text-xs text-[#64748B]">
                        Paga en efectivo o tarjeta cuando retires en tienda
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 h-fit sticky top-20">
            <h2 className="font-bold text-[#1E293B] mb-4">Resumen del Pedido</h2>

            <ul className="space-y-3 mb-4">
              {items.map((item) => {
                const variantKey = item.variante
                  ? Object.values(item.variante).join("-")
                  : "";
                const key = `${item.producto_id}-${variantKey}`;
                const unitPrice = item.precio + item.precio_extra;

                return (
                  <li key={key} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0 overflow-hidden">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="size-4 text-[#00B4D8]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {item.cantidad} x {formatCLP(unitPrice)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#1E293B]">
                      {formatCLP(unitPrice * item.cantidad)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-[#E2E8F0] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Subtotal</span>
                <span>{formatCLP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Envio</span>
                <span>{costoEnvio > 0 ? formatCLP(costoEnvio) : "Gratis"}</span>
              </div>
              <div className="border-t border-[#E2E8F0] pt-2 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="text-xl font-extrabold text-[#1B2A6B]">
                  {formatCLP(total)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[#1B2A6B] hover:bg-[#152259] text-white font-bold py-6"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : pagoMetodo === "mercadopago" ? (
                "Pagar con MercadoPago"
              ) : (
                "Confirmar Pedido"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
