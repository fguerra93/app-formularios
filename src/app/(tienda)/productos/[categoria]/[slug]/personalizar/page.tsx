"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Type,
  ImagePlus,
  Shapes,
  Layers,
  ZoomIn,
  ZoomOut,
  Eye,
  Save,
  ShoppingCart,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  EyeOff,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Circle,
  Square,
  Star,
  Heart,
  X,
  Upload,
  Palette,
  RotateCw,
  Menu,
} from "lucide-react";

/* ---------- Types ---------- */
interface DesignElement {
  id: string;
  type: "text" | "image" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  // Text specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  // Image specific
  imageUrl?: string;
  // Shape specific
  shapeType?: "circle" | "rectangle" | "star" | "heart";
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

interface AreaDiseno {
  id: string;
  nombre: string;
  mockup_url: string | null;
  area_x: number;
  area_y: number;
  area_width: number;
  area_height: number;
  dpi_recomendado: number;
}

interface Clipart {
  id: string;
  nombre: string;
  categoria: string | null;
  url: string;
}

interface Fuente {
  id: string;
  nombre: string;
  familia: string;
  url: string | null;
}

interface Producto {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
  precio_oferta: number | null;
  imagenes: { url: string; alt: string }[];
}

const DEFAULT_AREA: AreaDiseno = {
  id: "mock-1",
  nombre: "Frente",
  mockup_url: "",
  area_x: 25,
  area_y: 15,
  area_width: 50,
  area_height: 70,
  dpi_recomendado: 300,
};

let elementCounter = 0;
function nextId() {
  return `el-${++elementCounter}-${Date.now()}`;
}

/* ---------- Shape SVGs ---------- */
function ShapeSVG({
  type,
  fill,
  stroke,
  strokeWidth,
}: {
  type: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
}) {
  const sw = strokeWidth;
  switch (type) {
    case "circle":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r={48 - sw} fill={fill} stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case "rectangle":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect
            x={sw / 2}
            y={sw / 2}
            width={100 - sw}
            height={100 - sw}
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 63,35 95,38 72,60 78,92 50,77 22,92 28,60 5,38 37,35"
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M50,88 C25,65 5,50 5,30 C5,15 15,5 30,5 C40,5 48,12 50,18 C52,12 60,5 70,5 C85,5 95,15 95,30 C95,50 75,65 50,88Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    default:
      return null;
  }
}

/* ---------- Main Page ---------- */
export default function PersonalizarPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const categoriaSlug = params.categoria as string;
  const { addItem } = useCart();

  // Data loading
  const [producto, setProducto] = useState<Producto | null>(null);
  const [areas, setAreas] = useState<AreaDiseno[]>([]);
  const [cliparts, setCliparts] = useState<Clipart[]>([]);
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [loading, setLoading] = useState(true);
  const [noAreas, setNoAreas] = useState(false);

