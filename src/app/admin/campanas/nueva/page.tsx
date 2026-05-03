"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Send,
  Mail,
  Users,
  LayoutTemplate,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

interface Template {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  thumbnail_url: string | null;
  es_preset: boolean;
}

const steps = [
  { label: "Nombre + Asunto", icon: Mail },
  { label: "Segmento", icon: Users },
  { label: "Template", icon: LayoutTemplate },
  { label: "Preview + Enviar", icon: Send },
];

type SegmentoTipo = "todos" | "clientes" | "personalizada";

function NuevaCampanaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep] = useState(0);
  const [campanaId, setCampanaId] = useState<string | null>(editId);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Step 1
  const [nombre, setNombre] = useState("");
  const [asunto, setAsunto] = useState("");

  // Step 2
  const [segmentoTipo, setSegmentoTipo] = useState<SegmentoTipo>("todos");
  const [emailsPersonalizados, setEmailsPersonalizados] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Step 3
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Step 4
  const [previewHtml, setPreviewHtml] = useState("");
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // Load existing campaign if editing
  useEffect(() => {
    if (editId) {
      fetch(`/api/admin/campanas/${editId}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setNombre(data.nombre || "");
          setAsunto(data.asunto || "");
          if (data.segmento) {
            setSegmentoTipo(data.segmento.tipo || "todos");
            setEmailsPersonalizados(data.segmento.emails?.join(", ") || "");
          }
          if (data.template_id) {
            setSelectedTemplate(data.template_id);
          }
        })
        .catch(() => toast.error("Error al cargar campana"));
    }
  }, [editId]);

  // Fetch segment preview
  const fetchSegmentPreview = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const params = new URLSearchParams({ tipo: segmentoTipo });
      if (segmentoTipo === "personalizada" && emailsPersonalizados.trim()) {
        params.set("emails", emailsPersonalizados.trim());
      }
      const res = await fetch(`/api/admin/campanas/segmentos/preview?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      setPreviewCount(data.count ?? 0);
    } catch {
      setPreviewCount(null);
    }
    setLoadingPreview(false);
  }, [segmentoTipo, emailsPersonalizados]);

  useEffect(() => {
    if (step === 1) {
      fetchSegmentPreview();
    }
  }, [step, segmentoTipo, fetchSegmentPreview]);

  // Fetch templates
  useEffect(() => {
    if (step === 2) {
      setLoadingTemplates(true);
      fetch("/api/admin/campanas/templates", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setTemplates(Array.isArray(data) ? data : data.data || []);
        })
        .catch(() => toast.error("Error al cargar templates"))
        .finally(() => setLoadingTemplates(false));
    }
  }, [step]);

  // Fetch preview HTML when entering step 4
  useEffect(() => {
    if (step === 3 && campanaId && selectedTemplate) {
      fetch(`/api/admin/campanas/templates/${selectedTemplate}/render`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campana_id: campanaId }),
      })
        .then((res) => res.json())
        .then((data) => setPreviewHtml(data.html || ""))
        .catch(() => {});
    }
  }, [step, campanaId, selectedTemplate]);

  // Save campaign as borrador at step 1
  const saveCampana = async (extraData: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const body = {
        nombre,
        asunto,
        ...extraData,
      };

      if (campanaId) {
        const res = await fetch(`/api/admin/campanas/${campanaId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Error al actualizar");
      } else {
        const res = await fetch("/api/admin/campanas", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Error al crear");
        const data = await res.json();
        setCampanaId(data.id);
      }
    } catch {
      toast.error("Error al guardar campana");
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!nombre.trim()) {
        toast.error("El nombre es obligatorio");
        return;
      }
      if (!asunto.trim()) {
        toast.error("El asunto es obligatorio");
        return;
      }
      const ok = await saveCampana();
      if (!ok) return;
    }

    if (step === 1) {
      const segmento: Record<string, unknown> = { tipo: segmentoTipo };
      if (segmentoTipo === "personalizada") {
        const emails = emailsPersonalizados
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
        if (emails.length === 0) {
          toast.error("Ingresa al menos un email");
          return;
        }
        segmento.emails = emails;
      }
      const ok = await saveCampana({ segmento });
      if (!ok) return;
    }

    if (step === 2) {
      if (!selectedTemplate) {
        toast.error("Selecciona un template");
        return;
      }
      const ok = await saveCampana({ template_id: selectedTemplate });
      if (!ok) return;
    }

    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Ingresa un email");
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch(`/api/admin/campanas/${campanaId}/test`, {
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
        toast.error(data.error || "Error al enviar prueba");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSendingTest(false);
  };

  const handleSendCampaign = async () => {
    if (!confirm("Enviar la campana? Esta accion no se puede deshacer.")) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/campanas/${campanaId}/enviar`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Campana enviada exitosamente");
        router.push(`/admin/campanas/${campanaId}`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al enviar campana");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSending(false);
  };

  const segmentoOptions: { value: SegmentoTipo; label: string; desc: string }[] = [
    { value: "todos", label: "Todos los suscriptores", desc: "Enviar a toda la lista de suscriptores activos" },
    { value: "clientes", label: "Solo clientes", desc: "Enviar solo a usuarios que han realizado compras" },
    { value: "personalizada", label: "Lista personalizada", desc: "Ingresar emails manualmente" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/campanas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
            {editId ? "Editar Campana" : "Nueva Campana"}
          </h1>
          <p className="text-sm" style={{ color: "#64748B" }}>
            {steps[step].label}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors"
                  style={{
                    backgroundColor: isDone ? "#10B981" : isActive ? "#1B2A6B" : "#E2E8F0",
                    color: isDone || isActive ? "#FFFFFF" : "#94A3B8",
                  }}
                >
                  {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
                </div>
                <span
                  className="hidden text-xs font-medium sm:block truncate"
                  style={{ color: isActive ? "#1B2A6B" : "#94A3B8" }}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="h-0.5 flex-1 rounded-full"
                  style={{ backgroundColor: isDone ? "#10B981" : "#E2E8F0" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* ── Step 1: Nombre + Asunto ── */}
          {step === 0 && (
            <div className="max-w-lg space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Nombre de la campana
                </label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Promo Invierno 2026"
                />
                <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
                  Uso interno, no sera visible para los destinatarios.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Asunto del email
                </label>
                <Input
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Ej: Descuentos de hasta 50% en impresion"
                />
                <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
                  El asunto que veran los destinatarios en su bandeja de entrada.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Segmento ── */}
          {step === 1 && (
            <div className="max-w-lg space-y-5">
              <div className="space-y-3">
                {segmentoOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                      segmentoTipo === opt.value
                        ? "border-[#1B2A6B] bg-[#1B2A6B08]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="segmento"
                      value={opt.value}
                      checked={segmentoTipo === opt.value}
                      onChange={() => setSegmentoTipo(opt.value)}
                      className="mt-0.5 accent-[#1B2A6B]"
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>
                        {opt.label}
                      </p>
                      <p className="text-xs" style={{ color: "#64748B" }}>
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {segmentoTipo === "personalizada" && (
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                    Emails (separados por coma)
                  </label>
                  <textarea
                    value={emailsPersonalizados}
                    onChange={(e) => setEmailsPersonalizados(e.target.value)}
                    placeholder="email1@ejemplo.com, email2@ejemplo.com"
                    rows={4}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 font-mono text-sm"
                  />
                </div>
              )}

              <div
                className="flex items-center gap-2 rounded-lg p-3"
                style={{ backgroundColor: "#F1F5F9" }}
              >
                <Users className="size-5" style={{ color: "#1B2A6B" }} />
                <span className="text-sm" style={{ color: "#1E293B" }}>
                  Destinatarios estimados:{" "}
                  {loadingPreview ? (
                    <span style={{ color: "#94A3B8" }}>calculando...</span>
                  ) : (
                    <strong>{previewCount ?? 0}</strong>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ── Step 3: Template ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Selecciona un template
                </p>
                <Link href="/admin/campanas/editor/nuevo">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="size-4" />
                    Crear nuevo template
                  </Button>
                </Link>
              </div>

              {loadingTemplates ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <LayoutTemplate className="size-12" style={{ color: "#CBD5E1" }} />
                  <p className="text-sm" style={{ color: "#64748B" }}>
                    No hay templates disponibles. Crea uno primero.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`group cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                        selectedTemplate === t.id
                          ? "border-[#1B2A6B] ring-2 ring-[#1B2A6B]/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="flex h-32 items-center justify-center"
                        style={{
                          backgroundColor:
                            t.thumbnail_url
                              ? undefined
                              : selectedTemplate === t.id
                                ? "#1B2A6B10"
                                : "#F8FAFC",
                        }}
                      >
                        {t.thumbnail_url ? (
                          <img
                            src={t.thumbnail_url}
                            alt={t.nombre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <LayoutTemplate
                            className="size-10"
                            style={{ color: selectedTemplate === t.id ? "#1B2A6B" : "#CBD5E1" }}
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>
                          {t.nombre}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {t.categoria}
                          </span>
                          {t.es_preset && (
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              Preset
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedTemplate === t.id && (
                        <div className="flex items-center justify-center border-t p-2" style={{ backgroundColor: "#1B2A6B" }}>
                          <Check className="size-4 text-white" />
                          <span className="ml-1 text-xs font-medium text-white">Seleccionado</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Preview + Enviar ── */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Campaign Summary */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="text-sm font-bold" style={{ color: "#1E293B" }}>
                  Resumen de la campana
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span style={{ color: "#64748B" }}>Nombre:</span>{" "}
                    <strong style={{ color: "#1E293B" }}>{nombre}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Asunto:</span>{" "}
                    <strong style={{ color: "#1E293B" }}>{asunto}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Segmento:</span>{" "}
                    <strong style={{ color: "#1E293B" }}>
                      {segmentoTipo === "todos"
                        ? "Todos los suscriptores"
                        : segmentoTipo === "clientes"
                          ? "Solo clientes"
                          : "Lista personalizada"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Destinatarios:</span>{" "}
                    <strong style={{ color: "#1E293B" }}>{previewCount ?? "---"}</strong>
                  </div>
                </div>
              </div>

              {/* HTML Preview */}
              <div>
                <h3 className="mb-2 text-sm font-bold" style={{ color: "#1E293B" }}>
                  Vista previa del email
                </h3>
                <div className="mx-auto rounded-lg border bg-white" style={{ maxWidth: 600 }}>
                  {previewHtml ? (
                    <iframe
                      srcDoc={previewHtml}
                      className="h-[500px] w-full rounded-lg"
                      title="Preview"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center">
                      <p className="text-sm" style={{ color: "#94A3B8" }}>
                        Cargando preview...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowTestDialog(true)}
                >
                  <Mail className="size-4" />
                  Enviar email de prueba
                </Button>
                <Button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  style={{ backgroundColor: "#1B2A6B" }}
                  className="gap-2 text-white hover:opacity-90"
                >
                  <Send className="size-4" />
                  {sending ? "Enviando..." : "Enviar Campana"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {step < 3 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={saving}
            style={{ backgroundColor: "#1B2A6B" }}
            className="gap-2 text-white hover:opacity-90"
          >
            {saving ? "Guardando..." : "Siguiente"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="size-4" />
            Anterior
          </Button>
        </div>
      )}

      {/* Test Email Dialog */}
      {showTestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setShowTestDialog(false)}
          />
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
                  Email de prueba
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

export default function NuevaCampanaPage() {
  return (
    <AuthGuard>
      <NuevaCampanaContent />
    </AuthGuard>
  );
}
