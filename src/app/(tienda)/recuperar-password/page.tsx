"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth-client";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un email valido");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
      toast.success("Email de recuperacion enviado");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al enviar el email de recuperacion";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Iniciar Sesion", href: "/login" },
          { label: "Recuperar Contrasena" },
        ]}
      />

      <div className="bg-white rounded-xl border border-[#e8eaee] p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0f1115] flex items-center justify-center">
            <KeyRound className="size-6 text-white" />
          </div>
          <h1
            className="text-2xl font-extrabold text-[#0f1115]"
            style={{ letterSpacing: "-0.02em" }}
          >
            Recuperar Contrasena
          </h1>
          <p className="text-sm text-[#5b6472] mt-1">
            Te enviaremos un enlace para restablecer tu contrasena
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className={error ? "border-red-500" : ""}
                />
                {error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
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
              Enviar enlace de recuperacion
            </Button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="size-7 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-[#0f1115] mb-2">
              Revisa tu email
            </h2>
            <p className="text-sm text-[#5b6472] mb-1">
              Hemos enviado un enlace de recuperacion a:
            </p>
            <p className="text-sm font-semibold text-[#0f1115] mb-4">
              {email}
            </p>
            <p className="text-xs text-[#5b6472]">
              Si no ves el correo, revisa tu carpeta de spam.
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#e8eaee]">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-[#00B4D8] font-semibold hover:underline"
          >
            <ArrowLeft className="size-4" />
            Volver a Iniciar Sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