  // Designer state
  const [activeAreaIdx, setActiveAreaIdx] = useState(0);
  const [elements, setElements] = useState<Record<string, DesignElement[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tools panel state
  const [activeTool, setActiveTool] = useState<"text" | "image" | "clipart" | "shapes" | "layers">("text");
  const [clipartFilter, setClipartFilter] = useState("");
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [showMobileProps, setShowMobileProps] = useState(false);

  // Drag state
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, elX: 0, elY: 0, elW: 0, elH: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const designAreaRef = useRef<HTMLDivElement>(null);

  const activeArea = areas[activeAreaIdx] || DEFAULT_AREA;
  const areaKey = activeArea.id;
  const currentElements = elements[areaKey] || [];

  const selectedElement = currentElements.find((e) => e.id === selectedId) || null;

  // Load Google Fonts
  useEffect(() => {
    if (fuentes.length === 0) return;
    const families = fuentes.map((f) => f.familia.replace(/\s+/g, "+")).join("&family=");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [fuentes]);

  // Fetch all data
  useEffect(() => {
    setLoading(true);
    const promises = [
      fetch(`/api/productos/${slug}`).then((r) => r.json()),
      fetch(`/api/productos/${slug}/areas-diseno`).then((r) => r.json()),
      fetch("/api/designer/clipart").then((r) => r.json()),
      fetch("/api/designer/fuentes").then((r) => r.json()),
    ];

    Promise.all(promises)
      .then(([prodData, areasData, clipartData, fuentesData]) => {
        if (prodData && !prodData.error) {
          setProducto(prodData);
          document.title = `Personalizar ${prodData.nombre} | PrintUp`;
        }

        const fetchedAreas: AreaDiseno[] = Array.isArray(areasData) ? areasData : [];
        if (fetchedAreas.length === 0) {
          setNoAreas(true);
          setAreas([DEFAULT_AREA]);
          setElements({ [DEFAULT_AREA.id]: [] });
        } else {
          setAreas(fetchedAreas);
          const init: Record<string, DesignElement[]> = {};
          fetchedAreas.forEach((a) => { init[a.id] = []; });
          setElements(init);
        }

        setCliparts(Array.isArray(clipartData) ? clipartData : []);
        setFuentes(Array.isArray(fuentesData) ? fuentesData : []);
      })
      .catch(() => {
        toast.error("Error al cargar datos del producto");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Helper: update elements for current area
  const updateElements = useCallback(
    (updater: (prev: DesignElement[]) => DesignElement[]) => {
      setElements((prev) => ({
        ...prev,
        [areaKey]: updater(prev[areaKey] || []),
      }));
    },
    [areaKey]
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<DesignElement>) => {
      updateElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...patch } : el))
      );
    },
    [updateElements]
  );

  // Add elements
  const addTextElement = () => {
    const id = nextId();
    const el: DesignElement = {
      id,
      type: "text",
      x: 20,
      y: 30,
      width: 60,
      height: 15,
      rotation: 0,
      opacity: 1,
      visible: true,
      text: "Tu texto aqui",
      fontFamily: fuentes[0]?.familia || "Arial",
      fontSize: 24,
      fontColor: "#1E293B",
      bold: false,
      italic: false,
      textAlign: "center",
    };
    updateElements((prev) => [...prev, el]);
    setSelectedId(id);
  };

  const addImageElement = (url: string) => {
    const id = nextId();
    const el: DesignElement = {
      id,
      type: "image",
      x: 20,
      y: 20,
      width: 40,
      height: 40,
      rotation: 0,
      opacity: 1,
      visible: true,
      imageUrl: url,
    };
    updateElements((prev) => [...prev, el]);
    setSelectedId(id);
  };

  const addShapeElement = (shapeType: "circle" | "rectangle" | "star" | "heart") => {
    const id = nextId();
    const el: DesignElement = {
      id,
      type: "shape",
      x: 30,
      y: 30,
      width: 25,
      height: 25,
      rotation: 0,
      opacity: 1,
      visible: true,
      shapeType,
      fillColor: "#00B4D8",
      strokeColor: "#1B2A6B",
      strokeWidth: 2,
    };
    updateElements((prev) => [...prev, el]);
    setSelectedId(id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!valid.includes(file.type)) {
      toast.error("Solo se permiten imagenes PNG, JPG, SVG o WebP");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      addImageElement(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deleteElement = (id: string) => {
    updateElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const el = currentElements.find((e) => e.id === id);
    if (!el) return;
    const newId = nextId();
    const dupe = { ...el, id: newId, x: el.x + 5, y: el.y + 5 };
    updateElements((prev) => [...prev, dupe]);
    setSelectedId(newId);
  };

  const moveLayer = (id: string, dir: "up" | "down") => {
    updateElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const targetIdx = dir === "up" ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= newArr.length) return prev;
      [newArr[idx], newArr[targetIdx]] = [newArr[targetIdx], newArr[idx]];
      return newArr;
    });
  };

  // Drag & Resize handlers
  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(elementId);
    const el = currentElements.find((e2) => e2.id === elementId);
    if (!el) return;
    setDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y,
      elW: el.width,
      elH: el.height,
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(elementId);
    const el = currentElements.find((e2) => e2.id === elementId);
    if (!el) return;
    setResizing(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y,
      elW: el.width,
      elH: el.height,
    };
  };

