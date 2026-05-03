"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  Save,
  Send,
  X,
  Type,
  Image,
  MousePointerClick,
  Minus,
  Columns2,
  ShoppingBag,
  Ticket,
  Share2,
  FileText,
  GripVertical,
  LayoutTemplate,
  Heading,
  Space,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

// ─── Block Types ───────────────────────────────────────────────

type BlockType =
  | "header"
  | "texto"
  | "imagen"
  | "boton"
  | "separador"
  | "columnas"
  | "producto"
  | "cupon"
  | "social"
  | "footer"
  | "espaciador";

interface Block {
  id: string;
  type: BlockType;
  props: Record<string, string | number>;
}

const BLOCK_PALETTE: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "header", label: "Header", icon: Heading },
  { type: "texto", label: "Texto", icon: Type },
  { type: "imagen", label: "Imagen", icon: Image },
  { type: "boton", label: "Boton CTA", icon: MousePointerClick },
  { type: "separador", label: "Separador", icon: Minus },
  { type: "columnas", label: "Columnas", icon: Columns2 },
  { type: "producto", label: "Producto", icon: ShoppingBag },
  { type: "cupon", label: "Cupon", icon: Ticket },
  { type: "social", label: "Social", icon: Share2 },
  { type: "footer", label: "Footer", icon: FileText },
  { type: "espaciador", label: "Espaciador", icon: Space },
];

function getDefaultProps(type: BlockType): Record<string, string | number> {
  switch (type) {
    case "header":
      return { logo_url: "", titulo: "PrintUp", bg_color: "#1B2A6B", padding: 20 };
    case "texto":
      return { contenido: "Escribe tu texto aqui...", alineacion: "left", color: "#333333", font_size: 16 };
    case "imagen":
      return { url: "", alt: "Imagen", link: "", width: 100 };
    case "boton":
      return { texto: "Click aqui", url: "#", bg_color: "#FF9710", text_color: "#FFFFFF", border_radius: 6 };
    case "separador":
      return { color: "#E2E8F0", grosor: 1 };
    case "columnas":
      return { left_content: "Columna izquierda", right_content: "Columna derecha" };
    case "producto":
      return { producto_nombre: "Producto", producto_imagen: "", producto_precio: "$0", producto_url: "#" };
    case "cupon":
      return { codigo: "DESCUENTO10", descuento: "10%", descripcion: "Descuento especial", fecha_expiracion: "" };
    case "social":
      return { facebook_url: "", instagram_url: "", whatsapp_url: "" };
    case "footer":
      return { texto: "Este email fue enviado por PrintUp.cl", direccion: "Santiago, Chile" };
    case "espaciador":
      return { altura: 30 };
  }
}

let blockIdCounter = 0;
function makeId(): string {
  return `block_${Date.now()}_${++blockIdCounter}`;
}

// ─── Block Preview Renderers ───────────────────────────────────

