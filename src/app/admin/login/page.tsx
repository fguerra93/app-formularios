"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.replace("/admin");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Credenciales incorrectas");
      }
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#F7F8FC" }}
    >
      <div className="w-full max-w-sm px-4">
        <Card className="overflow-hidden shadow-lg">
          {/* Gradient strip */}
          <div
            className="h-1.5"
            style={{
              background:
                "linear-gradient(to right, #FFD100, #E91E8C, #00B4D8, #1B2A6B)",
            }}
          />

          <CardHeader className="pb-2 pt-6 text-center">
            <div className="mb-2">
              <h1
                className="text-2xl font-bold"
                style={{
                  background:
                    "linear-gradient(135deg, #1B2A6B, #00B4D8, #E91E8C)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                PrintUp Admin
              </h1>
            </div>
            <CardTitle className="text-base font-medium" style={{ color: "#64748B" }}>
              Inicia sesion para continuar
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username" style={{ color: "#1E293B" }}>
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" style={{ color: "#1E293B" }}>
                  Contrasena
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="mt-1 h-9 w-full gap-2"
                style={{ backgroundColor: "#1B2A6B" }}
              >
                <LogIn className="size-4" />
                {loading ? "Ingresando..." : "Iniciar sesion"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