  useEffect(() => {
    if (!dragging && !resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const area = designAreaRef.current;
      if (!area || !selectedId) return;
      const rect = area.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.current.mouseY) / rect.height) * 100;

      if (dragging) {
        const newX = Math.max(0, Math.min(100 - dragStart.current.elW, dragStart.current.elX + dx));
        const newY = Math.max(0, Math.min(100 - dragStart.current.elH, dragStart.current.elY + dy));
        updateElement(selectedId, {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        });
      }

      if (resizing) {
        const newW = Math.max(5, Math.min(100 - dragStart.current.elX, dragStart.current.elW + dx));
        const newH = Math.max(5, Math.min(100 - dragStart.current.elY, dragStart.current.elH + dy));
        updateElement(selectedId, {
          width: Math.round(newW * 10) / 10,
          height: Math.round(newH * 10) / 10,
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      setResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, selectedId, updateElement]);

  // Save design
  const handleSave = async () => {
    if (!producto) return;
    setSaving(true);
    try {
      const res = await fetch("/api/designer/disenos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: producto.id,
          nombre: `Diseno - ${producto.nombre}`,
          diseno_json: { areas: elements },
        }),
      });
      if (res.ok) {
        toast.success("Diseno guardado exitosamente");
      } else {
        toast.error("Error al guardar el diseno");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!producto) return;
    setSaving(true);
    try {
      const res = await fetch("/api/designer/disenos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: producto.id,
          nombre: `Diseno - ${producto.nombre}`,
          diseno_json: { areas: elements },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const price = producto.precio_oferta !== null && producto.precio_oferta < producto.precio
          ? producto.precio_oferta
          : producto.precio;
        addItem({
          producto_id: producto.id,
          nombre: producto.nombre,
          precio: price,
          imagen: producto.imagenes?.[0]?.url || "",
          slug: producto.slug,
          categoria_slug: categoriaSlug,
          variante: { diseno_id: data.id },
          precio_extra: 0,
        });
        toast.success("Diseno guardado y agregado al carrito");
        router.push(`/productos/${categoriaSlug}/${slug}`);
      } else {
        toast.error("Error al guardar el diseno");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  // Clipart categories
  const clipartCategories = [...new Set(cliparts.map((c) => c.categoria).filter(Boolean))] as string[];
  const filteredClipart = clipartFilter
    ? cliparts.filter((c) => c.categoria === clipartFilter)
    : cliparts;

  // Loading
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr_18rem] gap-4">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="aspect-[3/4] rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  // No product
  if (!producto) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-4">Producto no encontrado</h1>
        <Button
          nativeButton={false}
          render={<Link href="/productos" />}
        >
          Ver todos los productos
        </Button>
      </div>
    );
  }

