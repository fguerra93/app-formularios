"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * Crear un pedido grupal de generación: el delegado elige el producto
 * (viene por ?producto=slug desde la ficha), define curso/meta/fecha y
 * recibe el link para compartir por WhatsApp.
 */
function CrearGrupoContent() {
  const searchParams = useSearchParams();
  const productoSlug = searchParams.get("producto") || "";

  const [productoNombre, setProductoNombre] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [organizador, setOrganizador] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [meta, setMeta] = useState(30);
  const [fechaLimite, setFechaLimite] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ codigo: string; link: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!productoSlug) return;
    fetch(`/api/productos/${productoSlug}`)
      .then((r) => r.json())
      .then((d) => setProductoNombre(d?.nombre || null))
      .catch(() => setProductoNombre(null));
  }, [productoSlug]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSlug) {
      toast.error("Falta el producto: entra desde la ficha del producto");
      return;
    }
    if (nombre.trim().length < 3 || organizador.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Completa curso, tu nombre y un email válido");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_slug: productoSlug,
          nombre: nombre.trim(),
          organizador_nombre: organizador.trim(),
          organizador_email: email.trim(),
          organizador_telefono: telefono.trim() || null,
          meta_unidades: meta,
          fecha_limite: fechaLimite || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.link) {
        setResultado(data);
      } else {
        toast.error(data.error || "No pudimos crear el grupo");
      }
    } catch {
      toast.error("Error de conexión");
    }
    setEnviando(false);
  };

  const copiar = () => {
    if (!resultado) return;
    navigator.clipboard?.writeText(resultado.link).then(() => {
      setCopiado(true);
      toast.success("Link copiado");
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  if (resultado) {
    const msg = encodeURIComponent(
      `¡Hola! Armé el pedido grupal "${nombre}" en PrintUp. Cada uno elige su talla y paga lo suyo aquí: ${resultado.link}`,
    );
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="mc-eyebrow mb-2">Grupo creado</p>
        <h1 className="mc-display text-3xl mb-3">Listo. Ahora compártelo.</h1>
        <p className="mc-sub mb-8">
          Cada apoderado entra al link, elige talla, pone el nombre del estampado y paga su parte.
          Tú solo miras cómo avanza la barra.
        </p>
        <div className="mc-tech text-sm rounded-xl border px-4 py-3 mb-4 break-all" style={{ borderColor: "var(--mc-line-2)", background: "var(--mc-surface)" }}>
          {resultado.link}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={copiar} className="mc-btn mc-btn-ghost gap-2">
            {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copiar link
          </button>
          <a
            href={`https://wa.me/?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mc-btn mc-btn-primary"
          >
            Compartir por WhatsApp
          </a>
        </div>
        <p className="mt-6 text-sm">
          <Link href={`/grupal/${resultado.codigo}`} className="mc-link">Ver la página del grupo →</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <p className="mc-eyebrow mb-2">Pedido grupal de generación</p>
      <h1 className="mc-display text-3xl md:text-4xl mb-3">Junta al curso sin juntar la plata.</h1>
      <p className="mc-sub mb-2">
        Crea el grupo, comparte un link y cada apoderado paga lo suyo con Webpay.
        Producimos cuando se completa la meta.
      </p>
      {productoNombre && (
        <p className="mc-tech text-[12px] uppercase tracking-[0.08em] mb-6" style={{ color: "var(--mc-ink-2)" }}>
          Producto: {productoNombre}
        </p>
      )}

      <form onSubmit={crear} className="space-y-4 mt-6">
        <div>
          <label htmlFor="c-nombre" className="mc-label">Nombre del curso o grupo *</label>
          <input id="c-nombre" className="mc-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder='ej. "4°B Colegio San José — Generación 2026"' />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="c-org" className="mc-label">Tu nombre (organizador/a) *</label>
            <input id="c-org" className="mc-input" value={organizador} onChange={(e) => setOrganizador(e.target.value)} />
          </div>
          <div>
            <label htmlFor="c-email" className="mc-label">Tu email *</label>
            <input id="c-email" type="email" className="mc-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="c-fono" className="mc-label">Teléfono</label>
            <input id="c-fono" className="mc-input" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9…" />
          </div>
          <div>
            <label htmlFor="c-meta" className="mc-label">Meta (unidades) *</label>
            <input id="c-meta" type="number" min={2} max={500} className="mc-input mc-tech" value={meta} onChange={(e) => setMeta(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="c-fecha" className="mc-label">Fecha límite</label>
            <input id="c-fecha" type="date" className="mc-input mc-tech" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={enviando} className="mc-btn mc-btn-primary w-full">
          {enviando ? <><Loader2 className="size-4 animate-spin" /> Creando…</> : "Crear grupo y obtener link"}
        </button>
      </form>
    </div>
  );
}

export default function CrearGrupoPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center"><Loader2 className="size-8 mx-auto animate-spin" /></div>}>
      <CrearGrupoContent />
    </Suspense>
  );
}
