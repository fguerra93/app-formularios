"use client";

import { useState, useRef, useCallback } from "react";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";

interface FileItem {
  file: File;
  id: string;
}

export default function ContactoPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  const addFiles = useCallback((newFiles: File[]) => {
    const toAdd: FileItem[] = [];
    for (const f of newFiles) {
      if (f.size > MAX_FILE_SIZE) {
        alert(`"${f.name}" excede los 50 MB.`);
        continue;
      }
      toAdd.push({ file: f, id: crypto.randomUUID() });
    }
    setFiles((prev) => {
      const existing = new Set(prev.map((p) => `${p.file.name}_${p.file.size}`));
      const filtered = toAdd.filter((t) => !existing.has(`${t.file.name}_${t.file.size}`));
      const combined = [...prev, ...filtered];
      if (combined.length > MAX_FILES) {
        alert(`Maximo ${MAX_FILES} archivos permitidos.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
    setErrors((e) => ({ ...e, file: "" }));
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const fmtSize = (b: number) => {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(1) + " MB";
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const nombre = (document.getElementById("nombre") as HTMLInputElement).value.trim();
    const email = (document.getElementById("email") as HTMLInputElement).value.trim();
    if (!nombre || nombre.length < 2) errs.nombre = "Ingresa tu nombre";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Ingresa un email valido";
    if (files.length === 0) errs.file = "Selecciona al menos un archivo";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const nombre = (document.getElementById("nombre") as HTMLInputElement).value.trim();
    const email = (document.getElementById("email") as HTMLInputElement).value.trim();
    const telefono = (document.getElementById("telefono") as HTMLInputElement).value.trim();
    const material = (document.getElementById("material") as HTMLSelectElement).value;
    const mensaje = (document.getElementById("mensaje") as HTMLTextAreaElement).value.trim();

    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const safeName = nombre.replace(/[^a-zA-Z0-9]/g, "_");
      const folderName = `${dateStr}_${safeName}`;

      const archivos: { nombre: string; tamaño: number; tipo: string; url: string }[] = [];

      for (const f of files) {
        const urlRes = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: f.file.name,
            folderName,
            contentType: f.file.type,
          }),
        });

        if (!urlRes.ok) {
          alert(`Error preparando subida de "${f.file.name}".`);
          setLoading(false);
          return;
        }

        const { signedUrl, publicUrl } = await urlRes.json();

        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": f.file.type || "application/octet-stream" },
          body: f.file,
        });

        if (!uploadRes.ok) {
          alert(`Error subiendo "${f.file.name}". Intenta de nuevo.`);
          setLoading(false);
          return;
        }

        archivos.push({
          nombre: f.file.name,
          tamaño: f.file.size,
          tipo: f.file.type,
          url: publicUrl,
        });
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, telefono, material, mensaje, archivos, folderName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        alert(data.error || "Error al enviar");
      }
    } catch {
      alert("Error de conexion. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
          Contacto y Subida de Archivos
        </h1>
        <p className="text-[#64748B] max-w-xl mx-auto">
          Envia tu diseno y te confirmaremos recepcion a tu correo. Tambien puedes contactarnos por WhatsApp o email.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <h2 className="font-bold text-[#1E293B] mb-4">Informacion de Contacto</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
                  <Mail className="size-4 text-[#00B4D8]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Email</p>
                  <a href="mailto:contacto@printup.cl" className="text-sm text-[#00B4D8] hover:underline">
                    contacto@printup.cl
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
                  <Phone className="size-4 text-[#00B4D8]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">WhatsApp</p>
                  <a href="https://wa.me/56966126645" target="_blank" rel="noopener noreferrer" className="text-sm text-[#00B4D8] hover:underline">
                    +56 9 66126645
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
                  <Clock className="size-4 text-[#00B4D8]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Horario</p>
                  <p className="text-sm text-[#64748B]">Lunes a Viernes 9:00 - 18:00</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
                  <MapPin className="size-4 text-[#00B4D8]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Direccion</p>
                  <p className="text-sm text-[#64748B]">Errazuriz 09 / Francisco Lira 082</p>
                  <p className="text-sm text-[#64748B]">Donihue, Region de O&apos;Higgins</p>
                </div>
              </li>
            </ul>
          </div>

          <a
            href="https://wa.me/56966126645?text=Hola%2C%20necesito%20informacion"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg bg-[#25D366] text-white font-bold text-sm hover:bg-[#20BD5A] transition-colors"
          >
            <MessageCircle className="size-5" />
            Escribenos por WhatsApp
          </a>
        </div>

        {/* Upload form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 md:p-8">
            {!success ? (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className="text-xl font-bold text-[#1B2A6B] mb-1">Sube tu Archivo</h2>
                <p className="text-sm text-[#64748B] mb-6">
                  Adjunta tu diseno y te confirmaremos recepcion a tu correo.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-semibold text-[#1E293B] mb-1.5">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      placeholder="Ej: Maria Gonzalez"
                      autoComplete="name"
                      onChange={() => setErrors((e) => ({ ...e, nombre: "" }))}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-[#F7F8FC] outline-none transition-colors ${
                        errors.nombre ? "border-red-500" : "border-[#E2E8F0]"
                      } focus:border-[#00B4D8]`}
                    />
                    {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-[#1E293B] mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                      onChange={() => setErrors((e) => ({ ...e, email: "" }))}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-[#F7F8FC] outline-none transition-colors ${
                        errors.email ? "border-red-500" : "border-[#E2E8F0]"
                      } focus:border-[#00B4D8]`}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-semibold text-[#1E293B] mb-1.5">
                      Telefono (opcional)
                    </label>
                    <input
                      id="telefono"
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      autoComplete="tel"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm bg-[#F7F8FC] outline-none focus:border-[#00B4D8] transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="material" className="block text-sm font-semibold text-[#1E293B] mb-1.5">
                      Tipo de material
                    </label>
                    <select
                      id="material"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm bg-[#F7F8FC] outline-none focus:border-[#00B4D8] transition-colors"
                    >
                      <option value="">Selecciona una opcion</option>
                      <option value="vinilo">Vinilo adhesivo</option>
                      <option value="lona">Lona / Banner</option>
                      <option value="papel">Papel fotografico</option>
                      <option value="tela">Tela / Textil</option>
                      <option value="acrilico">Acrilico / PVC</option>
                      <option value="otro">Otro (especificar en mensaje)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="mensaje" className="block text-sm font-semibold text-[#1E293B] mb-1.5">
                    Mensaje o instrucciones
                  </label>
                  <textarea
                    id="mensaje"
                    placeholder="Ej: Necesito 2 copias en tamano 1m x 0.5m, acabado mate..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm bg-[#F7F8FC] outline-none resize-y focus:border-[#00B4D8] transition-colors"
                  />
                </div>

                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">
                    Archivos <span className="text-red-500">*</span>
                  </label>
                  <div
                    onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      files.length > 0
                        ? "border-green-400 bg-green-50/50"
                        : dragOver
                          ? "border-[#00B4D8] bg-[#00B4D8]/5"
                          : "border-[#E2E8F0] bg-[#F7F8FC] hover:border-[#00B4D8]"
                    }`}
                  >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#1B2A6B] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-[#1E293B]">Arrastra o selecciona tus archivos</p>
                    <p className="text-xs text-[#64748B] mt-1">PDF, JPG, PNG, AI, PSD — max. 50 MB, max. 5 archivos</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.ai,.psd,.tiff,.tif,.svg,.eps"
                      className="hidden"
                      onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }}
                    />
                  </div>

                  {files.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {files.map((f) => (
                        <li key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#F7F8FC] border border-[#E2E8F0] text-sm">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00B4D8] to-[#1B2A6B] flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1E293B] truncate">{f.file.name}</p>
                            <p className="text-xs text-[#64748B]">{fmtSize(f.file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                            className="text-[#64748B] hover:text-red-500 p-1"
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-[#1B2A6B] text-white font-bold text-sm hover:bg-[#152259] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  ENVIAR
                </button>
              </form>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={32} height={32}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#1B2A6B] mb-2">Archivo recibido!</h2>
                <p className="text-[#64748B]">
                  Te confirmaremos recepcion a tu correo.<br />
                  Si tienes dudas, escribenos por WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
