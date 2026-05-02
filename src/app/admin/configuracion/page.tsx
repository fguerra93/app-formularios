"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Eye, EyeOff, Plug, Mail, Server, Settings, Store, CreditCard, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthGuard } from "@/components/admin/auth-guard";
import type { StatsResponse } from "@/lib/types";

interface ConfigValues {
  // Email
  email_provider: string;
  email_api_key: string;
  email_from_address: string;
  email_from_name: string;
  // Nextcloud
  nextcloud_url: string;
  nextcloud_user: string;
  nextcloud_password: string;
  nextcloud_folder: string;
  // General
  notification_email: string;
  max_files: string;
  max_file_size_mb: string;
  // Tienda
  tienda_nombre: string;
  tienda_slogan: string;
  tienda_logo_url: string;
  tienda_redes_instagram: string;
  tienda_redes_facebook: string;
  tienda_redes_tiktok: string;
  // Pagos
  mercadopago_access_token: string;
  mercadopago_public_key: string;
  transferencia_banco: string;
  transferencia_tipo_cuenta: string;
  transferencia_numero: string;
  transferencia_titular: string;
  transferencia_rut: string;
  transferencia_email: string;
  // WhatsApp
  whatsapp_numero: string;
  whatsapp_mensaje: string;
  whatsapp_boton_activo: string;
}

const defaultConfig: ConfigValues = {
  email_provider: "resend",
  email_api_key: "",
  email_from_address: "",
  email_from_name: "",
  nextcloud_url: "",
  nextcloud_user: "",
  nextcloud_password: "",
  nextcloud_folder: "",
  notification_email: "guerrafelipe93@gmail.com",
  max_files: "5",
  max_file_size_mb: "10",
  tienda_nombre: "PrintUp",
  tienda_slogan: "Tu impresion, nuestra huella",
  tienda_logo_url: "",
  tienda_redes_instagram: "",
  tienda_redes_facebook: "",
  tienda_redes_tiktok: "",
  mercadopago_access_token: "",
  mercadopago_public_key: "",
  transferencia_banco: "",
  transferencia_tipo_cuenta: "",
  transferencia_numero: "",
  transferencia_titular: "Servicios Graficos Spa",
  transferencia_rut: "78.114.353-7",
  transferencia_email: "",
  whatsapp_numero: "56966126645",
  whatsapp_mensaje: "Hola! Me interesa conocer mas sobre sus servicios de impresion.",
  whatsapp_boton_activo: "true",
};

