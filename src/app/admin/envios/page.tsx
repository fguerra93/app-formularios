"use client";

import { useEffect, useState } from "react";
import { Truck, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { formatCLP } from "@/lib/format";
import { toast } from "sonner";
import type { ZonaEnvio } from "@/lib/types";

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

interface ZonaForm {
  nombre: string;
  comunas: string;
  precio: number;
  envio_gratis_desde: number;
  activa: boolean;
  dias_despacho: string[];
  horario: string;
}

const emptyForm: ZonaForm = {
  nombre: "",
  comunas: "",
  precio: 0,
  envio_gratis_desde: 0,
  activa: true,
  dias_despacho: [],
  horario: "",
};

function EnviosContent() {
  const [zonas, setZonas] = useState<ZonaEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZonaForm>(emptyForm);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/envios");
    const data = await res.json();
    setZonas(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const startEdit = (z: ZonaEnvio) => {
    setEditingId(z.id);
    setForm({
      nombre: z.nombre,
      comunas: z.comunas.join(", "),
      precio: z.precio,
      envio_gratis_desde: z.envio_gratis_desde || 0,
      activa: z.activa,
      dias_despacho: z.dias_despacho || [],
      horario: z.horario || "",
    });
    setShowNew(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startNew = () => {
    setShowNew(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const toggleDia = (dia: string) => {
    setForm((prev) => ({
      ...prev,
      dias_despacho: prev.dias_despacho.includes(dia)
        ? prev.dias_despacho.filter((d) => d !== dia)
        : [...prev.dias_despacho, dia],
    }));
  };

  const saveZona = async () => {
    if (!form.nombre || !form.precio) {
      toast.error("Nombre y precio son obligatorios");
      return;
    }
    setSaving(true);

    const payload = {
      nombre: form.nombre,
      comunas: form.comunas.split(",").map((c) => c.trim()).filter(Boolean),
      precio: form.precio,
      envio_gratis_desde: form.envio_gratis_desde || null,
      activa: form.activa,
      dias_despacho: form.dias_despacho,
      horario: form.horario || null,
    };

    const url = editingId ? `/api/admin/envios/${editingId}` : "/api/admin/envios";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editingId ? "Zona actualizada" : "Zona creada");
      cancelEdit();
      setShowNew(false);
      fetchData();
    } else {
      toast.error("Error al guardar");
    }
    setSaving(false);
  };

  const deleteZona = async (id: string) => {
    if (!confirm("Eliminar esta zona de envio?")) return;
    const res = await fetch(`/api/admin/envios/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Zona eliminada");
      fetchData();
    } else {
      toast.error("Error al eliminar");
    }
  };

  const renderForm = () => (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre *</label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Zona 1 - Donihue" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Comunas (separadas por coma)</label>
            <Input value={form.comunas} onChange={(e) => setForm({ ...form, comunas: e.target.value })} placeholder="Donihue, Coltauco, Coinco" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Precio envio (CLP) *</label>
            <Input type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Envio gratis desde (CLP)</label>
            <Input type="number" value={form.envio_gratis_desde} onChange={(e) => setForm({ ...form, envio_gratis_desde: Number(e.target.value) })} placeholder="0 = nunca gratis" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Horario de entrega</label>
            <Input value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} placeholder="Ej: 10:00 - 18:00" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Dias de despacho</label>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((dia) => (
              <button
                key={dia}
                onClick={() => toggleDia(dia)}
                className="rounded-full px-3 py-1 text-sm capitalize transition-colors"
                style={{
                  backgroundColor: form.dias_despacho.includes(dia) ? "#1B2A6B" : "#F1F5F9",
                  color: form.dias_despacho.includes(dia) ? "#FFFFFF" : "#64748B",
                }}
              >
                {dia}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
          <span className="text-sm">Zona activa</span>
        </label>

        <div className="flex gap-2">
          <Button
            onClick={saveZona}
            disabled={saving}
            style={{ backgroundColor: "#1B2A6B" }}
            className="gap-2 text-white hover:opacity-90"
          >
            <Save className="size-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button variant="outline" onClick={() => { cancelEdit(); setShowNew(false); }}>
            <X className="size-4" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Zonas de Envio</h1>
          <p className="text-sm" style={{ color: "#64748B" }}>Configura las zonas y costos de despacho</p>
        </div>
        {!showNew && !editingId && (
          <Button onClick={startNew} style={{ backgroundColor: "#1B2A6B" }} className="gap-2 text-white hover:opacity-90">
            <Plus className="size-4" /> Nueva Zona
          </Button>
        )}
      </div>

      {(showNew || editingId) && renderForm()}

      {/* Zones list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <Truck className="size-5" />
            Zonas Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : zonas.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>No hay zonas configuradas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {zonas.map((z) => (
                <div
                  key={z.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: "#1E293B" }}>{z.nombre}</span>
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: z.activa ? "#10B98120" : "#EF444420",
                          color: z.activa ? "#10B981" : "#EF4444",
                        }}
                      >
                        {z.activa ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm" style={{ color: "#64748B" }}>
                      Comunas: {z.comunas.join(", ")}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs" style={{ color: "#64748B" }}>
                      <span>Precio: <strong style={{ color: "#1E293B" }}>{formatCLP(z.precio)}</strong></span>
                      {z.envio_gratis_desde && (
                        <span>Gratis sobre: <strong style={{ color: "#10B981" }}>{formatCLP(z.envio_gratis_desde)}</strong></span>
                      )}
                      {z.dias_despacho && z.dias_despacho.length > 0 && (
                        <span>Dias: {z.dias_despacho.join(", ")}</span>
                      )}
                      {z.horario && <span>Horario: {z.horario}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(z)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteZona(z.id)}>
                      <Trash2 className="size-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EnviosPage() {
  return (
    <AuthGuard>
      <EnviosContent />
    </AuthGuard>
  );
}
