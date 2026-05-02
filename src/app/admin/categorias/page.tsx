"use client";

import { useEffect, useState } from "react";
import { FolderTree, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";
import type { Categoria } from "@/lib/types";

function CategoriasContent() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const fetchData = async () => {
    setLoading(true);
    const [catRes, prodRes] = await Promise.all([
      fetch("/api/categorias"),
      fetch("/api/productos?limit=1000"),
    ]);
    const cats = await catRes.json();
    const prods = await prodRes.json();
    setCategorias(cats);

    // Count products per category
    const counts: Record<string, number> = {};
    for (const p of prods.productos || []) {
      if (p.categoria_id) {
        counts[p.categoria_id] = (counts[p.categoria_id] || 0) + 1;
      }
    }
    setProductCounts(counts);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const startEdit = (cat: Categoria) => {
    setEditingId(cat.id);
    setEditName(cat.nombre);
    setEditDesc(cat.descripcion || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/admin/categorias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: editName, descripcion: editDesc }),
    });
    if (res.ok) {
      toast.success("Categoria actualizada");
      cancelEdit();
      fetchData();
    } else {
      toast.error("Error al actualizar");
    }
  };

  const createCategoria = async () => {
    if (!newName) { toast.error("Nombre es obligatorio"); return; }
    const res = await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: newName, descripcion: newDesc }),
    });
    if (res.ok) {
      toast.success("Categoria creada");
      setShowNew(false);
      setNewName("");
      setNewDesc("");
      fetchData();
    } else {
      toast.error("Error al crear");
    }
  };

  const deleteCategoria = async (id: string) => {
    if (!confirm("Desactivar esta categoria?")) return;
    const res = await fetch(`/api/admin/categorias/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Categoria desactivada");
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error || "Error al eliminar");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Categorias</h1>
          <p className="text-sm" style={{ color: "#64748B" }}>Gestiona las categorias de productos</p>
        </div>
        <Button
          onClick={() => setShowNew(!showNew)}
          style={{ backgroundColor: "#1B2A6B" }}
          className="gap-2 text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Nueva Categoria
        </Button>
      </div>

      {/* New category form */}
      {showNew && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de la categoria" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Descripcion</label>
                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descripcion (opcional)" />
              </div>
              <div className="flex gap-2">
                <Button onClick={createCategoria} style={{ backgroundColor: "#1B2A6B" }} className="text-white hover:opacity-90">
                  Crear
                </Button>
                <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <FolderTree className="size-5" />
            Categorias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : categorias.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>No hay categorias.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                >
                  {editingId === cat.id ? (
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                      <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="flex-1" placeholder="Descripcion" />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => saveEdit(cat.id)}>
                          <Check className="size-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>
                          <X className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div
                          className="size-10 shrink-0 rounded-lg bg-cover bg-center"
                          style={{
                            backgroundImage: cat.imagen_url ? `url(${cat.imagen_url})` : undefined,
                            backgroundColor: cat.imagen_url ? undefined : "#F1F5F9",
                          }}
                        />
                        <div>
                          <div className="font-medium" style={{ color: "#1E293B" }}>{cat.nombre}</div>
                          <div className="text-xs" style={{ color: "#64748B" }}>
                            {productCounts[cat.id] || 0} productos · /{cat.slug}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="mr-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: cat.activa ? "#10B98120" : "#EF444420",
                            color: cat.activa ? "#10B981" : "#EF4444",
                          }}
                        >
                          {cat.activa ? "Activa" : "Inactiva"}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(cat)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteCategoria(cat.id)}>
                          <Trash2 className="size-4 text-red-400" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CategoriasPage() {
  return (
    <AuthGuard>
      <CategoriasContent />
    </AuthGuard>
  );
}