function ConfigContent() {
  const [config, setConfig] = useState<ConfigValues>(defaultConfig);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [configRes, statsRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/stats"),
        ]);
        const configData = await configRes.json();
        const statsData: StatsResponse = await statsRes.json();

        // configData can be an array of { clave, valor } or an object
        const configMap: Record<string, string> = {};
        if (Array.isArray(configData)) {
          configData.forEach((item: { clave: string; valor: string }) => {
            configMap[item.clave] = item.valor;
          });
        } else if (configData && typeof configData === "object") {
          Object.assign(configMap, configData);
        }

        setConfig({
          ...defaultConfig,
          ...configMap,
        });
        setStats(statsData);
      } catch (err) {
        console.error("Error loading config:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(config).map(([clave, valor]) => ({
        clave,
        valor,
      }));
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
      });
      if (res.ok) {
        toast.success("Configuracion guardada correctamente");
      } else {
        toast.error("Error al guardar la configuracion");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof ConfigValues, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const emailsUsedToday = stats ? 100 - stats.emails_restantes_dia : 0;
  const emailsUsedMonth = stats ? 3000 - stats.emails_restantes_mes : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
          Configuracion
        </h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Ajustes del sistema y servicios externos
        </p>
      </div>

      <Tabs defaultValue="tienda">
        <TabsList className="flex-wrap">
          <TabsTrigger value="tienda" className="gap-1.5">
            <Store className="size-3.5" />
            Tienda
          </TabsTrigger>
          <TabsTrigger value="pagos" className="gap-1.5">
            <CreditCard className="size-3.5" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5">
            <MessageCircle className="size-3.5" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="size-3.5" />
            Email
          </TabsTrigger>
          <TabsTrigger value="nextcloud" className="gap-1.5">
            <Server className="size-3.5" />
            Nextcloud
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5">
            <Settings className="size-3.5" />
            General
          </TabsTrigger>
        </TabsList>

        {/* Tienda Tab */}
        <TabsContent value="tienda">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
                <Store className="size-5" />
                Configuracion de Tienda
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Nombre de la Tienda</Label>
                  <Input
                    value={config.tienda_nombre}
                    onChange={(e) => updateField("tienda_nombre", e.target.value)}
                    placeholder="PrintUp"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Slogan</Label>
                  <Input
                    value={config.tienda_slogan}
                    onChange={(e) => updateField("tienda_slogan", e.target.value)}
                    placeholder="Tu impresion, nuestra huella"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label style={{ color: "#1E293B" }}>URL del Logo</Label>
                  <Input
                    value={config.tienda_logo_url}
                    onChange={(e) => updateField("tienda_logo_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <Separator />
              <h3 className="text-sm font-medium" style={{ color: "#1E293B" }}>Redes Sociales</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Instagram</Label>
                  <Input
                    value={config.tienda_redes_instagram}
                    onChange={(e) => updateField("tienda_redes_instagram", e.target.value)}
                    placeholder="@printup.cl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Facebook</Label>
                  <Input
                    value={config.tienda_redes_facebook}
                    onChange={(e) => updateField("tienda_redes_facebook", e.target.value)}
                    placeholder="printup.cl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>TikTok</Label>
                  <Input
                    value={config.tienda_redes_tiktok}
                    onChange={(e) => updateField("tienda_redes_tiktok", e.target.value)}
                    placeholder="@printup.cl"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2" style={{ backgroundColor: "#1B2A6B" }}>
                  <Save className="size-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagos Tab */}
        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
                <CreditCard className="size-5" />
                Configuracion de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <h3 className="text-sm font-medium" style={{ color: "#1E293B" }}>MercadoPago</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Access Token</Label>
                  <Input
                    type="password"
                    value={config.mercadopago_access_token}
                    onChange={(e) => updateField("mercadopago_access_token", e.target.value)}
                    placeholder="APP_USR-..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Public Key</Label>
                  <Input
                    value={config.mercadopago_public_key}
                    onChange={(e) => updateField("mercadopago_public_key", e.target.value)}
                    placeholder="APP_USR-..."
                  />
                </div>
              </div>
              <Separator />
              <h3 className="text-sm font-medium" style={{ color: "#1E293B" }}>Datos para Transferencia Bancaria</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Banco</Label>
                  <Input
                    value={config.transferencia_banco}
                    onChange={(e) => updateField("transferencia_banco", e.target.value)}
                    placeholder="Banco Estado"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Tipo de Cuenta</Label>
                  <Input
                    value={config.transferencia_tipo_cuenta}
                    onChange={(e) => updateField("transferencia_tipo_cuenta", e.target.value)}
                    placeholder="Cuenta Corriente"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Numero de Cuenta</Label>
                  <Input
                    value={config.transferencia_numero}
                    onChange={(e) => updateField("transferencia_numero", e.target.value)}
                    placeholder="12345678"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Titular</Label>
                  <Input
                    value={config.transferencia_titular}
                    onChange={(e) => updateField("transferencia_titular", e.target.value)}
                    placeholder="Servicios Graficos Spa"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>RUT</Label>
                  <Input
                    value={config.transferencia_rut}
                    onChange={(e) => updateField("transferencia_rut", e.target.value)}
                    placeholder="78.114.353-7"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Email para Comprobantes</Label>
                  <Input
                    type="email"
                    value={config.transferencia_email}
                    onChange={(e) => updateField("transferencia_email", e.target.value)}
                    placeholder="pagos@printup.cl"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2" style={{ backgroundColor: "#1B2A6B" }}>
                  <Save className="size-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
                <MessageCircle className="size-5" />
                Configuracion de WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Numero WhatsApp</Label>
                  <Input
                    value={config.whatsapp_numero}
                    onChange={(e) => updateField("whatsapp_numero", e.target.value)}
                    placeholder="56966126645"
                  />
                  <p className="text-xs" style={{ color: "#64748B" }}>
                    Sin +, sin espacios. Ej: 56966126645
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Boton Flotante</Label>
                  <Select
                    value={config.whatsapp_boton_activo}
                    onValueChange={(val) => updateField("whatsapp_boton_activo", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activado</SelectItem>
                      <SelectItem value="false">Desactivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label style={{ color: "#1E293B" }}>Mensaje Predeterminado</Label>
                  <Input
                    value={config.whatsapp_mensaje}
                    onChange={(e) => updateField("whatsapp_mensaje", e.target.value)}
                    placeholder="Hola! Me interesa conocer mas..."
                  />
                  <p className="text-xs" style={{ color: "#64748B" }}>
                    Este mensaje se pre-llena al hacer click en el boton flotante de WhatsApp.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2" style={{ backgroundColor: "#1B2A6B" }}>
                  <Save className="size-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
                <Mail className="size-5" />
                Configuracion de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Proveedor</Label>
                  <Select
                    value={config.email_provider}
                    onValueChange={(val) => updateField("email_provider", val as string)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="brevo">Brevo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>API Key</Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={config.email_api_key}
                      onChange={(e) => updateField("email_api_key", e.target.value)}
                      placeholder="re_xxxxxxxx..."
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-gray-100"
                    >
                      {showApiKey ? (
                        <EyeOff className="size-4" style={{ color: "#64748B" }} />
                      ) : (
                        <Eye className="size-4" style={{ color: "#64748B" }} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>From Email</Label>
                  <Input
                    type="email"
                    value={config.email_from_address}
                    onChange={(e) => updateField("email_from_address", e.target.value)}
                    placeholder="noreply@printup.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>From Name</Label>
                  <Input
                    value={config.email_from_name}
                    onChange={(e) => updateField("email_from_name", e.target.value)}
                    placeholder="PrintUp"
                  />
                </div>
              </div>

              <Separator />

              {/* Usage */}
              <div>
                <h3 className="mb-3 text-sm font-medium" style={{ color: "#1E293B" }}>
                  Uso actual
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#64748B" }}>Emails hoy</span>
                      <span className="text-xs font-medium" style={{ color: "#1E293B" }}>{emailsUsedToday}/100</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((emailsUsedToday / 100) * 100, 100)}%`, backgroundColor: "#1B2A6B" }} />
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#64748B" }}>Emails este mes</span>
                      <span className="text-xs font-medium" style={{ color: "#1E293B" }}>{emailsUsedMonth}/3000</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((emailsUsedMonth / 3000) * 100, 100)}%`, backgroundColor: "#00B4D8" }} />
                    </div>
                  </div>
                </div>
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
        </TabsContent>

        {/* Nextcloud Tab */}
        <TabsContent value="nextcloud">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
                <Server className="size-5" />
                Nextcloud
                <Badge variant="outline" className="ml-2" style={{ borderColor: "#10B981", color: "#10B981" }}>
                  Activo
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>URL</Label>
                  <Input
                    value={config.nextcloud_url}
                    onChange={(e) => updateField("nextcloud_url", e.target.value)}
                    placeholder="https://printup.internos"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Usuario</Label>
                  <Input
                    value={config.nextcloud_user}
                    onChange={(e) => updateField("nextcloud_user", e.target.value)}
                    placeholder="bot-formularios"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Contrasena de App</Label>
                  <Input
                    type="password"
                    value={config.nextcloud_password}
                    onChange={(e) => updateField("nextcloud_password", e.target.value)}
                    placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>Carpeta Base</Label>
                  <Input
                    value={config.nextcloud_folder}
                    onChange={(e) => updateField("nextcloud_folder", e.target.value)}
                    placeholder="/PrintUp/Pedidos_Nuevos"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "#64748B" }}>
                  El worker sincroniza archivos cada 30 segundos desde Supabase a NextCloud.
                </p>
                <Button onClick={handleSave} disabled={saving} className="gap-2" style={{ backgroundColor: "#1B2A6B" }}>
                  <Save className="size-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
                <Settings className="size-5" />
                Configuracion General
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label style={{ color: "#1E293B" }}>
                    Email destino notificaciones
                  </Label>
                  <Input
                    type="email"
                    value={config.notification_email}
                    onChange={(e) => updateField("notification_email", e.target.value)}
                    placeholder="guerrafelipe93@gmail.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>
                    Max archivos por formulario
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={config.max_files}
                    onChange={(e) => updateField("max_files", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#1E293B" }}>
                    Max tamano por archivo (MB)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={config.max_file_size_mb}
                    onChange={(e) => updateField("max_file_size_mb", e.target.value)}
                  />
                </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <AuthGuard>
      <ConfigContent />
    </AuthGuard>
  );
}
