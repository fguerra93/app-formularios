"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useAuth } from "@/components/auth/auth-provider";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  if (!authLoading && user) {
    router.replace("/mi-cuenta");
    return null;
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Ingresa un email valido";
    }
    if (!form.password) {
      errs.password = "Ingresa tu contrasena";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signIn(form.email.trim(), form.password);
      toast.success("Sesion iniciada");
      // Recarga completa para que AuthProvider relea la sesión (cookie).
      window.location.assign("/mi-cuenta");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Email o contrasena incorrectos";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Iniciar Sesion" }]} />

      <div className="bg-white rounded-xl border border-[#e8eaee] p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0f1115] flex items-center justify-center">
            <LogIn className="size-6 text-white" />
          </div>
          <h1
            className="text-2xl font-extrabold text-[#0f1115]"
            style={{ letterSpacing: "-0.02em" }}
          >
            Iniciar Sesion
          </h1>
          <p className="text-sm text-[#5b6472] mt-1">
            Accede a tu cuenta para ver tus pedidos
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <Label htmlFor="password">Contrasena</Label>
                <Link
                  href="/recuperar-password"
                  className="text-xs text-[#00B4D8] hover:underline"
                >
                  Olvidaste tu contrasena?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Tu contrasena"
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#0f1115] hover:bg-[#000000] text-white font-bold py-5"
            size="lg"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Iniciar Sesion
          </Button>
        </form>

        <p className="text-center text-sm text-[#5b6472] mt-6">
          No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="text-[#00B4D8] font-semibold hover:underline"
          >
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
