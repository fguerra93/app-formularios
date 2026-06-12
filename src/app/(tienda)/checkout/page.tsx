"use client";

import { Suspense, useState, useEffect, useRef, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/components/auth/auth-provider";
import { formatCLP } from "@/lib/format";
import { validarRut, formatearRut } from "@/lib/rut";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, Store, Loader2, Package, User } from "lucide-react";
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
  const { user, cliente } = useAuth();

  const tipoEntrega = (searchParams.get("tipo") as "retiro_tienda" | "despacho") || "retiro_tienda";
  const zonaId = searchParams.get("zona") || "";

  const [zonas, setZonas] = useState<ZonaEnvio[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pagoMetodo, setPagoMetodo] = useState<"webpay" | "mercadopago" | "transferencia" | "retiro">(
    tipoEntrega === "retiro_tienda" ? "retiro" : "webpay"
  );

  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
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

  // Pre-fill form data for logged-in users
  useEffect(() => {
    if (cliente) {
      setForm((prev) => ({
        ...prev,
        nombre: cliente.nombre || prev.nombre,
        email: cliente.email || prev.email,
        telefono: cliente.telefono || prev.telefono,
        rut: cliente.rut || prev.rut,
        ...(cliente.direccion_default
          ? {
              calle: cliente.direccion_default.calle || prev.calle,
              numero: cliente.direccion_default.numero || prev.numero,
              comuna: cliente.direccion_default.comuna || prev.comuna,
              ciudad: cliente.direccion_default.ciudad || prev.ciudad,
              region: cliente.direccion_default.region || prev.region,
            }
          : {}),
      }));
    }
  }, [cliente]);

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
    if (form.rut.trim() && !validarRut(form.rut)) errs.rut = "RUT inválido — revisa el dígito verificador";
    if (tipoEntrega === "despacho") {
      if (!form.calle.trim()) errs.calle = "Ingresa la calle";
      if (!form.numero.trim()) errs.numero = "Ingresa el numero";
      if (!form.comuna.trim()) errs.comuna = "Ingresa la comuna";
      if (!form.ciudad.trim()) errs.ciudad = "Ingresa la ciudad";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Captura temprana del carrito (materia prima del recordatorio de
  // abandono). Silenciosa: jamás molesta al cliente si falla.
  const capturaPrevia = useRef("");
  const capturarCarrito = () => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (items.length === 0 || capturaPrevia.current === email) return;
    capturaPrevia.current = email;
    fetch("/api/carritos/capturar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        telefono: form.telefono.trim() || null,
        items,
        total,
        cliente_id: user?.id || null,
      }),
    }).catch(() => {});
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
        pago_metodo:
          pagoMetodo === "webpay"
            ? "webpay"
            : pagoMetodo === "mercadopago"
              ? "mercadopago"
              : pagoMetodo === "transferencia"
                ? "transferencia"
                : "pago_retiro",
        cliente_id: user?.id || null,
      };

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const pedidoId = data.pedido.id;

        // Newsletter subscription
        if (newsletterOptIn && form.email) {
          fetch("/api/newsletter/suscribir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, nombre: form.nombre, fuente: "checkout" }),
          }).catch(() => {});
        }

        if (pagoMetodo === "webpay") {
          // Crear transacción Webpay Plus y redirigir a Transbank
          const wpRes = await fetch("/api/pagos/webpay/crear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pedido_id: pedidoId }),
          });
          const wpData = await wpRes.json();

          if (wpRes.ok && wpData.url && wpData.token) {
            clearCart();
            window.location.assign(`${wpData.url}?token_ws=${wpData.token}`);
            return;
          } else {
            clearCart();
            router.push(`/checkout/confirmacion/${pedidoId}?pago=error_webpay`);
            return;
          }
        }

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
            window.location.assign(mpData.init_point);
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
        const faltantes = Array.isArray(data.faltantes)
          ? data.faltantes
              .map((f: { nombre: string; disponible: number }) => `• ${f.nombre} (quedan ${f.disponible})`)
              .join("\n")
          : "";
        alert([data.error || "Error al crear el pedido", faltantes].filter(Boolean).join("\n\n"));
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
        <h1 className="text-2xl font-bold text-[#0f1115] mb-4">Tu carrito esta vacio</h1>
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

      <h1 className="text-2xl font-extrabold text-[#0f1115] mb-4" style={{ letterSpacing: "-0.02em" }}>
        Finalizar Compra
      </h1>

      {/* Progress Steps */}
      {(() => {
        const currentStep =
          form.nombre && form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && pagoMetodo
            ? 2
            : pagoMetodo
            ? 1
            : 0;
        const steps = [
          { num: 1, label: "Datos" },
          { num: 2, label: "Pago" },
          { num: 3, label: "Confirmar" },
        ];
        return (
          <div className="flex items-center justify-center gap-0 mb-8 mt-2">
            {steps.map((step, i) => (
              <Fragment key={step.num}>
                {i > 0 && (
                  <div
                    className={`h-0.5 w-12 sm:w-20 transition-colors ${
                      i <= currentStep ? "bg-[#00B4D8]" : "bg-[#e8eaee]"
                    }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      i <= currentStep
                        ? "bg-[#0f1115] text-white"
                        : "bg-[#e8eaee] text-[#5b6472]"
                    }`}
                  >
                    {step.num}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      i <= currentStep ? "text-[#0f1115]" : "text-[#8b94a3]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        );
      })()}

      {/* Login banner for guests */}
      {!user && (
        <div className="mb-6 p-4 bg-[#fafafb] rounded-xl border border-[#e8eaee] flex items-center gap-3">
          <User className="size-5 text-[#0f1115] shrink-0" />
          <p className="text-sm text-[#0f1115]">
            Tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-[#00B4D8] hover:underline">
              Inicia sesion
            </Link>{" "}
            para un checkout mas rapido
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client data */}
            <div className="bg-white rounded-xl border border-[#e8eaee] p-6">
              <h2 className="font-bold text-[#0f1115] mb-4">Datos del Cliente</h2>
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
                    onBlur={capturarCarrito}
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
                    onBlur={() => {
                      const v = form.rut.trim();
                      if (v && validarRut(v)) updateField("rut", formatearRut(v));
                    }}
                    placeholder="12.345.678-9"
                    className={errors.rut ? "border-red-500" : ""}
                  />
                  {errors.rut && (
                    <p className="text-xs text-red-500 mt-1">{errors.rut}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping address */}
            {tipoEntrega === "despacho" && (
              <div className="bg-white rounded-xl border border-[#e8eaee] p-6">
                <h2 className="font-bold text-[#0f1115] mb-4">Direccion de Envio</h2>
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
            <div className="bg-white rounded-xl border border-[#e8eaee] p-6">
              <h2 className="font-bold text-[#0f1115] mb-4">Método de Pago</h2>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    pagoMetodo === "webpay"
                      ? "border-[#00B4D8] bg-[#fafafb]"
                      : "border-[#e8eaee] hover:border-[#CBD5E1]"
                  }`}
                >
                  <input
                    type="radio"
                    name="pago"
                    value="webpay"
                    checked={pagoMetodo === "webpay"}
                    onChange={() => setPagoMetodo("webpay")}
                    className="accent-[#00B4D8]"
                  />
                  <CreditCard className="size-5 text-[#0f1115]" />
                  <div className="flex-1">
                    <p className="font-medium text-[#0f1115]">Webpay Plus</p>
                    <p className="text-xs text-[#5b6472]">
                      Débito, crédito o prepago — Transbank
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    pagoMetodo === "mercadopago"
                      ? "border-[#00B4D8] bg-[#fafafb]"
                      : "border-[#e8eaee] hover:border-[#CBD5E1]"
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
                    <p className="font-medium text-[#0f1115]">MercadoPago</p>
                    <p className="text-xs text-[#5b6472]">
                      Tarjeta de credito/debito, cuenta MercadoPago
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    pagoMetodo === "transferencia"
                      ? "border-[#00B4D8] bg-[#fafafb]"
                      : "border-[#e8eaee] hover:border-[#CBD5E1]"
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
                  <Banknote className="size-5 text-[#0f1115]" />
                  <div className="flex-1">
                    <p className="font-medium text-[#0f1115]">Transferencia Bancaria</p>
                    <p className="text-xs text-[#5b6472]">
                      Transferencia manual y confirmacion por WhatsApp
                    </p>
                  </div>
                </label>

                {tipoEntrega === "retiro_tienda" && (
                  <label
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      pagoMetodo === "retiro"
                        ? "border-[#00B4D8] bg-[#fafafb]"
                        : "border-[#e8eaee] hover:border-[#CBD5E1]"
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
                      <p className="font-medium text-[#0f1115]">Pago al Retirar</p>
                      <p className="text-xs text-[#5b6472]">
                        Paga en efectivo o tarjeta cuando retires en tienda
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Newsletter opt-in */}
            <div className="bg-white rounded-xl border border-[#e8eaee] p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(e) => setNewsletterOptIn(e.target.checked)}
                  className="mt-0.5 accent-[#00B4D8]"
                />
                <span className="text-sm text-[#0f1115]">
                  Quiero recibir ofertas y novedades por email
                </span>
              </label>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-xl border border-[#e8eaee] p-6 h-fit sticky top-20">
            <h2 className="font-bold text-[#0f1115] mb-4">Resumen del Pedido</h2>

            <ul className="space-y-3 mb-4">
              {items.map((item) => {
                const variantKey = item.variante
                  ? Object.values(item.variante).join("-")
                  : "";
                const key = `${item.producto_id}-${variantKey}`;
                const unitPrice = item.precio + item.precio_extra;

                return (
                  <li key={key} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#fafafb] flex items-center justify-center shrink-0 overflow-hidden">
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
                      <p className="text-sm font-medium text-[#0f1115] truncate">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-[#5b6472]">
                        {item.cantidad} x {formatCLP(unitPrice)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#0f1115]">
                      {formatCLP(unitPrice * item.cantidad)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-[#e8eaee] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#5b6472]">Subtotal</span>
                <span>{formatCLP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5b6472]">Envio</span>
                <span>{costoEnvio > 0 ? formatCLP(costoEnvio) : "Gratis"}</span>
              </div>
              <div className="border-t border-[#e8eaee] pt-2 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="text-xl font-extrabold text-[#0f1115]">
                  {formatCLP(total)}
                </span>
              </div>
              {/* IVA informativo: los precios YA incluyen IVA (19%). */}
              <div className="flex justify-between text-xs text-[#8b94a3]">
                <span>Neto</span>
                <span>{formatCLP(Math.round(total / 1.19))}</span>
              </div>
              <div className="flex justify-between text-xs text-[#8b94a3]">
                <span>IVA (19%) incluido</span>
                <span>{formatCLP(total - Math.round(total / 1.19))}</span>
              </div>
              <p className="pt-1 text-center text-[11px] text-[#8b94a3]">
                Los precios incluyen IVA (19%).
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[#0f1115] hover:bg-[#000000] text-white font-bold py-6"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : pagoMetodo === "webpay" ? (
                "Pagar con Webpay"
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
