"use client";

import { useEffect, useState, useCallback } from "react";
import { Image as ImageIcon, Plus, Pencil, Trash2, X, Star, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

/* ─── Types ─── */

interface Trabajo {
  id: string;
  titulo: string;
  descripcion: string | null;
  cliente_nombre: string | null;
  categoria: string | null;
  imagenes: string[];
  destacado: boolean;
  activo: boolean;
  orden: number;
  created_at: string;
}

interface ClienteDestacado {
  id: string;
  nombre: string;
  logo_url: string | null;
  url_web: string | null;
  orden: number;
  created_at: string;
}

const emptyTrabajo = {
  titulo: "",
  descripcion: "",
  cliente_nombre: "",
  categoria: "",
  imagenes: [] as string[],
  destacado: false,
  activo: true,
  orden: 0,
};

const emptyCliente = {
  nombre: "",
  logo_url: "",
  url_web: "",
  orden: 0,
};

type TabKey = "trabajos" | "clientes";

/* ─── Main Content ─── */

function PortafolioContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("trabajos");

  // Trabajos state
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loadingTrabajos, setLoadingTrabajos] = useState(true);
  const [showTrabajoModal, setShowTrabajoModal] = useState(false);
  const [editingTrabajoId, setEditingTrabajoId] = useState<string | null>(null);
  const [trabajoForm, setTrabajoForm] = useState(emptyTrabajo);
  const [savingTrabajo, setSavingTrabajo] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Clientes state
  const [clientes, setClientes] = useState<ClienteDestacado[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null);
  const [clienteForm, setClienteForm] = useState(emptyCliente);
  const [savingCliente, setSavingCliente] = useState(false);

  /* ─── Fetch Trabajos ─── */
  const fetchTrabajos = useCallback(async () => {
    setLoadingTrabajos(true);
    try {
      const res = await fetch("/api/admin/portafolio", { credentials: "include" });
      const data = await res.json();
      setTrabajos(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Error al cargar trabajos");
    }
    setLoadingTrabajos(false);
  }, []);

  /* ─── Fetch Clientes ─── */
  const fetchClientes = useCallback(async () => {
    setLoadingClientes(true);
    try {
      const res = await fetch("/api/admin/portafolio/clientes-destacados", { credentials: "include" });
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Error al cargar clientes");
    }
    setLoadingClientes(false);
  }, []);

  useEffect(() => {
    fetchTrabajos();
    fetchClientes();
  }, [fetchTrabajos, fetchClientes]);

  /* ─── Trabajo CRUD ─── */
  const openNewTrabajo = () => {
    setEditingTrabajoId(null);
    setTrabajoForm(emptyTrabajo);
    setNewImageUrl("");
    setShowTrabajoModal(true);
  };

  const openEditTrabajo = (t: Trabajo) => {
    setEditingTrabajoId(t.id);
    setTrabajoForm({
      titulo: t.titulo,
      descripcion: t.descripcion || "",
      cliente_nombre: t.cliente_nombre || "",
      categoria: t.categoria || "",
      imagenes: t.imagenes || [],
      destacado: t.destacado,
      activo: t.activo,
      orden: t.orden,
    });
    setNewImageUrl("");
    setShowTrabajoModal(true);
  };

  const handleSaveTrabajo = async () => {
    if (!trabajoForm.titulo.trim()) {
      toast.error("El titulo es obligatorio");
      return;
    }
    setSavingTrabajo(true);
    try {
      const body = {
        ...(editingTrabajoId ? { id: editingTrabajoId } : {}),
        titulo: trabajoForm.titulo.trim(),
        descripcion: trabajoForm.descripcion || null,
        cliente_nombre: trabajoForm.cliente_nombre || null,
        categoria: trabajoForm.categoria || null,
        imagenes: trabajoForm.imagenes,
        destacado: trabajoForm.destacado,
        activo: trabajoForm.activo,
        orden: trabajoForm.orden,
      };

      const method = editingTrabajoId ? "PUT" : "POST";
      const res = await fetch("/api/admin/portafolio", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingTrabajoId ? "Trabajo actualizado" : "Trabajo creado");
        setShowTrabajoModal(false);
        fetchTrabajos();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSavingTrabajo(false);
  };

  const handleDeleteTrabajo = async (t: Trabajo) => {
    if (!confirm(`Eliminar el trabajo "${t.titulo}"?`)) return;
    try {
      const res = await fetch(`/api/admin/portafolio?id=${t.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Trabajo eliminado");
        fetchTrabajos();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setTrabajoForm({ ...trabajoForm, imagenes: [...trabajoForm.imagenes, url] });
    setNewImageUrl("");
  };

  const removeImageUrl = (index: number) => {
    setTrabajoForm({
      ...trabajoForm,
      imagenes: trabajoForm.imagenes.filter((_, i) => i !== index),
    });
  };

  /* ─── Cliente CRUD ─── */
  const openNewCliente = () => {
    setEditingClienteId(null);
    setClienteForm(emptyCliente);
    setShowClienteModal(true);
  };

  const openEditCliente = (c: ClienteDestacado) => {
    setEditingClienteId(c.id);
    setClienteForm({
      nombre: c.nombre,
      logo_url: c.logo_url || "",
      url_web: c.url_web || "",
      orden: c.orden,
    });
    setShowClienteModal(true);
  };

  const handleSaveCliente = async () => {
    if (!clienteForm.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSavingCliente(true);
    try {
      const body = {
        ...(editingClienteId ? { id: editingClienteId } : {}),
        nombre: clienteForm.nombre.trim(),
        logo_url: clienteForm.logo_url || null,
        url_web: clienteForm.url_web || null,
        orden: clienteForm.orden,
      };

      const method = editingClienteId ? "PUT" : "POST";
      const res = await fetch("/api/admin/portafolio/clientes-destacados", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingClienteId ? "Cliente actualizado" : "Cliente creado");
        setShowClienteModal(false);
        fetchClientes();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSavingCliente(false);
  };

  const handleDeleteCliente = async (c: ClienteDestacado) => {
    if (!confirm(`Eliminar el cliente "${c.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/admin/portafolio/clientes-destacados?id=${c.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Cliente eliminado");
        fetchClientes();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  /* ─── Tabs ─── */
  const tabs: { key: TabKey; label: string }[] = [
    { key: "trabajos", label: "Trabajos" },
    { key: "clientes", label: "Clientes Destacados" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
            Portafolio
          </h1>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Gestiona los trabajos y clientes destacados
          </p>
        </div>
        {activeTab === "trabajos" ? (
          <Button
            onClick={openNewTrabajo}
            style={{ backgroundColor: "#1B2A6B" }}
            className="gap-2 text-white hover:opacity-90"
          >
            <Plus className="size-4" />
            Nuevo Trabajo
          </Button>
        ) : (
          <Button
            onClick={openNewCliente}
            style={{ backgroundColor: "#1B2A6B" }}
            className="gap-2 text-white hover:opacity-90"
          >
            <Plus className="size-4" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            style={
              activeTab === tab.key
                ? { backgroundColor: "#1B2A6B", color: "#FFFFFF" }
                : undefined
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* ─── Trabajos Tab ─── */}
      {activeTab === "trabajos" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
              <ImageIcon className="size-5" />
              Trabajos del Portafolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrabajos ? (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : trabajos.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>
                No hay trabajos en el portafolio.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ color: "#64748B" }}>
                      <th className="pb-3 text-left font-medium">Imagen</th>
                      <th className="pb-3 text-left font-medium">Titulo</th>
                      <th className="hidden pb-3 text-left font-medium md:table-cell">Cliente</th>
                      <th className="hidden pb-3 text-left font-medium sm:table-cell">Categoria</th>
                      <th className="pb-3 text-center font-medium">Destacado</th>
                      <th className="hidden pb-3 text-center font-medium sm:table-cell">Orden</th>
                      <th className="pb-3 text-center font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trabajos.map((t) => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3">
                          {t.imagenes && t.imagenes.length > 0 ? (
                            <img
                              src={t.imagenes[0]}
                              alt={t.titulo}
                              className="size-10 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100">
                              <ImageIcon className="size-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 font-medium" style={{ color: "#1E293B" }}>
                          {t.titulo}
                          {!t.activo && (
                            <span className="ml-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="hidden py-3 md:table-cell" style={{ color: "#64748B" }}>
                          {t.cliente_nombre || "—"}
                        </td>
                        <td className="hidden py-3 sm:table-cell" style={{ color: "#64748B" }}>
                          {t.categoria || "—"}
                        </td>
                        <td className="py-3 text-center">
                          {t.destacado ? (
                            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                              <Star className="mr-1 size-3" />
                              Destacado
                            </span>
                          ) : (
                            <span style={{ color: "#64748B" }}>—</span>
                          )}
                        </td>
                        <td className="hidden py-3 text-center sm:table-cell" style={{ color: "#64748B" }}>
                          {t.orden}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" title="Editar" onClick={() => openEditTrabajo(t)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Eliminar"
                              onClick={() => handleDeleteTrabajo(t)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Clientes Destacados Tab ─── */}
      {activeTab === "clientes" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
              <Users className="size-5" />
              Clientes Destacados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingClientes ? (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : clientes.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>
                No hay clientes destacados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ color: "#64748B" }}>
                      <th className="pb-3 text-left font-medium">Logo</th>
                      <th className="pb-3 text-left font-medium">Nombre</th>
                      <th className="hidden pb-3 text-left font-medium sm:table-cell">URL Web</th>
                      <th className="pb-3 text-center font-medium">Orden</th>
                      <th className="pb-3 text-center font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3">
                          {c.logo_url ? (
                            <img
                              src={c.logo_url}
                              alt={c.nombre}
                              className="h-10 w-auto max-w-[80px] rounded object-contain border border-gray-200"
                            />
                          ) : (
                            <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100">
                              <Users className="size-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 font-medium" style={{ color: "#1E293B" }}>
                          {c.nombre}
                        </td>
                        <td className="hidden py-3 sm:table-cell" style={{ color: "#64748B" }}>
                          {c.url_web ? (
                            <a
                              href={c.url_web}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                              style={{ color: "#00B4D8" }}
                            >
                              {c.url_web}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 text-center" style={{ color: "#64748B" }}>
                          {c.orden}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" title="Editar" onClick={() => openEditCliente(c)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Eliminar"
                              onClick={() => handleDeleteCliente(c)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Modal Trabajo ─── */}
      {showTrabajoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowTrabajoModal(false)} />
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                {editingTrabajoId ? "Editar Trabajo" : "Nuevo Trabajo"}
              </h2>
              <button onClick={() => setShowTrabajoModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="size-5" style={{ color: "#64748B" }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Titulo */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Titulo
                </label>
                <Input
                  value={trabajoForm.titulo}
                  onChange={(e) => setTrabajoForm({ ...trabajoForm, titulo: e.target.value })}
                  placeholder="Nombre del trabajo"
                />
              </div>

              {/* Descripcion */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Descripcion
                </label>
                <textarea
                  value={trabajoForm.descripcion}
                  onChange={(e) => setTrabajoForm({ ...trabajoForm, descripcion: e.target.value })}
                  placeholder="Describe el trabajo realizado"
                  rows={3}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              {/* Cliente + Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                    Cliente
                  </label>
                  <Input
                    value={trabajoForm.cliente_nombre}
                    onChange={(e) => setTrabajoForm({ ...trabajoForm, cliente_nombre: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                    Categoria
                  </label>
                  <Input
                    value={trabajoForm.categoria}
                    onChange={(e) => setTrabajoForm({ ...trabajoForm, categoria: e.target.value })}
                    placeholder="Ej: Imprenta, Rotulado"
                  />
                </div>
              </div>

              {/* Imagenes */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Imagenes
                </label>
                {trabajoForm.imagenes.length > 0 && (
                  <div className="mb-2 flex flex-col gap-2">
                    {trabajoForm.imagenes.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                        <img src={url} alt={`Imagen ${i + 1}`} className="size-10 rounded object-cover" />
                        <span className="flex-1 truncate text-xs" style={{ color: "#64748B" }}>
                          {url}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImageUrl(i)}
                          className="rounded p-1 hover:bg-gray-100"
                        >
                          <X className="size-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://... URL de imagen"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImageUrl();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addImageUrl}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Orden */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Orden
                </label>
                <Input
                  type="number"
                  min={0}
                  value={trabajoForm.orden}
                  onChange={(e) => setTrabajoForm({ ...trabajoForm, orden: Number(e.target.value) })}
                />
              </div>

              {/* Destacado + Activo */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold" style={{ color: "#1E293B" }}>
                    Destacado
                  </label>
                  <input
                    type="checkbox"
                    checked={trabajoForm.destacado}
                    onChange={(e) => setTrabajoForm({ ...trabajoForm, destacado: e.target.checked })}
                    className="size-4 rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold" style={{ color: "#1E293B" }}>
                    Activo
                  </label>
                  <button
                    type="button"
                    onClick={() => setTrabajoForm({ ...trabajoForm, activo: !trabajoForm.activo })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      trabajoForm.activo ? "bg-[#1B2A6B]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                        trabajoForm.activo ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setShowTrabajoModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTrabajo}
                disabled={savingTrabajo}
                style={{ backgroundColor: "#1B2A6B" }}
                className="text-white hover:opacity-90"
              >
                {savingTrabajo ? "Guardando..." : editingTrabajoId ? "Actualizar" : "Crear Trabajo"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Cliente ─── */}
      {showClienteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowClienteModal(false)} />
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                {editingClienteId ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button onClick={() => setShowClienteModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="size-5" style={{ color: "#64748B" }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Nombre
                </label>
                <Input
                  value={clienteForm.nombre}
                  onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Logo URL
                </label>
                <Input
                  value={clienteForm.logo_url}
                  onChange={(e) => setClienteForm({ ...clienteForm, logo_url: e.target.value })}
                  placeholder="https://... URL del logo"
                />
                {clienteForm.logo_url && (
                  <div className="mt-2">
                    <img
                      src={clienteForm.logo_url}
                      alt="Preview"
                      className="h-12 w-auto max-w-[120px] rounded border border-gray-200 object-contain"
                    />
                  </div>
                )}
              </div>

              {/* URL Web */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  URL Web
                </label>
                <Input
                  value={clienteForm.url_web}
                  onChange={(e) => setClienteForm({ ...clienteForm, url_web: e.target.value })}
                  placeholder="https://www.cliente.com"
                />
              </div>

              {/* Orden */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Orden
                </label>
                <Input
                  type="number"
                  min={0}
                  value={clienteForm.orden}
                  onChange={(e) => setClienteForm({ ...clienteForm, orden: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setShowClienteModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveCliente}
                disabled={savingCliente}
                style={{ backgroundColor: "#1B2A6B" }}
                className="text-white hover:opacity-90"
              >
                {savingCliente ? "Guardando..." : editingClienteId ? "Actualizar" : "Crear Cliente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortafolioPage() {
  return (
    <AuthGuard>
      <PortafolioContent />
    </AuthGuard>
  );
}