function BlockPreview({ block }: { block: Block }) {
  const p = block.props;
  switch (block.type) {
    case "header":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: String(p.bg_color) }}>
          <tbody>
            <tr>
              <td style={{ padding: `${p.padding}px`, textAlign: "center" }}>
                {p.logo_url ? (
                  <img src={String(p.logo_url)} alt="Logo" style={{ maxHeight: 50, marginBottom: 8 }} />
                ) : null}
                <h1 style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "bold", margin: 0, fontFamily: "Arial, sans-serif" }}>
                  {String(p.titulo)}
                </h1>
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "texto":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ padding: "12px 20px", textAlign: p.alineacion as "left" | "center" | "right", color: String(p.color), fontSize: Number(p.font_size), fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
                {String(p.contenido)}
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "imagen":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ padding: "12px 20px", textAlign: "center" }}>
                {p.url ? (
                  <img src={String(p.url)} alt={String(p.alt)} style={{ width: `${p.width}%`, maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }} />
                ) : (
                  <div style={{ width: `${p.width}%`, maxWidth: "100%", height: 150, backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", borderRadius: 8 }}>
                    <Image className="size-10" style={{ color: "#CBD5E1" }} />
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "boton":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ padding: "16px 20px", textAlign: "center" }}>
                <a
                  href={String(p.url)}
                  style={{
                    display: "inline-block",
                    padding: "12px 32px",
                    backgroundColor: String(p.bg_color),
                    color: String(p.text_color),
                    borderRadius: `${p.border_radius}px`,
                    textDecoration: "none",
                    fontSize: 16,
                    fontWeight: "bold",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {String(p.texto)}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "separador":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ padding: "12px 20px" }}>
                <hr style={{ border: "none", borderTop: `${p.grosor}px solid ${p.color}`, margin: 0 }} />
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "columnas":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ width: "50%", padding: "12px 10px 12px 20px", verticalAlign: "top", fontSize: 14, fontFamily: "Arial, sans-serif", color: "#333", lineHeight: 1.6 }}>
                {String(p.left_content)}
              </td>
              <td style={{ width: "50%", padding: "12px 20px 12px 10px", verticalAlign: "top", fontSize: 14, fontFamily: "Arial, sans-serif", color: "#333", lineHeight: 1.6 }}>
                {String(p.right_content)}
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "producto":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ padding: "16px 20px" }}>
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 120, verticalAlign: "top" }}>
                        {p.producto_imagen ? (
                          <img src={String(p.producto_imagen)} alt={String(p.producto_nombre)} style={{ width: 120, height: 120, objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 120, height: 120, backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ShoppingBag className="size-8" style={{ color: "#CBD5E1" }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 16, verticalAlign: "top", fontFamily: "Arial, sans-serif" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: "bold", color: "#1E293B" }}>{String(p.producto_nombre)}</p>
                        <p style={{ margin: "0 0 12px", fontSize: 18, fontWeight: "bold", color: "#FF9710" }}>{String(p.producto_precio)}</p>
                        <a href={String(p.producto_url)} style={{ display: "inline-block", padding: "8px 20px", backgroundColor: "#1B2A6B", color: "#FFFFFF", borderRadius: 4, textDecoration: "none", fontSize: 13, fontWeight: "bold" }}>
                          Ver producto
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "cupon":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ padding: "16px 20px" }}>
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#FFF7ED", borderRadius: 8, border: "2px dashed #FF9710" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: 20, textAlign: "center", fontFamily: "Arial, sans-serif" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748B", textTransform: "uppercase", letterSpacing: 1 }}>Codigo de descuento</p>
                        <p style={{ margin: "0 0 8px", fontSize: 28, fontWeight: "bold", color: "#FF9710", letterSpacing: 3, fontFamily: "monospace" }}>{String(p.codigo)}</p>
                        <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: "bold", color: "#1E293B" }}>{String(p.descuento)} de descuento</p>
                        <p style={{ margin: 0, fontSize: 14, color: "#64748B" }}>{String(p.descripcion)}</p>
                        {p.fecha_expiracion && (
                          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#94A3B8" }}>Valido hasta: {String(p.fecha_expiracion)}</p>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "social":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ padding: "16px 20px", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: 14, color: "#64748B", fontFamily: "Arial, sans-serif" }}>Siguenos en redes sociales</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                  {p.facebook_url && <a href={String(p.facebook_url)} style={{ color: "#1B2A6B", textDecoration: "none", fontSize: 14, fontWeight: "bold" }}>Facebook</a>}
                  {p.instagram_url && <a href={String(p.instagram_url)} style={{ color: "#E1306C", textDecoration: "none", fontSize: 14, fontWeight: "bold" }}>Instagram</a>}
                  {p.whatsapp_url && <a href={String(p.whatsapp_url)} style={{ color: "#25D366", textDecoration: "none", fontSize: 14, fontWeight: "bold" }}>WhatsApp</a>}
                  {!p.facebook_url && !p.instagram_url && !p.whatsapp_url && (
                    <span style={{ color: "#94A3B8", fontSize: 13 }}>Agrega URLs de redes sociales</span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "footer":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#F8FAFC" }}>
          <tbody>
            <tr>
              <td style={{ padding: "20px", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748B" }}>{String(p.texto)}</p>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#94A3B8" }}>{String(p.direccion)}</p>
                <a href="#" style={{ fontSize: 12, color: "#94A3B8", textDecoration: "underline" }}>Desuscribirse</a>
              </td>
            </tr>
          </tbody>
        </table>
      );
    case "espaciador":
      return (
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ height: Number(p.altura), fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>
      );
    default:
      return <div style={{ padding: 20, color: "#94A3B8" }}>Bloque desconocido</div>;
  }
}

// ─── Properties Panel ──────────────────────────────────────────

function PropertiesPanel({
  block,
  onChange,
}: {
  block: Block;
  onChange: (props: Record<string, string | number>) => void;
}) {
  const p = block.props;

  const update = (key: string, value: string | number) => {
    onChange({ ...p, [key]: value });
  };

  const renderField = (
    label: string,
    key: string,
    type: "text" | "textarea" | "color" | "number" | "select" = "text",
    options?: { value: string; label: string }[]
  ) => {
    return (
      <div key={key}>
        <label className="mb-1 block text-xs font-semibold" style={{ color: "#1E293B" }}>
          {label}
        </label>
        {type === "textarea" ? (
          <textarea
            value={String(p[key] ?? "")}
            onChange={(e) => update(key, e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
          />
        ) : type === "color" ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={String(p[key] ?? "#000000")}
              onChange={(e) => update(key, e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-gray-200"
            />
            <Input
              value={String(p[key] ?? "")}
              onChange={(e) => update(key, e.target.value)}
              className="h-8 text-xs flex-1"
            />
          </div>
        ) : type === "number" ? (
          <Input
            type="number"
            value={p[key] ?? ""}
            onChange={(e) => update(key, Number(e.target.value))}
            className="h-8 text-xs"
          />
        ) : type === "select" && options ? (
          <select
            value={String(p[key] ?? "")}
            onChange={(e) => update(key, e.target.value)}
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            value={String(p[key] ?? "")}
            onChange={(e) => update(key, e.target.value)}
            className="h-8 text-xs"
          />
        )}
      </div>
    );
  };

  const renderSlider = (label: string, key: string, min: number, max: number, unit: string = "px") => {
    return (
      <div key={key}>
        <label className="mb-1 flex items-center justify-between text-xs font-semibold" style={{ color: "#1E293B" }}>
          <span>{label}</span>
          <span style={{ color: "#64748B" }}>{p[key]}{unit}</span>
        </label>
        <input
          type="range"
          min={min}
          max={max}
          value={Number(p[key] ?? min)}
          onChange={(e) => update(key, Number(e.target.value))}
          className="w-full accent-[#1B2A6B]"
        />
      </div>
    );
  };

  switch (block.type) {
    case "header":
      return (
        <div className="space-y-3">
          {renderField("URL del logo", "logo_url")}
          {renderField("Titulo", "titulo")}
          {renderField("Color de fondo", "bg_color", "color")}
          {renderSlider("Padding", "padding", 8, 60)}
        </div>
      );
    case "texto":
      return (
        <div className="space-y-3">
          {renderField("Contenido", "contenido", "textarea")}
          {renderField("Alineacion", "alineacion", "select", [
            { value: "left", label: "Izquierda" },
            { value: "center", label: "Centro" },
            { value: "right", label: "Derecha" },
          ])}
          {renderField("Color", "color", "color")}
          {renderField("Tamano de fuente", "font_size", "select", [
            { value: "12", label: "12px" },
            { value: "14", label: "14px" },
            { value: "16", label: "16px" },
            { value: "18", label: "18px" },
            { value: "20", label: "20px" },
            { value: "24", label: "24px" },
          ])}
        </div>
      );
    case "imagen":
      return (
        <div className="space-y-3">
          {renderField("URL de la imagen", "url")}
          {renderField("Texto alt", "alt")}
          {renderField("URL del link", "link")}
          {renderSlider("Ancho", "width", 10, 100, "%")}
        </div>
      );
    case "boton":
      return (
        <div className="space-y-3">
          {renderField("Texto del boton", "texto")}
          {renderField("URL", "url")}
          {renderField("Color de fondo", "bg_color", "color")}
          {renderField("Color del texto", "text_color", "color")}
          {renderSlider("Border radius", "border_radius", 0, 30)}
        </div>
      );
    case "separador":
      return (
        <div className="space-y-3">
          {renderField("Color", "color", "color")}
          {renderSlider("Grosor", "grosor", 1, 5)}
        </div>
      );
    case "columnas":
      return (
        <div className="space-y-3">
          {renderField("Columna izquierda", "left_content", "textarea")}
          {renderField("Columna derecha", "right_content", "textarea")}
        </div>
      );
    case "producto":
      return (
        <div className="space-y-3">
          {renderField("Nombre del producto", "producto_nombre")}
          {renderField("URL de imagen", "producto_imagen")}
          {renderField("Precio", "producto_precio")}
          {renderField("URL del producto", "producto_url")}
        </div>
      );
    case "cupon":
      return (
        <div className="space-y-3">
          {renderField("Codigo", "codigo")}
          {renderField("Descuento", "descuento")}
          {renderField("Descripcion", "descripcion")}
          {renderField("Fecha de expiracion", "fecha_expiracion")}
        </div>
      );
    case "social":
      return (
        <div className="space-y-3">
          {renderField("Facebook URL", "facebook_url")}
          {renderField("Instagram URL", "instagram_url")}
          {renderField("WhatsApp URL", "whatsapp_url")}
        </div>
      );
    case "footer":
      return (
        <div className="space-y-3">
          {renderField("Texto legal", "texto", "textarea")}
          {renderField("Direccion", "direccion")}
        </div>
      );
    case "espaciador":
      return (
        <div className="space-y-3">
          {renderSlider("Altura", "altura", 10, 100)}
        </div>
      );
    default:
      return <p className="text-xs" style={{ color: "#94A3B8" }}>Sin propiedades</p>;
  }
}

// ─── Main Editor Component ─────────────────────────────────────

function EditorContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "nuevo";

  const [templateName, setTemplateName] = useState("Nuevo Template");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(isNew ? null : id);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load existing template or create new
  useEffect(() => {
    if (isNew) {
      setInitialized(true);
      return;
    }
    fetch(`/api/admin/campanas/templates/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setTemplateName(data.nombre || "Template");
        if (data.contenido_json && Array.isArray(data.contenido_json)) {
          setBlocks(data.contenido_json);
        }
        setInitialized(true);
      })
      .catch(() => {
        toast.error("Error al cargar template");
        setInitialized(true);
      });
  }, [id, isNew]);

  // Create new template on first save if isNew
  const ensureTemplateId = useCallback(async (): Promise<string | null> => {
    if (templateId) return templateId;
    try {
      const res = await fetch("/api/admin/campanas/templates", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: templateName,
          contenido_json: blocks,
          categoria: "general",
        }),
      });
      if (!res.ok) throw new Error("Error al crear template");
      const data = await res.json();
      const newId = data.id;
      setTemplateId(newId);
      // Replace URL without full navigation
      window.history.replaceState(null, "", `/admin/campanas/editor/${newId}`);
      return newId;
    } catch {
      toast.error("Error al crear template");
      return null;
    }
  }, [templateId, templateName, blocks]);

  const handleSave = async () => {
    setSaving(true);
    const tId = await ensureTemplateId();
    if (!tId) {
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/campanas/templates/${tId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: templateName,
          contenido_json: blocks,
        }),
      });
      if (res.ok) {
        toast.success("Template guardado");
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  const handlePreview = async () => {
    const tId = await ensureTemplateId();
    if (!tId) return;
    // Save first
    await handleSave();
    try {
      const res = await fetch(`/api/admin/campanas/templates/${tId}/render`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setPreviewHtml(data.html || "");
      setShowPreview(true);
    } catch {
      toast.error("Error al generar preview");
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Ingresa un email");
      return;
    }
    const tId = await ensureTemplateId();
    if (!tId) return;
    setSendingTest(true);
    try {
      const res = await fetch(`/api/admin/campanas/templates/${tId}/test`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      if (res.ok) {
        toast.success("Email de prueba enviado");
        setShowTestDialog(false);
        setTestEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al enviar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSendingTest(false);
  };

  // Block operations
  const addBlock = (type: BlockType) => {
    const newBlock: Block = { id: makeId(), type, props: getDefaultProps(type) };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const deleteBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  const updateBlockProps = (blockId: string, props: Record<string, string | number>) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, props } : b)));
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  if (!initialized) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-[3px] border-current border-t-transparent"
            style={{ color: "#1B2A6B" }}
          />
          <p className="text-sm" style={{ color: "#64748B" }}>
            Cargando editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b bg-white px-4 py-2">
        <Link href="/admin/campanas/templates">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Templates</span>
          </Button>
        </Link>

        <div className="h-6 w-px bg-gray-200" />

        <Input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="h-8 w-48 text-sm font-semibold"
          style={{ color: "#1E293B" }}
        />

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={handlePreview}>
            <Eye className="size-4" />
            <span className="hidden sm:inline">Vista Previa</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowTestDialog(true)}>
            <Mail className="size-4" />
            <span className="hidden sm:inline">Enviar prueba</span>
          </Button>
          <Button
            size="sm"
            className="gap-1 text-white hover:opacity-90"
            style={{ backgroundColor: "#1B2A6B" }}
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="size-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Block Palette */}
        <div className="w-56 shrink-0 overflow-y-auto border-r bg-gray-50 p-3 lg:w-64">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>
            Bloques
          </p>
          <div className="space-y-1.5">
            {BLOCK_PALETTE.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => addBlock(item.type)}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-[#1B2A6B] hover:bg-[#1B2A6B08]"
                >
                  <Icon className="size-4 shrink-0" style={{ color: "#1B2A6B" }} />
                  <span className="text-xs font-medium" style={{ color: "#1E293B" }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 lg:p-8">
          <div
            className="mx-auto rounded-lg bg-white shadow-sm"
            style={{ maxWidth: 600, minHeight: 400 }}
          >
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <LayoutTemplate className="size-16 mb-4" style={{ color: "#CBD5E1" }} />
                <p className="text-sm font-medium" style={{ color: "#94A3B8" }}>
                  Haz click en un bloque del panel izquierdo para agregarlo
                </p>
              </div>
            ) : (
              blocks.map((block, idx) => {
                const isSelected = selectedBlockId === block.id;
                return (
                  <div
                    key={block.id}
                    className="group relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBlockId(block.id);
                    }}
                    style={{
                      outline: isSelected ? "2px solid #1B2A6B" : "1px solid transparent",
                      outlineOffset: -1,
                      cursor: "pointer",
                    }}
                  >
                    {/* Hover/Selected controls */}
                    <div
                      className={`absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      } transition-opacity`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, "up");
                        }}
                        disabled={idx === 0}
                        className="flex size-7 items-center justify-center rounded bg-white shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                        title="Mover arriba"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, "down");
                        }}
                        disabled={idx === blocks.length - 1}
                        className="flex size-7 items-center justify-center rounded bg-white shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                        title="Mover abajo"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock(block.id);
                        }}
                        className="flex size-7 items-center justify-center rounded bg-white shadow-sm border border-red-200 text-red-500 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* Block type badge */}
                    {isSelected && (
                      <div
                        className="absolute -top-5 left-0 rounded-t px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: "#1B2A6B" }}
                      >
                        {BLOCK_PALETTE.find((bp) => bp.type === block.type)?.label || block.type}
                      </div>
                    )}

                    <BlockPreview block={block} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-64 shrink-0 overflow-y-auto border-l bg-white p-4 lg:w-72">
          {selectedBlock ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>
                  Propiedades
                </p>
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: "#1B2A6B10", color: "#1B2A6B" }}
                >
                  {BLOCK_PALETTE.find((bp) => bp.type === selectedBlock.type)?.label || selectedBlock.type}
                </span>
              </div>
              <PropertiesPanel
                block={selectedBlock}
                onChange={(props) => updateBlockProps(selectedBlock.id, props)}
              />
              <div className="mt-6 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteBlock(selectedBlock.id)}
                >
                  <Trash2 className="size-3.5" />
                  Eliminar bloque
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12">
              <GripVertical className="size-8" style={{ color: "#CBD5E1" }} />
              <p className="text-center text-xs" style={{ color: "#94A3B8" }}>
                Selecciona un bloque en el canvas para editar sus propiedades
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowPreview(false)} />
          <div className="relative z-10 mx-4 h-[90vh] w-full max-w-2xl rounded-xl bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                Vista Previa
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="size-5" style={{ color: "#64748B" }} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-6">
              <div className="mx-auto rounded-lg bg-white shadow-sm" style={{ maxWidth: 600 }}>
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="h-[70vh] w-full rounded-lg"
                    title="Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center">
                    <p className="text-sm" style={{ color: "#94A3B8" }}>Sin contenido para mostrar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Dialog */}
      {showTestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowTestDialog(false)} />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                Enviar email de prueba
              </h2>
              <button
                onClick={() => setShowTestDialog(false)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="size-5" style={{ color: "#64748B" }} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Email
                </label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendTest}
                  disabled={sendingTest}
                  style={{ backgroundColor: "#1B2A6B" }}
                  className="gap-2 text-white hover:opacity-90"
                >
                  <Send className="size-4" />
                  {sendingTest ? "Enviando..." : "Enviar prueba"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage(props: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard>
      <EditorContent params={props.params} />
    </AuthGuard>
  );
}
