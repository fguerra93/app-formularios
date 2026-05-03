"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Palette,
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  Image as ImageIcon,
  Type,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

/* ---------- Types ---------- */
interface Clipart {
  id: string;
  nombre: string;
  categoria: string | null;
  url: string;
  tags: string[];
  activo: boolean;
  created_at: string;
}

interface Fuente {
  id: string;
  nombre: string;
  familia: string;
  url: string | null;
  categoria: string | null;
  popular: boolean;
  activo: boolean;
  created_at: string;
}

const emptyClipart = {
  nombre: "",
  categoria: "",
  url: "",
  tags: "",
  activo: true,
};

const emptyFuente = {
  nombre: "",
  familia: "",
  url: "",
  categoria: "",
  popular: false,
  activo: true,
};

const PRESET_FONTS = [
  { nombre: "Montserrat", familia: "Montserrat", url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap", categoria: "Sans-serif", popular: true },
  { nombre: "Roboto", familia: "Roboto", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap", categoria: "Sans-serif", popular: true },
  { nombre: "Open Sans", familia: "Open Sans", url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap", categoria: "Sans-serif", popular: false },
  { nombre: "Lato", familia: "Lato", url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap", categoria: "Sans-serif", popular: false },
  { nombre: "Playfair Display", familia: "Playfair Display", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap", categoria: "Serif", popular: true },
  { nombre: "Poppins", familia: "Poppins", url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap", categoria: "Sans-serif", popular: true },
  { nombre: "Oswald", familia: "Oswald", url: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap", categoria: "Sans-serif", popular: false },
  { nombre: "Raleway", familia: "Raleway", url: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;700&display=swap", categoria: "Sans-serif", popular: false },
  { nombre: "Dancing Script", familia: "Dancing Script", url: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap", categoria: "Script", popular: true },
  { nombre: "Permanent Marker", familia: "Permanent Marker", url: "https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap", categoria: "Display", popular: false },
];

/* ---------- Main ---------- */
function DesignerContent() {
  const [tab, setTab] = useState<"clipart" | "fuentes">("clipart");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Palette className="size-6" style={{ color: "#1B2A6B" }} />
        <h1 className="text-2xl font-extrabold" style={{ color: "#1E293B", letterSpacing: "-0.02em" }}>
          Disenador - Recursos
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E2E8F0]">
        <button
          onClick={() => setTab("clipart")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "clipart"
              ? "border-[#1B2A6B] text-[#1B2A6B]"
              : "border-transparent text-[#64748B] hover:text-[#1E293B]"
          }`}
        >
          <ImageIcon className="size-4" />
          Clipart
        </button>
        <button
          onClick={() => setTab("fuentes")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "fuentes"
              ? "border-[#1B2A6B] text-[#1B2A6B]"
              : "border-transparent text-[#64748B] hover:text-[#1E293B]"
          }`}
        >
          <Type className="size-4" />
          Fuentes
        </button>
      </div>

      {tab === "clipart" ? <ClipartTab /> : <FuentesTab />}
    </div>
  );
}

/* ---------- Clipart Tab ---------- */
function ClipartTab() {
  const [items, setItems] = useState<Clipart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyClipart);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/designer/clipart", { credentials: "include" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar clipart");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const categorias = [...new Set(items.map((c) => c.categoria).filter(Boolean))] as string[];

  const filtered = filterCat
    ? items.filter((c) => c.categoria === filterCat)
    : items;

  const openNew = () => {
    setEditingId(null);
    setForm(emptyClipart);
    setShowModal(true);
  };

  const openEdit = (item: Clipart) => {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      categoria: item.categoria || "",
      url: item.url,
      tags: (item.tags || []).join(", "),
      activo: item.activo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.url.trim()) {
      toast.error("Nombre y URL son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim() || null,
        url: form.url.trim(),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        activo: form.activo,
      };

      const res = editingId
        ? await fetch(`/api/admin/designer/clipart/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/designer/clipart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        toast.success(editingId ? "Clipart actualizado" : "Clipart creado");
        setShowModal(false);
        fetchItems();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este clipart?")) return;
    try {
      const res = await fetch(`/api/admin/designer/clipart/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Clipart eliminado");
        fetchItems();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const handleToggleActive = async (item: Clipart) => {
    try {
      await fetch(`/api/admin/designer/clipart/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ activo: !item.activo }),
      });
      fetchItems();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#64748B]">Filtrar:</span>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm"
          >
            <option value="">Todas las categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <Button onClick={openNew} className="gap-2 bg-[#1B2A6B] hover:bg-[#152259] text-white">
          <Plus className="size-4" />
          Subir Clipart
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="size-12 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-[#64748B]">No hay clipart disponible</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`relative group rounded-xl border overflow-hidden bg-white transition-all ${
                item.activo ? "border-[#E2E8F0]" : "border-red-200 opacity-60"
              }`}
            >
              <div className="aspect-square p-4 flex items-center justify-center bg-[#F8FAFC]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.nombre}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="p-2 border-t border-[#E2E8F0]">
                <p className="text-xs font-medium text-[#1E293B] truncate">{item.nombre}</p>
                {item.categoria && (
                  <Badge className="mt-1 text-[10px] bg-[#F0F7FF] text-[#1B2A6B] border-0">
                    {item.categoria}
                  </Badge>
                )}
              </div>
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleToggleActive(item)}
                  className="p-2 rounded-full bg-white text-[#1E293B] hover:bg-gray-100"
                  title={item.activo ? "Desactivar" : "Activar"}
                >
                  <Star className={`size-4 ${item.activo ? "fill-yellow-400 text-yellow-400" : ""}`} />
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 rounded-full bg-white text-[#1E293B] hover:bg-gray-100"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-full bg-white text-red-600 hover:bg-red-50"
                  title="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1E293B]">
                {editingId ? "Editar Clipart" : "Subir Clipart"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="size-5 text-[#64748B]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[#1E293B] block mb-1">Nombre</label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del clipart"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E293B] block mb-1">Categoria</label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ej: Animales, Flores, Deportes..."
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E293B] block mb-1">URL de imagen</label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E293B] block mb-1">Tags (separados por coma)</label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="animal, perro, mascota"
                />
              </div>
              {form.url && (
                <div className="flex items-center justify-center p-4 bg-[#F8FAFC] rounded-lg border border-dashed border-[#E2E8F0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.url} alt="Preview" className="max-h-24 object-contain" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#1B2A6B] hover:bg-[#152259] text-white"
                >
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Fuentes Tab ---------- */
function FuentesTab() {
  const [items, setItems] = useState<Fuente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFuente);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/designer/fuentes", { credentials: "include" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar fuentes");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyFuente);
    setShowModal(true);
  };

  const openEdit = (item: Fuente) => {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      familia: item.familia,
      url: item.url || "",
      categoria: item.categoria || "",
      popular: item.popular,
      activo: item.activo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.familia.trim()) {
      toast.error("Nombre y familia son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        familia: form.familia.trim(),
        url: form.url.trim() || null,
        categoria: form.categoria.trim() || null,
        popular: form.popular,
        activo: form.activo,
      };

      const res = editingId
        ? await fetch(`/api/admin/designer/fuentes/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/designer/fuentes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        toast.success(editingId ? "Fuente actualizada" : "Fuente creada");
        setShowModal(false);
        fetchItems();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta fuente?")) return;
    try {
      const res = await fetch(`/api/admin/designer/fuentes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Fuente eliminada");
        fetchItems();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const handleTogglePopular = async (item: Fuente) => {
    try {
      await fetch(`/api/admin/designer/fuentes/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ popular: !item.popular }),
      });
      fetchItems();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleToggleActive = async (item: Fuente) => {
    try {
      await fetch(`/api/admin/designer/fuentes/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ activo: !item.activo }),
      });
      fetchItems();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const addPresetFonts = async () => {
    if (!confirm("Agregar las 10 fuentes preset de Google Fonts?")) return;
    let added = 0;
    for (const preset of PRESET_FONTS) {
      try {
        const res = await fetch("/api/admin/designer/fuentes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(preset),
        });
        if (res.ok) added++;
      } catch {
        // skip duplicates
      }
    }
    toast.success(`${added} fuentes preset agregadas`);
    fetchItems();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button variant="outline" onClick={addPresetFonts} className="gap-2 text-sm">
          <Type className="size-4" />
          Agregar Google Fonts Preset
        </Button>
        <Button onClick={openNew} className="gap-2 bg-[#1B2A6B] hover:bg-[#152259] text-white">
          <Plus className="size-4" />
          Agregar Fuente
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Type className="size-12 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-[#64748B]">No hay fuentes configuradas</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fuentes ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-2 px-3 font-medium text-[#64748B]">Nombre</th>
                    <th className="text-left py-2 px-3 font-medium text-[#64748B]">Familia CSS</th>
                    <th className="text-left py-2 px-3 font-medium text-[#64748B]">Categoria</th>
                    <th className="text-center py-2 px-3 font-medium text-[#64748B]">Popular</th>
                    <th className="text-center py-2 px-3 font-medium text-[#64748B]">Activo</th>
                    <th className="text-right py-2 px-3 font-medium text-[#64748B]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-medium text-[#1E293B]">{item.nombre}</td>
                      <td className="py-3 px-3 text-[#64748B]" style={{ fontFamily: item.familia }}>
                        {item.familia}
                      </td>
                      <td className="py-3 px-3">
                        {item.categoria && (
                          <Badge className="text-[10px] bg-[#F0F7FF] text-[#1B2A6B] border-0">
                            {item.categoria}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button onClick={() => handleTogglePopular(item)}>
                          <Star
                            className={`size-4 mx-auto ${
                              item.popular ? "fill-yellow-400 text-yellow-400" : "text-[#CBD5E1]"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`w-10 h-5 rounded-full transition-colors relative ${
                            item.activo ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              item.activo ? "left-5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title="Editar"
                          >
                            <Pencil className="size-4 text-[#64748B]" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1E293B]">
                {editingId ? "Editar Fuente" : "Agregar Fuente"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="size-5 text-[#64748B]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[#1E293B] block mb-1">Nombre</label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre de la fuente"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E293B] block mb-1">Familia CSS</label>
                <Input
                  value={form.familia}
                  onChange={(e) => setForm({ ...form, familia: e.target.value })}
                  placeholder="Ej: Montserrat, Roboto..."
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E293B] block mb-1">URL (Google Fonts)</label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://fonts.googleapis.com/css2?family=..."
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E293B] block mb-1">Categoria</label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Sans-serif, Serif, Script, Display..."
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.popular}
                    onChange={(e) => setForm({ ...form, popular: e.target.checked })}
                    className="rounded"
                  />
                  Popular
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    className="rounded"
                  />
                  Activo
                </label>
              </div>
              {form.familia && (
                <div className="p-4 bg-[#F8FAFC] rounded-lg border border-dashed border-[#E2E8F0] text-center">
                  <p style={{ fontFamily: form.familia, fontSize: "1.25rem" }}>
                    Vista previa del texto
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#1B2A6B] hover:bg-[#152259] text-white"
                >
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Export ---------- */
export default function DesignerPage() {
  return (
    <AuthGuard>
      <DesignerContent />
    </AuthGuard>
  );
}
