"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Producto, Categoria, Variante } from "@/lib/types";

interface ProductFormProps {
  producto?: Producto;
  isNew?: boolean;
}

export function ProductForm({ producto, isNew }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Form state
  const [nombre, setNombre] = useState(producto?.nombre || "");
  const [slug, setSlug] = useState(producto?.slug || "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion || "");
  const [descripcionCorta, setDescripcionCorta] = useState(producto?.descripcion_corta || "");
  const [precio, setPrecio] = useState(producto?.precio || 0);
  const [precioOferta, setPrecioOferta] = useState(producto?.precio_oferta || 0);
  const [sku, setSku] = useState(producto?.sku || "");
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id || "");
  const [stock, setStock] = useState(producto?.stock || 0);
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo || 0);
  const [pesoGramos, setPesoGramos] = useState(producto?.peso_gramos || 0);
  const [destacado, setDestacado] = useState(producto?.destacado || false);
  const [activo, setActivo] = useState(producto?.activo !== undefined ? producto.activo : true);
  const [variantes, setVariantes] = useState<Variante[]>(producto?.variantes || []);
  const [imagenes, setImagenes] = useState<{ url: string; alt: string; orden: number }[]>(producto?.imagenes || []);
  const [uploading, setUploading] = useState(false);
  const [metaTitle, setMetaTitle] = useState((producto as unknown as Record<string, unknown>)?.meta_title as string || "");
  const [metaDescription, setMetaDescription] = useState((producto as unknown as Record<string, unknown>)?.meta_description as string || "");

  useEffect(() => {
    fetch("/api/categorias").then((r) => r.json()).then(setCategorias);
  }, []);

  useEffect(() => {
    if (isNew && nombre) {
      setSlug(
        nombre
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }, [nombre, isNew]);

  const handleSave = async () => {
    if (!nombre || !precio) {
      toast.error("Nombre y precio son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre, slug, descripcion, descripcion_corta: descripcionCorta,
        precio, precio_oferta: precioOferta || null,
        sku: sku || null, categoria_id: categoriaId || null,
        stock, stock_minimo: stockMinimo, peso_gramos: pesoGramos || null,
        destacado, activo, variantes, imagenes,
        meta_title: metaTitle || null, meta_description: metaDescription || null,
      };

      const url = isNew ? "/api/admin/productos" : `/api/admin/productos/${producto!.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isNew ? "Producto creado" : "Producto guardado");
        if (isNew) {
          const data = await res.json();
          router.push(`/admin/productos/${data.id}`);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/productos/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const { url } = await res.json();
          setImagenes((prev) => [...prev, { url, alt: nombre, orden: prev.length }]);
          toast.success(`Imagen subida: ${file.name}`);
        } else {
          toast.error(`Error subiendo ${file.name}`);
        }
      } catch {
        toast.error(`Error subiendo ${file.name}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== idx));
  };

  const addVariante = () => {
    setVariantes((prev) => [...prev, { nombre: "", opciones: [{ valor: "", precio_extra: 0 }] }]);
  };

  const removeVariante = (idx: number) => {
    setVariantes((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateVarianteName = (idx: number, name: string) => {
    setVariantes((prev) => prev.map((v, i) => i === idx ? { ...v, nombre: name } : v));
  };

  const addOpcion = (varIdx: number) => {
    setVariantes((prev) =>
      prev.map((v, i) => i === varIdx ? { ...v, opciones: [...v.opciones, { valor: "", precio_extra: 0 }] } : v)
    );
  };

  const removeOpcion = (varIdx: number, optIdx: number) => {
    setVariantes((prev) =>
      prev.map((v, i) => i === varIdx ? { ...v, opciones: v.opciones.filter((_, j) => j !== optIdx) } : v)
    );
  };

  const updateOpcion = (varIdx: number, optIdx: number, field: "valor" | "precio_extra", value: string | number) => {
    setVariantes((prev) =>
      prev.map((v, i) =>
        i === varIdx
          ? { ...v, opciones: v.opciones.map((o, j) => j === optIdx ? { ...o, [field]: value } : o) }
          : v
      )
    );
  };

  const tabs = [
    { id: "general", label: "General" },
    { id: "precio", label: "Precio" },
    { id: "imagenes", label: "Imagenes" },
    { id: "inventario", label: "Inventario" },
    { id: "variantes", label: "Variantes" },
    { id: "seo", label: "SEO" },
  ];

  const previewUrl = producto?.categoria
    ? `/productos/${producto.categoria.slug}/${producto.slug}`
    : producto?.slug ? `/productos/${slug}` : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
          {isNew ? "Nuevo Producto" : `Editar: ${producto?.nombre}`}
        </h1>
        <div className="flex gap-2">
          {previewUrl && (
            <Button variant="outline" className="gap-2" onClick={() => window.open(previewUrl, "_blank")}>
              <ExternalLink className="size-4" />
              Vista Previa
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 text-white hover:opacity-90"
            style={{ backgroundColor: "#1B2A6B" }}
          >
            <Save className="size-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-gray-50 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: activeTab === t.id ? "#1B2A6B" : "transparent",
              color: activeTab === t.id ? "#FFFFFF" : "#64748B",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" style={{ color: "#1E293B" }}>Informacion General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Nombre *</label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del producto" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Slug</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="nombre-del-producto" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Categoria</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Sin categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Descripcion Corta</label>
              <Input value={descripcionCorta} onChange={(e) => setDescripcionCorta(e.target.value)} placeholder="Breve descripcion" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Descripcion</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={5}
                placeholder="Descripcion detallada del producto"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} />
                <span className="text-sm">Destacado</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                <span className="text-sm">Activo</span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "precio" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" style={{ color: "#1E293B" }}>Precio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Precio (CLP) *</label>
              <Input type="number" value={precio} onChange={(e) => setPrecio(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Precio Oferta (CLP)</label>
              <Input type="number" value={precioOferta} onChange={(e) => setPrecioOferta(Number(e.target.value))} placeholder="0 = sin oferta" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>SKU</label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Codigo de producto" />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "imagenes" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" style={{ color: "#1E293B" }}>Imagenes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="text-sm"
              />
              {uploading && <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Subiendo...</p>}
            </div>
            {imagenes.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {imagenes.map((img, idx) => (
                  <div key={idx} className="group relative">
                    <div
                      className="aspect-square rounded-lg bg-cover bg-center border"
                      style={{ backgroundImage: `url(${img.url})` }}
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "inventario" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" style={{ color: "#1E293B" }}>Inventario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Stock</label>
              <Input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Stock Minimo</label>
              <Input type="number" value={stockMinimo} onChange={(e) => setStockMinimo(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Peso (gramos)</label>
              <Input type="number" value={pesoGramos} onChange={(e) => setPesoGramos(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "variantes" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base" style={{ color: "#1E293B" }}>
              <span>Variantes</span>
              <Button variant="outline" size="sm" className="gap-1" onClick={addVariante}>
                <Plus className="size-3" /> Agregar variante
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {variantes.length === 0 ? (
              <p className="py-4 text-center text-sm" style={{ color: "#64748B" }}>
                Sin variantes. Agrega variantes como Talla, Color, etc.
              </p>
            ) : (
              variantes.map((v, vIdx) => (
                <div key={vIdx} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Input
                      value={v.nombre}
                      onChange={(e) => updateVarianteName(vIdx, e.target.value)}
                      placeholder="Nombre (ej: Talla)"
                      className="flex-1"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeVariante(vIdx)}>
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {v.opciones.map((o, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <Input
                          value={o.valor}
                          onChange={(e) => updateOpcion(vIdx, oIdx, "valor", e.target.value)}
                          placeholder="Valor (ej: M)"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={o.precio_extra}
                          onChange={(e) => updateOpcion(vIdx, oIdx, "precio_extra", Number(e.target.value))}
                          placeholder="Precio extra"
                          className="w-28"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeOpcion(vIdx, oIdx)}>
                          <Trash2 className="size-3 text-red-400" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => addOpcion(vIdx)}>
                      <Plus className="size-3" /> Opcion
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "seo" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" style={{ color: "#1E293B" }}>SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Meta Title</label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder={`${nombre} | PrintUp`} />
              <p className="mt-1 text-xs" style={{ color: "#64748B" }}>{metaTitle.length}/60 caracteres</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "#1E293B" }}>Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                placeholder={descripcionCorta || "Descripcion para motores de busqueda"}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs" style={{ color: "#64748B" }}>{metaDescription.length}/160 caracteres</p>
            </div>
            <div className="rounded-lg border p-4" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Vista previa en Google</p>
              <p className="mt-2 text-base font-medium" style={{ color: "#1B2A6B" }}>
                {metaTitle || `${nombre} | PrintUp`}
              </p>
              <p className="text-sm text-green-700">printup.cl/productos/...</p>
              <p className="text-sm" style={{ color: "#64748B" }}>
                {metaDescription || descripcionCorta || "Sin descripcion"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
