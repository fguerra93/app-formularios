"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseBrowser } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { DireccionEnvio } from "@/lib/types";

export default function MiPerfilPage() {
  const { user, cliente, loading: authLoading, refreshCliente } = useAuth();

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    rut: "",
  });

  const [direccion, setDireccion] = useState<DireccionEnvio>({
    calle: "",
    numero: "",
    comuna: "",
    ciudad: "",
    region: "",
    notas: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre || "",
        telefono: cliente.telefono || "",
        rut: cliente.rut || "",
      });
      if (cliente.direccion_default) {
        setDireccion({
          calle: cliente.direccion_default.calle || "",
          numero: cliente.direccion_default.numero || "",
          comuna: cliente.direccion_default.comuna || "",
          ciudad: cliente.direccion_default.ciudad || "",
          region: cliente.direccion_default.region || "",
          notas: cliente.direccion_default.notas || "",
        });
      }
    }
  }, [cliente]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim() || null,
          rut: form.rut.trim() || null,
          direccion_default: {
            calle: direccion.calle.trim(),
            numero: direccion.numero.trim(),
            comuna: direccion.comuna.trim(),
            ciudad: direccion.ciudad.trim(),
            region: direccion.region.trim(),
            notas: direccion.notas.trim(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshCliente();
      toast.success("Datos actualizados correctamente");
    } catch (err: unknown) {
      console.error("Error updating profile:", err);
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 text-[#1B2A6B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal info */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#F0F7FF] flex items-center justify-center">
            <User className="size-5 text-[#1B2A6B]" />
          </div>
          <div>
            <h2 className="font-bold text-[#1E293B]">Datos personales</h2>
            <p className="text-xs text-[#64748B]">Actualiza tu informacion de contacto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electronico</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefono">Telefono</Label>
            <Input
              id="telefono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rut">RUT</Label>
            <Input
              id="rut"
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
              placeholder="12.345.678-9"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#F0F7FF] flex items-center justify-center">
            <MapPin className="size-5 text-[#00B4D8]" />
          </div>
          <div>
            <h2 className="font-bold text-[#1E293B]">Direccion por defecto</h2>
            <p className="text-xs text-[#64748B]">Se usara como direccion predeterminada en tus pedidos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="calle">Calle</Label>
            <Input
              id="calle"
              value={direccion.calle}
              onChange={(e) => setDireccion({ ...direccion, calle: e.target.value })}
              placeholder="Av. Libertador Bernardo O'Higgins"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="numero">Numero</Label>
            <Input
              id="numero"
              value={direccion.numero}
              onChange={(e) => setDireccion({ ...direccion, numero: e.target.value })}
              placeholder="1234"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comuna">Comuna</Label>
            <Input
              id="comuna"
              value={direccion.comuna}
              onChange={(e) => setDireccion({ ...direccion, comuna: e.target.value })}
              placeholder="Santiago"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input
              id="ciudad"
              value={direccion.ciudad}
              onChange={(e) => setDireccion({ ...direccion, ciudad: e.target.value })}
              placeholder="Santiago"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={direccion.region}
              onChange={(e) => setDireccion({ ...direccion, region: e.target.value })}
              placeholder="Region Metropolitana"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1B2A6B] hover:bg-[#152259] text-white px-8 py-5 font-semibold"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="size-4 mr-2" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