  // No design areas configured (and not using mock)
  if (noAreas) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Palette className="size-16 mx-auto mb-4 text-[#CBD5E1]" />
        <h1 className="text-2xl font-bold text-[#1E293B] mb-2">
          Este producto no tiene opciones de personalizacion configuradas
        </h1>
        <p className="text-[#64748B] mb-6">
          Contactanos si deseas personalizar este producto.
        </p>
        <Button
          nativeButton={false}
          render={<Link href={`/productos/${categoriaSlug}/${slug}`} />}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Volver al producto
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/productos/${categoriaSlug}/${slug}`}
            className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1E293B]"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
          <div className="h-5 w-px bg-[#E2E8F0]" />
          <h1 className="text-sm font-semibold text-[#1E293B] truncate">
            Personalizar: {producto.nombre}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile toggle buttons */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => { setShowMobileTools(!showMobileTools); setShowMobileProps(false); }}
          >
            <Menu className="size-5 text-[#64748B]" />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="gap-1.5 text-xs"
          >
            <Eye className="size-3.5" />
            <span className="hidden sm:inline">Vista Previa</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 text-xs"
          >
            <Save className="size-3.5" />
            <span className="hidden sm:inline">{saving ? "..." : "Guardar"}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={saving}
            className="gap-1.5 text-xs bg-[#1B2A6B] hover:bg-[#152259] text-white"
          >
            <ShoppingCart className="size-3.5" />
            <span className="hidden sm:inline">Agregar al Carrito</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Tools Panel */}
        <div
          className={`${
            showMobileTools ? "fixed inset-0 z-40 bg-black/30 lg:bg-transparent lg:relative lg:inset-auto" : "hidden lg:block"
          }`}
          onClick={() => setShowMobileTools(false)}
        >
          <div
            className={`w-64 h-full bg-white border-r border-[#E2E8F0] overflow-y-auto flex-shrink-0 ${
              showMobileTools ? "fixed left-0 top-0 z-50 lg:relative" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tool tabs */}
            <div className="flex border-b border-[#E2E8F0]">
              {(
                [
                  { key: "text", icon: Type, label: "Texto" },
                  { key: "image", icon: ImagePlus, label: "Imagen" },
                  { key: "clipart", icon: Palette, label: "Clipart" },
                  { key: "shapes", icon: Shapes, label: "Formas" },
                  { key: "layers", icon: Layers, label: "Capas" },
                ] as const
              ).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTool(key)}
                  className={`flex-1 p-2.5 flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                    activeTool === key
                      ? "text-[#1B2A6B] border-b-2 border-[#1B2A6B] bg-[#F0F7FF]"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`}
                  title={label}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Text tool */}
              {activeTool === "text" && (
                <div className="space-y-3">
                  <Button
                    onClick={addTextElement}
                    className="w-full gap-2 bg-[#1B2A6B] hover:bg-[#152259] text-white"
                  >
                    <Type className="size-4" />
                    Agregar Texto
                  </Button>
                  <p className="text-xs text-[#64748B]">
                    Haz clic para agregar un texto editable a tu diseno.
                  </p>
                </div>
              )}

              {/* Image upload */}
              {activeTool === "image" && (
                <div className="space-y-3">
                  <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-[#E2E8F0] rounded-xl cursor-pointer hover:border-[#00B4D8] hover:bg-[#F0FDFF] transition-colors">
                    <Upload className="size-8 text-[#00B4D8]" />
                    <span className="text-sm font-medium text-[#1E293B]">Subir Imagen</span>
                    <span className="text-xs text-[#64748B]">PNG, JPG, SVG</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Clipart */}
              {activeTool === "clipart" && (
                <div className="space-y-3">
                  <select
                    value={clipartFilter}
                    onChange={(e) => setClipartFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm"
                  >
                    <option value="">Todas las categorias</option>
                    {clipartCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {filteredClipart.length === 0 ? (
                    <p className="text-xs text-[#64748B] text-center py-4">
                      No hay clipart disponible
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                      {filteredClipart.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addImageElement(item.url)}
                          className="aspect-square p-2 border border-[#E2E8F0] rounded-lg hover:border-[#00B4D8] hover:bg-[#F0FDFF] transition-colors"
                          title={item.nombre}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={item.nombre}
                            className="w-full h-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Shapes */}
              {activeTool === "shapes" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#1E293B]">Formas</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { type: "circle", icon: Circle, label: "Circulo" },
                        { type: "rectangle", icon: Square, label: "Rectangulo" },
                        { type: "star", icon: Star, label: "Estrella" },
                        { type: "heart", icon: Heart, label: "Corazon" },
                      ] as const
                    ).map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        onClick={() => addShapeElement(type)}
                        className="flex flex-col items-center gap-1.5 p-3 border border-[#E2E8F0] rounded-lg hover:border-[#00B4D8] hover:bg-[#F0FDFF] transition-colors"
                      >
                        <Icon className="size-6 text-[#1B2A6B]" />
                        <span className="text-xs text-[#64748B]">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Layers */}
              {activeTool === "layers" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#1E293B]">Capas</p>
                  {currentElements.length === 0 ? (
                    <p className="text-xs text-[#64748B] text-center py-4">
                      Sin elementos. Agrega texto, imagenes o formas.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {[...currentElements].reverse().map((el) => (
                        <div
                          key={el.id}
                          onClick={() => setSelectedId(el.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            selectedId === el.id
                              ? "bg-[#1B2A6B] text-white"
                              : "bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#1E293B]"
                          }`}
                        >
                          {el.type === "text" && <Type className="size-3.5 flex-shrink-0" />}
                          {el.type === "image" && <ImagePlus className="size-3.5 flex-shrink-0" />}
                          {el.type === "shape" && <Shapes className="size-3.5 flex-shrink-0" />}
                          <span className="flex-1 truncate">
                            {el.type === "text"
                              ? el.text || "Texto"
                              : el.type === "shape"
                                ? el.shapeType || "Forma"
                                : "Imagen"}
                          </span>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }}
                            className="p-0.5 rounded hover:bg-white/20"
                          >
                            {el.visible ? (
                              <Eye className="size-3" />
                            ) : (
                              <EyeOff className="size-3" />
                            )}
                          </button>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); moveLayer(el.id, "up"); }}
                            className="p-0.5 rounded hover:bg-white/20"
                          >
                            <ChevronUp className="size-3" />
                          </button>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); moveLayer(el.id, "down"); }}
                            className="p-0.5 rounded hover:bg-white/20"
                          >
                            <ChevronDown className="size-3" />
                          </button>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); deleteElement(el.id); }}
                            className="p-0.5 rounded hover:bg-red-400/40"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Area tabs + zoom */}
          <div className="flex items-center justify-between px-4 py-2 bg-white/80 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-1">
              {areas.map((area, idx) => (
                <button
                  key={area.id}
                  onClick={() => {
                    setActiveAreaIdx(idx);
                    setSelectedId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    idx === activeAreaIdx
                      ? "bg-[#1B2A6B] text-white"
                      : "text-[#64748B] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {area.nombre}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <ZoomOut className="size-4 text-[#64748B]" />
              </button>
              <span className="text-xs text-[#64748B] w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <ZoomIn className="size-4 text-[#64748B]" />
              </button>
            </div>
          </div>

          {/* Canvas area */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4"
            onClick={() => setSelectedId(null)}
          >
            <div
              ref={canvasRef}
              className="relative bg-white rounded-xl shadow-lg overflow-hidden"
              style={{
                width: `${400 * zoom}px`,
                height: `${533 * zoom}px`,
                maxWidth: "100%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mockup image */}
              {activeArea.mockup_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeArea.mockup_url}
                  alt={activeArea.nombre}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}

              {/* Design area overlay */}
              <div
                ref={designAreaRef}
                className="absolute border-2 border-dashed border-[#00B4D8]/40"
                style={{
                  left: `${activeArea.area_x}%`,
                  top: `${activeArea.area_y}%`,
                  width: `${activeArea.area_width}%`,
                  height: `${activeArea.area_height}%`,
                }}
                onClick={() => setSelectedId(null)}
              >
                {/* Render elements */}
                {currentElements.map((el) => {
                  if (!el.visible) return null;
                  const isSelected = selectedId === el.id;
                  return (
                    <div
                      key={el.id}
                      className={`absolute cursor-move ${
                        isSelected ? "outline outline-2 outline-[#1B2A6B] outline-offset-1" : ""
                      }`}
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        width: `${el.width}%`,
                        height: `${el.height}%`,
                        opacity: el.opacity,
                        transform: `rotate(${el.rotation}deg)`,
                        zIndex: isSelected ? 50 : undefined,
                      }}
                      onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                    >
                      {/* Text element */}
                      {el.type === "text" && (
                        <div
                          className="w-full h-full flex items-center overflow-hidden pointer-events-none"
                          style={{
                            fontFamily: el.fontFamily || "Arial",
                            fontSize: `${(el.fontSize || 24) * zoom * 0.6}px`,
                            color: el.fontColor || "#1E293B",
                            fontWeight: el.bold ? "bold" : "normal",
                            fontStyle: el.italic ? "italic" : "normal",
                            textAlign: el.textAlign || "center",
                            justifyContent:
                              el.textAlign === "left"
                                ? "flex-start"
                                : el.textAlign === "right"
                                  ? "flex-end"
                                  : "center",
                            lineHeight: 1.2,
                            wordBreak: "break-word",
                          }}
                        >
                          <span className="w-full">{el.text || ""}</span>
                        </div>
                      )}

                      {/* Image element */}
                      {el.type === "image" && el.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={el.imageUrl}
                          alt="Design"
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />
                      )}

                      {/* Shape element */}
                      {el.type === "shape" && el.shapeType && (
                        <ShapeSVG
                          type={el.shapeType}
                          fill={el.fillColor || "#00B4D8"}
                          stroke={el.strokeColor || "#1B2A6B"}
                          strokeWidth={el.strokeWidth || 2}
                        />
                      )}

                      {/* Resize handle */}
                      {isSelected && (
                        <>
                          <div
                            className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#1B2A6B] border border-white cursor-nw-resize"
                            onMouseDown={(e) => handleResizeMouseDown(e, el.id)}
                          />
                          <div
                            className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1B2A6B] border border-white cursor-ne-resize"
                            onMouseDown={(e) => handleResizeMouseDown(e, el.id)}
                          />
                          <div
                            className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#1B2A6B] border border-white cursor-sw-resize"
                            onMouseDown={(e) => handleResizeMouseDown(e, el.id)}
                          />
                          <div
                            className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#1B2A6B] border border-white cursor-se-resize"
                            onMouseDown={(e) => handleResizeMouseDown(e, el.id)}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Properties Panel */}
        <div
          className={`${
            selectedElement ? "block" : "hidden lg:block"
          } w-72 bg-white border-l border-[#E2E8F0] overflow-y-auto flex-shrink-0 ${
            showMobileProps || selectedElement ? "fixed right-0 top-0 z-40 h-full lg:relative" : "hidden lg:block"
          }`}
        >
          <div className="p-4">
            {selectedElement ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E293B]">Propiedades</h3>
                  <button
                    className="lg:hidden p-1 rounded hover:bg-gray-100"
                    onClick={() => setSelectedId(null)}
                  >
                    <X className="size-4 text-[#64748B]" />
                  </button>
                </div>

                {/* Position */}
                <div>
                  <p className="text-xs font-semibold text-[#64748B] mb-2">Posicion</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#64748B]">X (%)</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={selectedElement.x}
                        onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#64748B]">Y (%)</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={selectedElement.y}
                        onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div>
                  <p className="text-xs font-semibold text-[#64748B] mb-2">Tamano</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#64748B]">Ancho (%)</label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        step={0.5}
                        value={selectedElement.width}
                        onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#64748B]">Alto (%)</label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        step={0.5}
                        value={selectedElement.height}
                        onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-[#64748B]">Rotacion</p>
                    <span className="text-[10px] text-[#64748B]">{selectedElement.rotation}deg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCw className="size-3.5 text-[#64748B]" />
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={selectedElement.rotation}
                      onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                      className="flex-1 h-1.5 accent-[#1B2A6B]"
                    />
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-[#64748B]">Opacidad</p>
                    <span className="text-[10px] text-[#64748B]">{Math.round(selectedElement.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(selectedElement.opacity * 100)}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { opacity: Number(e.target.value) / 100 })
                    }
                    className="w-full h-1.5 accent-[#1B2A6B]"
                  />
                </div>

                {/* Text properties */}
                {selectedElement.type === "text" && (
                  <>
                    <div className="border-t border-[#E2E8F0] pt-4">
                      <p className="text-xs font-semibold text-[#64748B] mb-2">Texto</p>
                      <textarea
                        value={selectedElement.text || ""}
                        onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                        rows={2}
                        className="w-full px-2 py-1.5 text-sm border border-[#E2E8F0] rounded-lg resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#64748B] block mb-1">Fuente</label>
                      <select
                        value={selectedElement.fontFamily || "Arial"}
                        onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-[#E2E8F0] rounded-lg"
                        style={{ fontFamily: selectedElement.fontFamily }}
                      >
                        <option value="Arial">Arial</option>
                        {fuentes.map((f) => (
                          <option key={f.id} value={f.familia} style={{ fontFamily: f.familia }}>
                            {f.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#64748B] block mb-1">Tamano</label>
                        <Input
                          type="number"
                          min={8}
                          max={120}
                          value={selectedElement.fontSize || 24}
                          onChange={(e) =>
                            updateElement(selectedElement.id, { fontSize: Number(e.target.value) })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#64748B] block mb-1">Color</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={selectedElement.fontColor || "#1E293B"}
                            onChange={(e) =>
                              updateElement(selectedElement.id, { fontColor: e.target.value })
                            }
                            className="w-8 h-8 rounded border border-[#E2E8F0] cursor-pointer"
                          />
                          <Input
                            value={selectedElement.fontColor || "#1E293B"}
                            onChange={(e) =>
                              updateElement(selectedElement.id, { fontColor: e.target.value })
                            }
                            className="h-8 text-xs flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Style buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateElement(selectedElement.id, { bold: !selectedElement.bold })
                        }
                        className={`p-2 rounded-lg border transition-colors ${
                          selectedElement.bold
                            ? "bg-[#1B2A6B] text-white border-[#1B2A6B]"
                            : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        <Bold className="size-4" />
                      </button>
                      <button
                        onClick={() =>
                          updateElement(selectedElement.id, { italic: !selectedElement.italic })
                        }
                        className={`p-2 rounded-lg border transition-colors ${
                          selectedElement.italic
                            ? "bg-[#1B2A6B] text-white border-[#1B2A6B]"
                            : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        <Italic className="size-4" />
                      </button>
                      <div className="h-6 w-px bg-[#E2E8F0] mx-1" />
                      {(["left", "center", "right"] as const).map((align) => {
                        const AlignIcon =
                          align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                        return (
                          <button
                            key={align}
                            onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                            className={`p-2 rounded-lg border transition-colors ${
                              selectedElement.textAlign === align
                                ? "bg-[#1B2A6B] text-white border-[#1B2A6B]"
                                : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]"
                            }`}
                          >
                            <AlignIcon className="size-4" />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Image properties */}
                {selectedElement.type === "image" && (
                  <div className="border-t border-[#E2E8F0] pt-4">
                    <p className="text-xs font-semibold text-[#64748B] mb-2">Imagen</p>
                    <label className="flex items-center gap-2 px-3 py-2 border border-[#E2E8F0] rounded-lg cursor-pointer hover:bg-[#F8FAFC] text-sm text-[#1E293B]">
                      <Upload className="size-4" />
                      Reemplazar imagen
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            updateElement(selectedElement.id, { imageUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Shape properties */}
                {selectedElement.type === "shape" && (
                  <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                    <p className="text-xs font-semibold text-[#64748B]">Forma</p>
                    <div>
                      <label className="text-[10px] text-[#64748B] block mb-1">Color de relleno</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={selectedElement.fillColor || "#00B4D8"}
                          onChange={(e) =>
                            updateElement(selectedElement.id, { fillColor: e.target.value })
                          }
                          className="w-8 h-8 rounded border border-[#E2E8F0] cursor-pointer"
                        />
                        <Input
                          value={selectedElement.fillColor || "#00B4D8"}
                          onChange={(e) =>
                            updateElement(selectedElement.id, { fillColor: e.target.value })
                          }
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#64748B] block mb-1">Color de borde</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={selectedElement.strokeColor || "#1B2A6B"}
                          onChange={(e) =>
                            updateElement(selectedElement.id, { strokeColor: e.target.value })
                          }
                          className="w-8 h-8 rounded border border-[#E2E8F0] cursor-pointer"
                        />
                        <Input
                          value={selectedElement.strokeColor || "#1B2A6B"}
                          onChange={(e) =>
                            updateElement(selectedElement.id, { strokeColor: e.target.value })
                          }
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#64748B] block mb-1">Grosor de borde</label>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={selectedElement.strokeWidth || 2}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-[#E2E8F0] pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateElement(selectedElement.id)}
                    className="flex-1 gap-1.5 text-xs"
                  >
                    <Copy className="size-3.5" />
                    Duplicar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteElement(selectedElement.id)}
                    className="flex-1 gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Palette className="size-10 mx-auto mb-3 text-[#CBD5E1]" />
                <p className="text-sm text-[#64748B]">
                  Selecciona un elemento para ver sus propiedades
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1E293B]">Vista Previa</h2>
              <button onClick={() => setShowPreview(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="size-5 text-[#64748B]" />
              </button>
            </div>

            <div className="space-y-4">
              {areas.map((area, idx) => (
                <div key={area.id}>
                  <p className="text-sm font-medium text-[#1E293B] mb-2">{area.nombre}</p>
                  <div
                    className="relative bg-[#F8FAFC] rounded-lg overflow-hidden border border-[#E2E8F0]"
                    style={{ aspectRatio: "3 / 4" }}
                  >
                    {area.mockup_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={area.mockup_url}
                        alt={area.nombre}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    )}
                    <div
                      className="absolute"
                      style={{
                        left: `${area.area_x}%`,
                        top: `${area.area_y}%`,
                        width: `${area.area_width}%`,
                        height: `${area.area_height}%`,
                      }}
                    >
                      {(elements[area.id] || [])
                        .filter((el) => el.visible)
                        .map((el) => (
                          <div
                            key={el.id}
                            className="absolute"
                            style={{
                              left: `${el.x}%`,
                              top: `${el.y}%`,
                              width: `${el.width}%`,
                              height: `${el.height}%`,
                              opacity: el.opacity,
                              transform: `rotate(${el.rotation}deg)`,
                            }}
                          >
                            {el.type === "text" && (
                              <div
                                className="w-full h-full flex items-center overflow-hidden"
                                style={{
                                  fontFamily: el.fontFamily || "Arial",
                                  fontSize: `${(el.fontSize || 24) * 0.5}px`,
                                  color: el.fontColor || "#1E293B",
                                  fontWeight: el.bold ? "bold" : "normal",
                                  fontStyle: el.italic ? "italic" : "normal",
                                  textAlign: el.textAlign || "center",
                                  justifyContent:
                                    el.textAlign === "left"
                                      ? "flex-start"
                                      : el.textAlign === "right"
                                        ? "flex-end"
                                        : "center",
                                  lineHeight: 1.2,
                                  wordBreak: "break-word",
                                }}
                              >
                                <span className="w-full">{el.text || ""}</span>
                              </div>
                            )}
                            {el.type === "image" && el.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={el.imageUrl}
                                alt="Design"
                                className="w-full h-full object-contain"
                              />
                            )}
                            {el.type === "shape" && el.shapeType && (
                              <ShapeSVG
                                type={el.shapeType}
                                fill={el.fillColor || "#00B4D8"}
                                stroke={el.strokeColor || "#1B2A6B"}
                                strokeWidth={el.strokeWidth || 2}
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowPreview(false);
                  handleAddToCart();
                }}
                disabled={saving}
                className="flex-1 gap-2 bg-[#1B2A6B] hover:bg-[#152259] text-white"
              >
                <ShoppingCart className="size-4" />
                Agregar al Carrito
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
