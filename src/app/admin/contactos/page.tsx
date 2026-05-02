"use client";

import { useEffect, useState } from "react";
import { Users, Search, MessageCircle, ShoppingBag, FileText, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { formatCLP } from "@/lib/format";
import type { Pedido, Formulario } from "@/lib/types";

interface Contacto {
  nombre: string;
  email: string;
  telefono: string | null;
  pedidos_count: number;
  formularios_count: number;
  ultimo_contacto: string;
}

function ContactModal({
  contacto,
  onClose,
}: {
  contacto: Contacto;
  onClose: () => void;
}) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [pedRes, formRes] = await Promise.all([
        fetch(`/api/admin/pedidos?search=${encodeURIComponent(contacto.email)}&limit=50`),
        fetch(`/api/formularios?search=${encodeURIComponent(contacto.email)}&limit=50`),
      ]);
      const pedData = await pedRes.json();
      const formData = await formRes.json();
      setPedidos(pedData.data || []);
      setFormularios(formData.data || []);
      setLoading(false);
    }
    load();
  }, [contacto.email]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#1E293B" }}>{contacto.nombre}</h2>
            <p className="text-sm" style={{ color: "#64748B" }}>{contacto.email} {contacto.telefono ? `· ${contacto.telefono}` : ""}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <>
              {/* Pedidos */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "#1B2A6B" }}>
                  <ShoppingBag className="size-4" />
                  Pedidos ({pedidos.length})
                </h3>
                {pedidos.length === 0 ? (
                  <p className="text-sm" style={{ color: "#64748B" }}>Sin pedidos</p>
                ) : (
                  <div className="space-y-2">
                    {pedidos.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <span className="text-sm font-medium" style={{ color: "#1E293B" }}>#{p.numero_pedido}</span>
                          <span className="ml-2 text-xs" style={{ color: "#64748B" }}>
                            {new Date(p.created_at).toLocaleDateString("es-CL")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatCLP(p.total)}</span>
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: p.estado === "entregado" ? "#10B98120" : p.estado === "cancelado" ? "#EF444420" : "#00B4D820",
                              color: p.estado === "entregado" ? "#10B981" : p.estado === "cancelado" ? "#EF4444" : "#00B4D8",
                            }}
                          >
                            {p.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formularios */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "#E91E8C" }}>
                  <FileText className="size-4" />
                  Formularios ({formularios.length})
                </h3>
                {formularios.length === 0 ? (
                  <p className="text-sm" style={{ color: "#64748B" }}>Sin formularios</p>
                ) : (
                  <div className="space-y-2">
                    {formularios.map((f) => (
                      <div key={f.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <span className="text-sm font-medium" style={{ color: "#1E293B" }}>{f.nombre}</span>
                          <span className="ml-2 text-xs" style={{ color: "#64748B" }}>
                            {new Date(f.created_at).toLocaleDateString("es-CL")}
                          </span>
                        </div>
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: f.estado === "completado" ? "#10B98120" : f.estado === "revisado" ? "#FFD10020" : "#00B4D820",
                            color: f.estado === "completado" ? "#10B981" : f.estado === "revisado" ? "#B8860B" : "#00B4D8",
                          }}
                        >
                          {f.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactosContent() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedContacto, setSelectedContacto] = useState<Contacto | null>(null);

  const fetchContactos = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    const res = await fetch(`/api/admin/contactos?${params}`);
    const data = await res.json();
    setContactos(data);
    setLoading(false);
  };

  useEffect(() => { fetchContactos(); }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const openWhatsApp = (contacto: Contacto) => {
    const phone = (contacto.telefono || "").replace(/\D/g, "");
    if (!phone) return;
    const msg = `Hola ${contacto.nombre}, te contactamos desde PrintUp.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Contactos</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Clientes de pedidos y formularios ({contactos.length} contactos)
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <Users className="size-5" />
            Lista de Contactos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : contactos.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>No hay contactos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ color: "#64748B" }}>
                    <th className="pb-3 text-left font-medium">Nombre</th>
                    <th className="hidden pb-3 text-left font-medium sm:table-cell">Email</th>
                    <th className="hidden pb-3 text-left font-medium md:table-cell">Telefono</th>
                    <th className="pb-3 text-center font-medium">Pedidos</th>
                    <th className="hidden pb-3 text-center font-medium sm:table-cell">Formularios</th>
                    <th className="pb-3 text-center font-medium">Ultimo</th>
                    <th className="pb-3 text-center font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {contactos.map((c) => (
                    <tr
                      key={c.email}
                      className="cursor-pointer border-b last:border-0 hover:bg-gray-50"
                      onClick={() => setSelectedContacto(c)}
                    >
                      <td className="py-3">
                        <div className="font-medium" style={{ color: "#1E293B" }}>{c.nombre}</div>
                        <div className="text-xs sm:hidden" style={{ color: "#64748B" }}>{c.email}</div>
                      </td>
                      <td className="hidden py-3 sm:table-cell" style={{ color: "#64748B" }}>{c.email}</td>
                      <td className="hidden py-3 md:table-cell" style={{ color: "#64748B" }}>{c.telefono || "—"}</td>
                      <td className="py-3 text-center">
                        {c.pedidos_count > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "#1B2A6B20", color: "#1B2A6B" }}>
                            <ShoppingBag className="size-3" />
                            {c.pedidos_count}
                          </span>
                        )}
                      </td>
                      <td className="hidden py-3 text-center sm:table-cell">
                        {c.formularios_count > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "#00B4D820", color: "#00B4D8" }}>
                            <FileText className="size-3" />
                            {c.formularios_count}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center text-xs" style={{ color: "#64748B" }}>
                        {new Date(c.ultimo_contacto).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {c.telefono && (
                          <Button variant="ghost" size="sm" onClick={() => openWhatsApp(c)} title="Enviar WhatsApp">
                            <MessageCircle className="size-4 text-green-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact detail modal */}
      {selectedContacto && (
        <ContactModal
          contacto={selectedContacto}
          onClose={() => setSelectedContacto(null)}
        />
      )}
    </div>
  );
}

export default function ContactosPage() {
  return (
    <AuthGuard>
      <ContactosContent />
    </AuthGuard>
  );
}
