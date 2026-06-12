"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { useAuth } from "@/components/auth/auth-provider";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RegistroPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);

  // Redirect if already logged in
  if (!authLoading && user) {
    router.replace("/mi-cuenta");
    return null;
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    // Real-time cross-field validation for confirm password
    if (field === "password" && form.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          value !== form.confirmPassword ? "Las contrasenas no coinciden" : "",
      }));
    }
    if (field === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          value !== form.password ? "Las contrasenas no coinciden" : "",
      }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim() || form.nombre.trim().length < 2) {
      errs.nombre = "Ingresa tu nombre (minimo 2 caracteres)";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Ingresa un email valido";
    }
    if (form.password.length < 8) {
      errs.password = "La contrasena debe tener al menos 8 caracteres";
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Las contrasenas no coinciden";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signUp(
        form.email.trim(),
        form.password,
        form.nombre.trim(),
        form.telefono.trim() || undefined
      );
      toast.success("Cuenta creada exitosamente");
      // Newsletter subscription
      if (newsletterOptIn) {
        fetch("/api/newsletter/suscribir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim(), nombre: form.nombre.trim(), fuente: "registro" }),
        }).catch(() => {});
      }
      window.location.assign("/mi-cuenta");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al crear la cuenta";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Crear Cuenta" }]} />

      <div className="bg-white rounded-xl border border-[#e8eaee] p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0f1115] flex items-center justify-center">
            <UserPlus className="size-6 text-white" />
          </div>
          <h1
            className="text-2xl font-extrabold text-[#0f1115]"
            style={{ letterSpacing: "-0.02em" }}
          >
            Crear Cuenta
          </h1>
          <p className="text-sm text-[#5b6472] mt-1">
            Registrate para gestionar tus pedidos y favoritos
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                type="text"
                value={form.nombre}
                onChange={(e) => updateField("nombre", e.target.value)}
                placeholder="Ej: Maria Gonzalez"
                autoComplete="name"
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && (
                <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Telefono */}
            <div>
              <Label htmlFor="telefono">Telefono (opcional)</Label>
              <Input
                id="telefono"
                type="tel"
                value={form.telefono}
                onChange={(e) => updateField("telefono", e.target.value)}
                placeholder="+56 9 1234 5678"
                autoComplete="tel"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Contrasena *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Minimo 8 caracteres"
                  autoComplete="new-password"
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5b6472] hover:text-[#0f1115] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="text-xs text-amber-600 mt-1">
                  {8 - form.password.length} caracteres mas necesarios
                </p>
              )}
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirmar contrasena *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  placeholder="Repite tu contrasena"
                  autoComplete="new-password"
                  className={
                    errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5b6472] hover:text-[#0f1115] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Newsletter opt-in */}
          <label className="flex items-start gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
              className="mt-0.5 accent-[#00B4D8]"
            />
            <span className="text-sm text-[#5b6472]">
              Quiero recibir ofertas y novedades por email
            </span>
          </label>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#0f1115] hover:bg-[#000000] text-white font-bold py-5"
            size="lg"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Crear Cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-[#5b6472] mt-6">
          Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-[#00B4D8] font-semibold hover:underline"
          >
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
