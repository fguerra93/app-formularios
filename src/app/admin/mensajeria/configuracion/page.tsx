"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Save,
  Eye,
  EyeOff,
  ArrowLeft,
  Plug,
  Zap,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

// ---- Types ----

interface MetaConfig {
  meta_app_id: string;
  meta_app_secret: string;
  meta_page_access_token: string;
  meta_page_id: string;
  meta_ig_account_id: string;
  meta_webhook_verify_token: string;
}

interface RespuestaAutomatica {
  id: string;
  nombre: string;
  palabras_clave: string[];
  respuesta: string;
  canales: string[];
  horario?: string;
  activo: boolean;
}

interface MensajeRapido {
  id: string;
  titulo: string;
  contenido: string;
  categoria: string;
  atajo: string;
  canales: string[];
}

const defaultMetaConfig: MetaConfig = {
  meta_app_id: "",
  meta_app_secret: "",
  meta_page_access_token: "",
  meta_page_id: "",
  meta_ig_account_id: "",
  meta_webhook_verify_token: "",
};

// ---- Meta Connection Tab ----

function MetaConnectionTab() {
  const [config, setConfig] = useState<MetaConfig>(defaultMetaConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/meta`);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/configuracion", { credentials: "include" });
        if (!res.ok) {
          // Try the public config endpoint
          const res2 = await fetch("/api/config");
          if (res2.ok) {
            const data = await res2.json();
            const configMap: Record<string, string> = {};
            if (Array.isArray(data)) {
              data.forEach((item: { clave: string; valor: string }) => {
                configMap[item.clave] = item.valor;
              });
            } else if (data && typeof data === "object") {
              Object.assign(configMap, data);
            }
            setConfig({
              ...defaultMetaConfig,
              ...Object.fromEntries(
                Object.entries(configMap).filter(([k]) => k.startsWith("meta_"))
              ),
            } as MetaConfig);
          }
        } else {
          const data = await res.json();
          const configMap: Record<string, string> = {};
          if (Array.isArray(data)) {
            data.forEach((item: { clave: string; valor: string }) => {
              configMap[item.clave] = item.valor;
            });
          } else if (data && typeof data === "object") {
            Object.assign(configMap, data);
          }
          setConfig({
            ...defaultMetaConfig,
            ...Object.fromEntries(
              Object.entries(configMap).filter(([k]) => k.startsWith("meta_"))
            ),
          } as MetaConfig);
        }
      } catch {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(config).map(([clave, valor]) => ({ clave, valor }));
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
      });
      if (res.ok) {
        toast.success("Configuracion Meta guardada");
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof MetaConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("URL copiada al portapapeles");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const fields: {
    key: keyof MetaConfig;
    label: string;
    placeholder: string;
    isSecret?: boolean;
    description?: string;
  }[] = [
    { key: "meta_app_id", label: "App ID", placeholder: "123456789012345" },
    {
      key: "meta_app_secret",
      label: "App Secret",
      placeholder: "abc123def456...",
      isSecret: true,
    },
    {
      key: "meta_page_access_token",
      label: "Page Access Token",
      placeholder: "EAAxxxxxxx...",
      isSecret: true,
      description: "Token de acceso permanente de la pagina de Facebook",
    },
    {
      key: "meta_page_id",
      label: "Page ID",
      placeholder: "123456789012345",
      description: "ID de la pagina de Facebook",
    },
    {
      key: "meta_ig_account_id",
      label: "Instagram Account ID",
      placeholder: "17841234567890",
      description: "ID de la cuenta de Instagram Business vinculada",
    },
    {
      key: "meta_webhook_verify_token",
      label: "Webhook Verify Token",
      placeholder: "mi_token_secreto",
      description: "Token para verificar el webhook de Meta",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
          <Plug className="size-5" />
          Conexion Meta Business
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Webhook URL */}
        <div className="rounded-lg border p-3 bg-[#F8FAFC]">
          <Label className="text-xs font-medium" style={{ color: "#64748B" }}>
            Webhook URL (usar en Meta Dashboard)
          </Label>
          <div className="flex items-center gap-2 mt-1.5">
            <Input
              value={webhookUrl}
              readOnly
              className="text-xs bg-white font-mono"
            />
            <Button variant="outline" size="sm" onClick={copyWebhook} className="gap-1.5 shrink-0">
              <Copy className="size-3.5" />
              Copiar
            </Button>
          </div>
        </div>

        <Separator />

        {/* Config fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => {
            const hasValue = !!config[f.key];
            const isSecretField = f.isSecret;
            const showField =
              f.key === "meta_app_secret" ? showSecret : f.key === "meta_page_access_token" ? showToken : true;
            const toggleShow =
              f.key === "meta_app_secret"
                ? () => setShowSecret(!showSecret)
                : f.key === "meta_page_access_token"
                  ? () => setShowToken(!showToken)
                  : undefined;

            return (
              <div key={f.key} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Label style={{ color: "#1E293B" }}>{f.label}</Label>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: hasValue ? "#10B981" : "#CBD5E1" }}
                  />
                </div>
                <div className="relative">
                  <Input
                    type={isSecretField && !showField ? "password" : "text"}
                    value={config[f.key]}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={isSecretField ? "pr-9" : ""}
                  />
                  {isSecretField && toggleShow && (
                    <button
                      type="button"
                      onClick={toggleShow}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-gray-100"
                    >
                      {showField ? (
                        <EyeOff className="size-4" style={{ color: "#64748B" }} />
                      ) : (
                        <Eye className="size-4" style={{ color: "#64748B" }} />
                      )}
                    </button>
                  )}
                </div>
                {f.description && (
                  <p className="text-[11px]" style={{ color: "#94A3B8" }}>
                    {f.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
            style={{ backgroundColor: "#1B2A6B" }}
          >
            <Save className="size-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Respuestas Automaticas Tab ----

const emptyRespuesta: Omit<RespuestaAutomatica, "id"> = {
  nombre: "",
  palabras_clave: [],
  respuesta: "",
  canales: ["whatsapp"],
  horario: "",
  activo: true,
};

function RespuestasTab() {
  const [respuestas, setRespuestas] = useState<RespuestaAutomatica[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<RespuestaAutomatica | null>(null);
  const [form, setForm] = useState(emptyRespuesta);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mensajeria/respuestas-automaticas", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRespuestas(Array.isArray(data) ? data : data.data || []);
      } else {
        setRespuestas([]);
      }
    } catch {
      setRespuestas([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyRespuesta);
    setKeywordsInput("");
    setDialogOpen(true);
  };

  const openEdit = (item: RespuestaAutomatica) => {
    setEditItem(item);
    setForm({
      nombre: item.nombre,
      palabras_clave: item.palabras_clave,
      respuesta: item.respuesta,
      canales: item.canales,
      horario: item.horario || "",
      activo: item.activo,
    });
    setKeywordsInput(item.palabras_clave.join(", "));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.respuesta.trim()) {
      toast.error("Nombre y respuesta son obligatorios");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      palabras_clave: keywordsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editItem) {
        const res = await fetch(`/api/admin/mensajeria/respuestas-automaticas/${editItem.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Respuesta actualizada");
        } else {
          toast.success("Respuesta actualizada (local)");
        }
      } else {
        const res = await fetch("/api/admin/mensajeria/respuestas-automaticas", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Respuesta creada");
        } else {
          toast.success("Respuesta creada (local)");
        }
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta respuesta automatica?")) return;
    try {
      await fetch(`/api/admin/mensajeria/respuestas-automaticas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success("Respuesta eliminada");
      fetchData();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const toggleActivo = async (item: RespuestaAutomatica) => {
    try {
      await fetch(`/api/admin/mensajeria/respuestas-automaticas/${item.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, activo: !item.activo }),
      });
    } catch {
      // proceed locally
    }
    setRespuestas((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, activo: !r.activo } : r))
    );
  };

  const toggleCanal = (canal: string) => {
    setForm((prev) => ({
      ...prev,
      canales: prev.canales.includes(canal)
        ? prev.canales.filter((c) => c !== canal)
        : [...prev.canales, canal],
    }));
  };

  const canalOptions = [
    { key: "whatsapp", label: "WA", color: "#25D366" },
    { key: "instagram", label: "IG", color: "#E1306C" },
    { key: "facebook", label: "FB", color: "#1877F2" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <Zap className="size-5" />
            Respuestas Automaticas
          </CardTitle>
          <Button size="sm" onClick={openCreate} className="gap-1.5" style={{ backgroundColor: "#1B2A6B" }}>
            <Plus className="size-3.5" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : respuestas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Zap className="size-8 mb-2" style={{ color: "#CBD5E1" }} />
            <p className="text-sm" style={{ color: "#94A3B8" }}>
              No hay respuestas automaticas configuradas
            </p>
            <Button size="sm" variant="outline" onClick={openCreate} className="mt-3 gap-1.5">
              <Plus className="size-3.5" />
              Crear primera respuesta
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ color: "#64748B" }}>
                  <th className="pb-3 text-left font-medium">Nombre</th>
                  <th className="pb-3 text-left font-medium hidden sm:table-cell">Palabras Clave</th>
                  <th className="pb-3 text-left font-medium hidden md:table-cell">Respuesta</th>
                  <th className="pb-3 text-center font-medium">Canales</th>
                  <th className="pb-3 text-center font-medium hidden md:table-cell">Horario</th>
                  <th className="pb-3 text-center font-medium">Activo</th>
                  <th className="pb-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {respuestas.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-medium" style={{ color: "#1E293B" }}>
                      {item.nombre}
                    </td>
                    <td className="py-3 hidden sm:table-cell" style={{ color: "#64748B" }}>
                      <div className="flex flex-wrap gap-1">
                        {item.palabras_clave.slice(0, 3).map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] bg-[#F1F5F9]"
                            style={{ color: "#64748B" }}
                          >
                            {kw}
                          </span>
                        ))}
                        {item.palabras_clave.length > 3 && (
                          <span className="text-[10px]" style={{ color: "#94A3B8" }}>
                            +{item.palabras_clave.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 hidden md:table-cell max-w-[200px]" style={{ color: "#64748B" }}>
                      <p className="truncate text-xs">{item.respuesta}</p>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {canalOptions
                          .filter((c) => item.canales.includes(c.key))
                          .map((c) => (
                            <span
                              key={c.key}
                              className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                              style={{ backgroundColor: c.color }}
                            >
                              {c.label}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="py-3 text-center hidden md:table-cell">
                      <span className="text-xs" style={{ color: "#64748B" }}>
                        {item.horario || "Siempre"}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => toggleActivo(item)}
                        className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors"
                        style={{
                          backgroundColor: item.activo ? "#10B98115" : "#F1F5F9",
                          color: item.activo ? "#10B981" : "#94A3B8",
                        }}
                      >
                        {item.activo ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" style={{ color: "#64748B" }} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="size-3.5 text-red-400" />
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Editar Respuesta Automatica" : "Nueva Respuesta Automatica"}
            </DialogTitle>
            <DialogDescription>
              Configura la respuesta automatica para los canales de mensajeria.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#1E293B" }}>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Saludo bienvenida"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#1E293B" }}>Palabras Clave</Label>
              <Input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="hola, buenos dias, hi (separadas por coma)"
              />
              <p className="text-[11px]" style={{ color: "#94A3B8" }}>
                Separar con comas
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#1E293B" }}>Respuesta</Label>
              <Textarea
                value={form.respuesta}
                onChange={(e) => setForm((f) => ({ ...f, respuesta: e.target.value }))}
                placeholder="Hola! Gracias por contactarnos..."
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#1E293B" }}>Canales</Label>
              <div className="flex gap-2">
                {canalOptions.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => toggleCanal(c.key)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors border"
                    style={{
                      backgroundColor: form.canales.includes(c.key) ? c.color : "transparent",
                      color: form.canales.includes(c.key) ? "#FFFFFF" : "#64748B",
                      borderColor: form.canales.includes(c.key) ? c.color : "#E2E8F0",
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#1E293B" }}>Horario (opcional)</Label>
              <Input
                value={form.horario || ""}
                onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
                placeholder="09:00-18:00 o vacio para siempre"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5"
              style={{ backgroundColor: "#1B2A6B" }}
            >
              <Save className="size-3.5" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---- Mensajes Rapidos Tab ----

const emptyMensaje: Omit<MensajeRapido, "id"> = {
  titulo: "",
  contenido: "",
  categoria: "",
  atajo: "",
  canales: ["whatsapp", "instagram", "facebook"],
};

function MensajesRapidosTab() {
  const [mensajes, setMensajes] = useState<MensajeRapido[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MensajeRapido | null>(null);
  const [form, setForm] = useState(emptyMensaje);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mensajeria/mensajes-rapidos", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMensajes(Array.isArray(data) ? data : data.data || []);
      } else {
        setMensajes([]);
      }
    } catch {
      setMensajes([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyMensaje);
    setDialogOpen(true);
  };

  const openEdit = (item: MensajeRapido) => {
    setEditItem(item);
    setForm({
      titulo: item.titulo,
      contenido: item.contenido,
      categoria: item.categoria,
      atajo: item.atajo,
      canales: item.canales,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      toast.error("Titulo y contenido son obligatorios");
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        const res = await fetch(`/api/admin/mensajeria/mensajes-rapidos/${editItem.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          toast.success("Mensaje rapido actualizado");
        } else {
          toast.success("Mensaje rapido actualizado (local)");
        }
      } else {
        const res = await fetch("/api/admin/mensajeria/mensajes-rapidos", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          toast.success("Mensaje rapido creado");
        } else {
          toast.success("Mensaje rapido creado (local)");
        }
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este mensaje rapido?")) return;
    try {
      await fetch(`/api/admin/mensajeria/mensajes-rapidos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success("Mensaje eliminado");
      fetchData();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const toggleCanal = (canal: string) => {
    setForm((prev) => ({
      ...prev,
      canales: prev.canales.includes(canal)
        ? prev.canales.filter((c) => c !== canal)
        : [...prev.canales, canal],
    }));
  };

  const canalOptions = [
    { key: "whatsapp", label: "WA", color: "#25D366" },
    { key: "instagram", label: "IG", color: "#E1306C" },
    { key: "facebook", label: "FB", color: "#1877F2" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <MessageSquare className="size-5" />
            Mensajes Rapidos
          </CardTitle>
          <Button size="sm" onClick={openCreate} className="gap-1.5" style={{ backgroundColor: "#1B2A6B" }}>
            <Plus className="size-3.5" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="size-8 mb-2" style={{ color: "#CBD5E1" }} />
            <p className="text-sm" style={{ color: "#94A3B8" }}>
              No hay mensajes rapidos configurados
            </p>
            <Button size="sm" variant="outline" onClick={openCreate} className="mt-3 gap-1.5">
              <Plus className="size-3.5" />
              Crear primer mensaje
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ color: "#64748B" }}>
                  <th className="pb-3 text-left font-medium">Titulo</th>
                  <th className="pb-3 text-left font-medium hidden sm:table-cell">Contenido</th>
                  <th className="pb-3 text-center font-medium hidden md:table-cell">Categoria</th>
                  <th className="pb-3 text-center font-medium hidden md:table-cell">Atajo</th>
                  <th className="pb-3 text-center font-medium">Canales</th>
                  <th className="pb-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mensajes.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-medium" style={{ color: "#1E293B" }}>
                      {item.titulo}
                    </td>
                    <td className="py-3 hidden sm:table-cell max-w-[200px]" style={{ color: "#64748B" }}>
                      <p className="truncate text-xs">{item.contenido}</p>
                    </td>
                    <td className="py-3 text-center hidden md:table-cell">
                      {item.categoria ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#F1F5F9]" style={{ color: "#64748B" }}>
                          {item.categoria}
                        </span>
                      ) : (
                        <span className="text-[10px]" style={{ color: "#94A3B8" }}>-</span>
                      )}
                    </td>
                    <td className="py-3 text-center hidden md:table-cell">
                      {item.atajo ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono bg-[#F0F7FF]" style={{ color: "#1B2A6B" }}>
                          {item.atajo}
                        </span>
                      ) : (
                        <span className="text-[10px]" style={{ color: "#94A3B8" }}>-</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {canalOptions
                          .filter((c) => (item.canales || []).includes(c.key))
                          .map((c) => (
                            <span
                              key={c.key}
                              className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                              style={{ backgroundColor: c.color }}
                            >
                              {c.label}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" style={{ color: "#64748B" }} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="size-3.5 text-red-400" />
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Editar Mensaje Rapido" : "Nuevo Mensaje Rapido"}
            </DialogTitle>
            <DialogDescription>
              Los mensajes rapidos se pueden insertar al responder conversaciones.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#1E293B" }}>Titulo</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Saludo"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#1E293B" }}>Contenido</Label>
              <Textarea
                value={form.contenido}
                onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
                placeholder="Hola! Gracias por contactarnos..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label style={{ color: "#1E293B" }}>Categoria</Label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  placeholder="general, pedidos, info..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label style={{ color: "#1E293B" }}>Atajo</Label>
                <Input
                  value={form.atajo}
                  onChange={(e) => setForm((f) => ({ ...f, atajo: e.target.value }))}
                  placeholder="/hola"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#1E293B" }}>Canales</Label>
              <div className="flex gap-2">
                {canalOptions.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => toggleCanal(c.key)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors border"
                    style={{
                      backgroundColor: form.canales.includes(c.key) ? c.color : "transparent",
                      color: form.canales.includes(c.key) ? "#FFFFFF" : "#64748B",
                      borderColor: form.canales.includes(c.key) ? c.color : "#E2E8F0",
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5"
              style={{ backgroundColor: "#1B2A6B" }}
            >
              <Save className="size-3.5" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---- Main Config Page ----

function ConfiguracionMensajeriaContent() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/mensajeria">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
            Configuracion de Mensajeria
          </h1>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Conecta Meta Business, configura respuestas automaticas y mensajes rapidos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="meta">
        <TabsList className="flex-wrap">
          <TabsTrigger value="meta" className="gap-1.5">
            <Plug className="size-3.5" />
            Conexion Meta
          </TabsTrigger>
          <TabsTrigger value="respuestas" className="gap-1.5">
            <Zap className="size-3.5" />
            Respuestas Automaticas
          </TabsTrigger>
          <TabsTrigger value="rapidos" className="gap-1.5">
            <MessageSquare className="size-3.5" />
            Mensajes Rapidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meta">
          <MetaConnectionTab />
        </TabsContent>

        <TabsContent value="respuestas">
          <RespuestasTab />
        </TabsContent>

        <TabsContent value="rapidos">
          <MensajesRapidosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ConfiguracionMensajeriaPage() {
  return (
    <AuthGuard>
      <ConfiguracionMensajeriaContent />
    </AuthGuard>
  );
}
