"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Crosshair,
  Image as ImageIcon,
  GripVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

/* ---------- Types ---------- */
interface AreaDiseno {
  id: string;
  producto_id: string;
  nombre: string;
  mockup_url: string | null;
  area_x: number;
  area_y: number;
  area_width: number;
  area_height: number;
  dpi_recomendado: number;
  max_colores: number | null;
  orden: number;
  created_at: string;
}

const emptyArea = {
  nombre: "",
  mockup_url: "",
  area_x: 25,
  area_y: 15,
  area_width: 50,
  area_height: 70,
  dpi_recomendado: 300,
  max_colores: "" as string | number,
  orden: 0,
};

/* ---------- Visual Area Editor ---------- */
function VisualAreaEditor({
  mockupUrl,
  areaX,
  areaY,
  areaWidth,
  areaHeight,
  onChange,
}: {
  mockupUrl: string;
  areaX: number;
  areaY: number;
  areaWidth: number;
  areaHeight: number;
  onChange: (vals: { area_x: number; area_y: number; area_width: number; area_height: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"move" | "resize" | null>(null);
  const startRef = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0, w: 0, h: 0 });

  const handleMouseDown = (e: React.MouseEvent, mode: "move" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(mode);
    startRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: areaX,
      y: areaY,
      w: areaWidth,
      h: areaHeight,
    };
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dx = ((e.clientX - startRef.current.mouseX) / rect.width) * 100;
      const dy = ((e.clientY - startRef.current.mouseY) / rect.height) * 100;

      if (dragging === "move") {
        const newX = Math.max(0, Math.min(100 - startRef.current.w, startRef.current.x + dx));
        const newY = Math.max(0, Math.min(100 - startRef.current.h, startRef.current.y + dy));
        onChange({
          area_x: Math.round(newX * 10) / 10,
          area_y: Math.round(newY * 10) / 10,
          area_width: areaWidth,
          area_height: areaHeight,
        });
      } else {
        const newW = Math.max(5, Math.min(100 - startRef.current.x, startRef.current.w + dx));
        const newH = Math.max(5, Math.min(100 - startRef.current.y, startRef.current.h + dy));
        onChange({
          area_x: areaX,
          area_y: areaY,
          area_width: Math.round(newW * 10) / 10,
          area_height: Math.round(newH * 10) / 10,
        });
      }
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, areaX, areaY, areaWidth, areaHeight, onChange]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] overflow-hidden select-none"
    >
      {mockupUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mockupUrl} alt="Mockup" className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#CBD5E1]">
          <ImageIcon className="size-16" />
        </div>
      )}
      {/* Design area overlay */}
      <div
        className="absolute border-2 border-dashed border-[#00B4D8] bg-[#00B4D8]/10 cursor-move"
        style={{
          left: `${areaX}%`,
          top: `${areaY}%`,
          width: `${areaWidth}%`,
          height: `${areaHeight}%`,
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-medium text-[#00B4D8] bg-white/80 px-2 py-0.5 rounded">
            Area de diseno
          </span>
        </div>
        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-[#00B4D8] cursor-se-resize"
          onMouseDown={(e) => handleMouseDown(e, "resize")}
        />
      </div>
    </div>
  );
}

/* ---------- Main Content ---------- */
function PersonalizacionContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [areas, setAreas] = useState<AreaDiseno[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyArea);
  const [saving, setSaving] = useState(false);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/productos/${id}/areas-diseno`, { credentials: "include" });
      const data = await res.json();
      setAreas(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar areas de diseno");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyArea, orden: areas.length });
    setShowModal(true);
  };

  const openEdit = (area: AreaDiseno) => {
    setEditingId(area.id);
    setForm({
      nombre: area.nombre,
      mockup_url: area.mockup_url || "",
      area_x: area.area_x,
      area_y: area.area_y,
      area_width: area.area_width,
      area_height: area.area_height,
      dpi_recomendado: area.dpi_recomendado,
      max_colores: area.max_colores ?? "",
      orden: area.orden,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        mockup_url: form.mockup_url.trim() || null,
        area_x: Number(form.area_x) || 0,
        area_y: Number(form.area_y) || 0,
        area_width: Number(form.area_width) || 0,
        area_height: Number(form.area_height) || 0,
        dpi_recomendado: Number(form.dpi_recomendado) || 300,
        max_colores: form.max_colores ? Number(form.max_colores) : null,
        orden: Number(form.orden) || 0,
      };

      const res = editingId
        ? await fetch(`/api/admin/productos/${id}/areas-diseno/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/productos/${id}/areas-diseno`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        toast.success(editingId ? "Area actualizada" : "Area creada");
        setShowModal(false);
        fetchAreas();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  const handleDelete = async (areaId: string) => {
    if (!confirm("Eliminar esta area de diseno?")) return;
    try {
      const res = await fetch(`/api/admin/productos/${id}/areas-diseno/${areaId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Area eliminada");
        fetchAreas();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/productos/${id}`}
        className="flex items-center gap-2 text-sm"
        style={{ color: "#64748B" }}
      >
        <ArrowLeft className="size-4" /> Volver al producto
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crosshair className="size-6" style={{ color: "#1B2A6B" }} />
          <h1 className="text-2xl font-extrabold" style={{ color: "#1E293B", letterSpacing: "-0.02em" }}>
            Areas de Personalizacion
          </h1>
        </div>
        <Button onClick={openNew} className="gap-2 bg-[#1B2A6B] hover:bg-[#152259] text-white">
          <Plus className="size-4" />
          Agregar Area
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : areas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Crosshair className="size-12 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-[#64748B] mb-4">Este producto no tiene areas de diseno configuradas</p>
            <Button onClick={openNew} className="gap-2 bg-[#1B2A6B] hover:bg-[#152259] text-white">
              <Plus className="size-4" />
              Agregar primera area
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {areas.map((area) => (
            <Card key={area.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Drag handle */}
                  <div className="flex items-center pt-1">
                    <GripVertical className="size-5 text-[#CBD5E1]" />
                  </div>

                  {/* Mockup thumbnail */}
                  <div className="w-20 h-20 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {area.mockup_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={area.mockup_url}
                        alt={area.nombre}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="size-8 text-[#CBD5E1]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#1E293B]">{area.nombre}</h3>
                      <Badge className="text-[10px] bg-[#F0F7FF] text-[#1B2A6B] border-0">
                        Orden: {area.orden}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#64748B] space-y-0.5">
                      <p>
                        Posicion: X={area.area_x}%, Y={area.area_y}% | Tamano: {area.area_width}% x {area.area_height}%
                      </p>
                      <p>
                        DPI: {area.dpi_recomendado}
                        {area.max_colores && ` | Max colores: ${area.max_colores}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(area)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                      title="Editar"
                    >
                      <Pencil className="size-4 text-[#64748B]" />
                    </button>
                    <button
                      onClick={() => handleDelete(area.id)}
                      className="p-2 rounded-lg hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1E293B]">
                {editingId ? "Editar Area de Diseno" : "Agregar Area de Diseno"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="size-5 text-[#64748B]" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: form fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[#1E293B] block mb-1">Nombre</label>
                  <Input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder='Ej: "Frente", "Espalda"'
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#1E293B] block mb-1">URL de Mockup</label>
                  <Input
                    value={form.mockup_url}
                    onChange={(e) => setForm({ ...form, mockup_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-[#1E293B] block mb-1">X (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={form.area_x}
                      onChange={(e) => setForm({ ...form, area_x: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#1E293B] block mb-1">Y (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={form.area_y}
                      onChange={(e) => setForm({ ...form, area_y: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#1E293B] block mb-1">Ancho (%)</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      step={0.1}
                      value={form.area_width}
                      onChange={(e) => setForm({ ...form, area_width: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#1E293B] block mb-1">Alto (%)</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      step={0.1}
                      value={form.area_height}
                      onChange={(e) => setForm({ ...form, area_height: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-[#1E293B] block mb-1">DPI Recomendado</label>
                    <Input
                      type="number"
                      min={72}
                      value={form.dpi_recomendado}
                      onChange={(e) => setForm({ ...form, dpi_recomendado: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#1E293B] block mb-1">Max Colores</label>
                    <Input
                      type="number"
                      min={1}
                      value={form.max_colores}
                      onChange={(e) => setForm({ ...form, max_colores: e.target.value ? Number(e.target.value) : "" })}
                      placeholder="Sin limite"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#1E293B] block mb-1">Orden</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Right: visual editor */}
              <div>
                <label className="text-sm font-semibold text-[#1E293B] block mb-2">Vista Previa</label>
                <VisualAreaEditor
                  mockupUrl={form.mockup_url}
                  areaX={Number(form.area_x) || 0}
                  areaY={Number(form.area_y) || 0}
                  areaWidth={Number(form.area_width) || 10}
                  areaHeight={Number(form.area_height) || 10}
                  onChange={(vals) =>
                    setForm({
                      ...form,
                      area_x: vals.area_x,
                      area_y: vals.area_y,
                      area_width: vals.area_width,
                      area_height: vals.area_height,
                    })
                  }
                />
                <p className="text-xs text-[#64748B] mt-2">
                  Arrastra para mover el area. Usa la esquina inferior derecha para redimensionar.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#1B2A6B] hover:bg-[#152259] text-white"
              >
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Area"}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Export ---------- */
export default function PersonalizacionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard>
      <PersonalizacionContent params={params} />
    </AuthGuard>
  );
}
