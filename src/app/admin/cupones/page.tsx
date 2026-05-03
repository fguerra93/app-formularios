"use client";

import { useEffect, useState, useCallback } from "react";
import { Ticket, Plus, Pencil, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { formatCLP } from "@/lib/format";
import { toast } from "sonner";

interface Cupon {
  id: string;
  codigo: string;
  tipo: "porcentaje" | "monto_fijo";
  valor: number;
  minimo_compra: number | null;
  maximo_descuento: number | null;
  usos_maximos: number | null;
  usos_actuales: number;
  fecha_expiracion: string | null;
  activo: boolean;
  created_at: string;
}

const emptyCupon = {
  codigo: "",
  tipo: "porcentaje" as "porcentaje" | "monto_fijo",
  valor: 0,
  minimo_compra: null as number | null,
  maximo_descuento: null as number | null,
  usos_maximos: null as number | null,
  fecha_expiracion: "",
  activo: true,
};

function getEstadoCupon(cupon: Cupon): { label: string; bg: string; text: string } {
  if (cupon.fecha_expiracion && new Date(cupon.fecha_expiracion) < new Date()) {
    return { label: "Expirado", bg: "bg-red-100", text: "text-red-700" };
  }
  if (cupon.usos_maximos !== null && cupon.usos_actuales >= cupon.usos_maximos) {
    return { label: "Agotado", bg: "bg-gray-100", text: "text-gray-600" };
  }
  if (!cupon.activo) {
    return { label: "Inactivo", bg: "bg-gray-100", text: "text-gray-600" };
  }
  return { label: "Activo", bg: "bg-green-100", text: "text-green-700" };
}

function CuponesContent() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCupon);
  const [saving, setSaving] = useState(false);

  const fetchCupones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cupones", { credentials: "include" });
      const data = await res.json();
      setCupones(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Error al cargar cupones");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCupones();
  }, [fetchCupones]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyCupon);
    setShowModal(true);
  };

  const openEdit = (cupon: Cupon) => {
    setEditingId(cupon.id);
    setForm({
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: cupon.valor,
      minimo_compra: cupon.minimo_compra,
      maximo_descuento: cupon.maximo_descuento,
      usos_maximos: cupon.usos_maximos,
      fecha_expiracion: cupon.fecha_expiracion
        ? cupon.fecha_expiracion.split("T")[0]
        : "",
      activo: cupon.activo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.codigo.trim()) {
      toast.error("El codigo es obligatorio");
      return;
    }
    if (form.valor <= 0) {
      toast.error("El valor debe ser mayor a 0");
      return;
    }

    setSaving(true);
    try {
      const body = {
        codigo: form.codigo.toUpperCase().trim(),
        tipo: form.tipo,
        valor: form.valor,
        minimo_compra: form.minimo_compra || null,
        maximo_descuento: form.maximo_descuento || null,
        usos_maximos: form.usos_maximos || null,
        fecha_expiracion: form.fecha_expiracion || null,
        activo: form.activo,
      };

      const url = editingId
        ? `/api/admin/cupones/${editingId}`
        : "/api/admin/cupones";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingId ? "Cupon actualizado" : "Cupon creado");
        setShowModal(false);
        fetchCupones();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  const handleDelete = async (cupon: Cupon) => {
    if (!confirm(`Eliminar el cupon "${cupon.codigo}"?`)) return;
    try {
      const res = await fetch(`/api/admin/cupones/${cupon.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Cupon eliminado");
        fetchCupones();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
            Cupones
          </h1>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Gestiona los cupones de descuento
          </p>
        </div>
        <Button
          onClick={openNew}
          style={{ backgroundColor: "#1B2A6B" }}
          className="gap-2 text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Nuevo Cupon
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2"
            style={{ color: "#1E293B" }}
          >
            <Ticket className="size-5" />
            Lista de Cupones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : cupones.length === 0 ? (
            <p
              className="py-8 text-center text-sm"
              style={{ color: "#64748B" }}
            >
              No hay cupones creados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ color: "#64748B" }}>
                    <th className="pb-3 text-left font-medium">Codigo</th>
                    <th className="pb-3 text-left font-medium">Tipo</th>
                    <th className="pb-3 text-right font-medium">Valor</th>
                    <th className="hidden pb-3 text-right font-medium md:table-cell">
                      Min. Compra
                    </th>
                    <th className="hidden pb-3 text-center font-medium sm:table-cell">
                      Usos
                    </th>
                    <th className="pb-3 text-center font-medium">Estado</th>
                    <th className="hidden pb-3 text-left font-medium md:table-cell">
                      Expiracion
                    </th>
                    <th className="pb-3 text-center font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cupones.map((c) => {
                    const estado = getEstadoCupon(c);
                    return (
                      <tr
                        key={c.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td
                          className="py-3 font-mono font-semibold"
                          style={{ color: "#1B2A6B" }}
                        >
                          {c.codigo}
                        </td>
                        <td className="py-3" style={{ color: "#64748B" }}>
                          {c.tipo === "porcentaje" ? "Porcentaje" : "Monto fijo"}
                        </td>
                        <td
                          className="py-3 text-right font-medium"
                          style={{ color: "#1E293B" }}
                        >
                          {c.tipo === "porcentaje"
                            ? `${c.valor}%`
                            : formatCLP(c.valor)}
                        </td>
                        <td
                          className="hidden py-3 text-right md:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {c.minimo_compra ? formatCLP(c.minimo_compra) : "—"}
                        </td>
                        <td className="hidden py-3 text-center sm:table-cell" style={{ color: "#64748B" }}>
                          {c.usos_actuales}/
                          {c.usos_maximos !== null ? c.usos_maximos : "ilimitado"}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${estado.bg} ${estado.text}`}
                          >
                            {estado.label}
                          </span>
                        </td>
                        <td
                          className="hidden py-3 md:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {c.fecha_expiracion
                            ? new Date(c.fecha_expiracion).toLocaleDateString(
                                "es-CL",
                                { day: "numeric", month: "short", year: "numeric" }
                              )
                            : "Sin limite"}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Editar"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Eliminar"
                              onClick={() => handleDelete(c)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-bold"
                style={{ color: "#1E293B" }}
              >
                {editingId ? "Editar Cupon" : "Nuevo Cupon"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="size-5" style={{ color: "#64748B" }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Codigo */}
              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: "#1E293B" }}>
                  Codigo
                </label>
                <Input
                  value={form.codigo}
                  onChange={(e) =>
                    setForm({ ...form, codigo: e.target.value.toUpperCase() })
                  }
                  placeholder="VERANO2026"
                  className="uppercase"
                />
              </div>

              {/* Tipo + Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: "#1E293B" }}>
                    Tipo
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tipo: e.target.value as "porcentaje" | "monto_fijo",
                      })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="porcentaje">Porcentaje</option>
                    <option value="monto_fijo">Monto fijo</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: "#1E293B" }}>
                    Valor
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.valor || ""}
                    onChange={(e) =>
                      setForm({ ...form, valor: Number(e.target.value) })
                    }
                    placeholder={form.tipo === "porcentaje" ? "10" : "5000"}
                  />
                </div>
              </div>

              {/* Minimo compra + Maximo descuento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: "#1E293B" }}>
                    Minimo compra
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.minimo_compra ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        minimo_compra: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: "#1E293B" }}>
                    Max. descuento
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.maximo_descuento ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maximo_descuento: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Usos maximos + Fecha expiracion */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: "#1E293B" }}>
                    Usos maximos
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.usos_maximos ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        usos_maximos: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: "#1E293B" }}>
                    Fecha expiracion
                  </label>
                  <input
                    type="date"
                    value={form.fecha_expiracion || ""}
                    onChange={(e) =>
                      setForm({ ...form, fecha_expiracion: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Activo toggle */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Activo
                </label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, activo: !form.activo })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.activo ? "bg-[#1B2A6B]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                      form.activo ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: "#1B2A6B" }}
                className="text-white hover:opacity-90"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar"
                    : "Crear Cupon"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CuponesPage() {
  return (
    <AuthGuard>
      <CuponesContent />
    </AuthGuard>
  );
}
