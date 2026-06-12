"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Users, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatCLP } from "@/lib/format";

interface GrupoData {
  codigo: string;
  nombre: string;
  organizador: string;
  meta_unidades: number;
  fecha_limite: string | null;
  estado: string;
  abierto: boolean;
  notas: string | null;
  progreso: {
    unidades: number;
    recaudado: number;
    participantes: { nombre: string; talla: string | null; estampado: string | null }[];
  };
  producto: {
    nombre: string;
    slug: string;
    imagen: string | null;
    precio: number;
    variantes: { nombre: string; opciones: { valor: string; precio_extra: number }[] }[];
  } | null;
}

/**
 * Landing pública del pedido grupal de generación: progreso del curso,
 * quiénes ya pagaron, y el formulario para sumarse pagando SU parte.
 */
export default function GrupalPage() {
  const params = useParams();
  const codigo = String(params.codigo || "");
  const [grupo, setGrupo] = useState<GrupoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [talla, setTalla] = useState("");
  const [estampado, setEstampado] = useState("");

  useEffect(() => {
    fetch(`/api/grupos/${codigo}`)
      .then((r) => r.json())
      .then((data) => setGrupo(data.error ? null : data))
      .catch(() => setGrupo(null))
      .finally(() => setLoading(false));
  }, [codigo]);

  const tallas =
    grupo?.producto?.variantes?.find((v) => /talla/i.test(v.nombre))?.opciones ?? [];

  const unirse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Nombre y email válido son obligatorios");
      return;
    }
    if (tallas.length > 0 && !talla) {
      toast.error("Elige la talla");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/grupos/${codigo}/unirse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim() || null,
          talla: talla || null,
          nombre_estampado: estampado.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url && data.token) {
        window.location.assign(`${data.url}?token_ws=${data.token}`);
        return;
      }
      toast.error(data.error || "No pudimos procesar tu aporte");
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    }
    setEnviando(false);
  };

  const compartir = () => {
    const link = window.location.href;
    navigator.clipboard?.writeText(link).then(() => toast.success("Link copiado"));
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <Loader2 className="size-8 mx-auto animate-spin" style={{ color: "var(--mc-ink-2)" }} />
      </div>
    );
  }

  if (!grupo || !grupo.producto) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="mc-h2 mb-3">Grupo no encontrado</h1>
        <p className="mc-sub mb-8">Revisa el link con quien organiza el pedido, o crea uno nuevo.</p>
        <Link href="/productos" className="mc-btn mc-btn-primary">Ver catálogo</Link>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((grupo.progreso.unidades / grupo.meta_unidades) * 100));
  const completado = grupo.estado === "completado";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
      {/* Encabezado del grupo */}
      <div className="mb-8">
        <p className="mc-eyebrow mb-2">Pedido grupal de generación</p>
        <h1 className="mc-display text-3xl md:text-4xl mb-2">{grupo.nombre}</h1>
        <p className="mc-sub">
          Organiza <strong style={{ color: "var(--mc-ink)" }}>{grupo.organizador}</strong>
          {grupo.fecha_limite && <> · cierra el <strong style={{ color: "var(--mc-ink)" }}>{new Date(grupo.fecha_limite + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long" })}</strong></>}
          {" "}· cada persona paga lo suyo, sin juntar plata.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
        {/* Producto + progreso */}
        <div className="rounded-2xl border p-6" style={{ borderColor: "var(--mc-line)" }}>
          <div className="flex gap-5 items-start mb-6">
            {grupo.producto.imagen && (
              <img
                src={grupo.producto.imagen}
                alt={grupo.producto.nombre}
                className="size-24 object-cover rounded-xl border"
                style={{ borderColor: "var(--mc-line)" }}
              />
            )}
            <div>
              <h2 className="font-semibold text-lg" style={{ color: "var(--mc-ink)" }}>{grupo.producto.nombre}</h2>
              <p className="mc-tech text-2xl font-bold mt-1" style={{ color: "var(--mc-ink)" }}>
                {formatCLP(grupo.producto.precio)}
                <span className="text-sm font-medium" style={{ color: "var(--mc-ink-2)" }}> por persona · IVA incluido</span>
              </p>
            </div>
          </div>

          {/* Progreso */}
          <div className="mb-5">
            <div className="flex items-baseline justify-between mb-2">
              <span className="mc-tech text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--mc-ink-2)" }}>
                Progreso del curso
              </span>
              <span className="mc-tech text-sm font-bold" style={{ color: "var(--mc-ink)" }}>
                {grupo.progreso.unidades} / {grupo.meta_unidades}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--mc-surface)", border: "1px solid var(--mc-line)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: completado ? "#10b981" : "var(--mc-ink)" }}
              />
            </div>
            {completado && (
              <p className="text-sm mt-2 font-medium" style={{ color: "#059669" }}>
                ¡Meta completada! El pedido entra a producción. Los rezagados aún alcanzan.
              </p>
            )}
          </div>

          {/* Participantes */}
          <p className="mc-tech text-[11px] uppercase tracking-[0.12em] mb-2" style={{ color: "var(--mc-ink-2)" }}>
            Ya están adentro ({grupo.progreso.participantes.length})
          </p>
          {grupo.progreso.participantes.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--mc-ink-2)" }}>Sé la primera persona en sumarte.</p>
          ) : (
            <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-2">
              {grupo.progreso.participantes.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--mc-ink)" }}>
                  <Check className="size-3.5 shrink-0" style={{ color: "#10b981" }} />
                  <span className="truncate">{p.nombre.split(" ")[0]}</span>
                  {p.estampado && <span className="mc-tech text-xs" style={{ color: "var(--mc-ink-2)" }}>“{p.estampado}”</span>}
                  {p.talla && <span className="mc-tech text-xs ml-auto" style={{ color: "var(--mc-ink-3)" }}>{p.talla}</span>}
                </li>
              ))}
            </ul>
          )}

          <button onClick={compartir} className="mc-btn mc-btn-ghost w-full mt-5 gap-2">
            <Share2 className="size-4" />
            Copiar link para compartir al curso
          </button>
        </div>

        {/* Formulario de aporte */}
        <div className="rounded-2xl border p-6" style={{ borderColor: "var(--mc-line)", background: "var(--mc-surface)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="size-4" style={{ color: "var(--mc-accent-ink)" }} />
            <h2 className="font-semibold" style={{ color: "var(--mc-ink)" }}>Súmate y paga tu parte</h2>
          </div>

          {!grupo.abierto ? (
            <p className="text-sm" style={{ color: "var(--mc-ink-2)" }}>
              Este grupo ya no acepta aportes. Habla con {grupo.organizador} o escríbenos por WhatsApp.
            </p>
          ) : (
            <form onSubmit={unirse} className="space-y-4">
              <div>
                <label htmlFor="g-nombre" className="mc-label">Tu nombre (apoderado/a) *</label>
                <input id="g-nombre" className="mc-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="María Pérez" />
              </div>
              <div>
                <label htmlFor="g-email" className="mc-label">Tu email *</label>
                <input id="g-email" type="email" className="mc-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {tallas.length > 0 && (
                  <div>
                    <label htmlFor="g-talla" className="mc-label">Talla *</label>
                    <select id="g-talla" className="mc-select" value={talla} onChange={(e) => setTalla(e.target.value)}>
                      <option value="">Elegir…</option>
                      {tallas.map((t) => (
                        <option key={t.valor} value={t.valor}>
                          {t.valor}{t.precio_extra > 0 ? ` (+${formatCLP(t.precio_extra)})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={tallas.length === 0 ? "col-span-2" : ""}>
                  <label htmlFor="g-fono" className="mc-label">Teléfono</label>
                  <input id="g-fono" className="mc-input" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9…" />
                </div>
              </div>
              <div>
                <label htmlFor="g-estampado" className="mc-label">Nombre para el estampado</label>
                <input
                  id="g-estampado"
                  className="mc-input"
                  value={estampado}
                  onChange={(e) => setEstampado(e.target.value)}
                  maxLength={40}
                  placeholder='ej. "Vale" o "Los Pérez"'
                />
              </div>

              <button type="submit" disabled={enviando} className="mc-btn mc-btn-primary w-full">
                {enviando ? (
                  <><Loader2 className="size-4 animate-spin" /> Procesando…</>
                ) : (
                  <>Pagar mi parte con Webpay</>
                )}
              </button>
              <p className="text-[12px] text-center" style={{ color: "var(--mc-ink-3)" }}>
                Pago individual y seguro vía Transbank. Te llega comprobante al correo.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
