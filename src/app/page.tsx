"use client";

import { useState, useRef, useCallback } from "react";

interface FileItem {
  file: File;
  id: string;
}

export default function FormularioPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Ingresa un email válido";
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
      // 1. Upload files directly to Supabase Storage (bypasses Vercel 4.5MB limit)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const dateStr = new Date().toISOString().slice(0, 10);
      const safeName = nombre.replace(/[^a-zA-Z0-9]/g, "_");
      const folderName = `${dateStr}_${safeName}`;

      const archivos: { nombre: string; tamaño: number; tipo: string; url: string }[] = [];

      for (const f of files) {
        const filePath = `${folderName}/${f.file.name}`;
        const uploadRes = await fetch(
          `${supabaseUrl}/storage/v1/object/formularios-archivos/${filePath}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              "x-upsert": "false",
            },
            body: f.file,
          }
        );

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          console.error("Upload error:", err);
          alert(`Error subiendo "${f.file.name}". Intenta de nuevo.`);
          setLoading(false);
          return;
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/formularios-archivos/${filePath}`;
        archivos.push({
          nombre: f.file.name,
          tamaño: f.file.size,
          tipo: f.file.type,
          url: publicUrl,
        });
      }

      // 2. Send only metadata to API route (tiny JSON, no files)
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
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        role="presentation"
        style={{
          width: "100%",
          height: 6,
          background: "linear-gradient(90deg, #FFD100 0%, #E91E8C 33%, #00BFFF 66%, #1B2A6B 100%)",
        }}
      />
      <main
        style={{
          width: "100%",
          maxWidth: 580,
          padding: "32px 20px 40px",
          margin: "0 auto",
          flex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #1B2A6B, #00B4D8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            PrintUp
          </h2>
        </div>

        <div
          style={{
            background: "#FFF",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.04)",
            padding: "36px 32px 40px",
            border: "1px solid #E2E8F0",
          }}
        >
          {!success ? (
            <form onSubmit={handleSubmit} noValidate>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#1B2A6B",
                  textAlign: "center",
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                }}
              >
                SUBE TU ARCHIVO
              </h1>
              <p
                style={{
                  textAlign: "center",
                  color: "#546178",
                  fontSize: ".875rem",
                  marginBottom: 32,
                  lineHeight: 1.5,
                }}
              >
                Adjunta tu diseño y te confirmaremos recepción a tu correo.
              </p>

              {/* Nombre */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="nombre"
                  style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, color: "#1E293B", marginBottom: 6 }}
                >
                  Nombre de contacto <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Ej: María González"
                  autoComplete="name"
                  onChange={() => setErrors((e) => ({ ...e, nombre: "" }))}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: ".9375rem",
                    fontFamily: "inherit",
                    color: "#1E293B",
                    background: "#F7F8FC",
                    border: `1.5px solid ${errors.nombre ? "#EF4444" : "#E2E8F0"}`,
                    borderRadius: 8,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {errors.nombre && (
                  <div style={{ fontSize: ".75rem", color: "#EF4444", marginTop: 4 }}>{errors.nombre}</div>
                )}
              </div>

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="email"
                  style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, color: "#1E293B", marginBottom: 6 }}
                >
                  Tu email <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  onChange={() => setErrors((e) => ({ ...e, email: "" }))}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: ".9375rem",
                    fontFamily: "inherit",
                    color: "#1E293B",
                    background: "#F7F8FC",
                    border: `1.5px solid ${errors.email ? "#EF4444" : "#E2E8F0"}`,
                    borderRadius: 8,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {errors.email && (
                  <div style={{ fontSize: ".75rem", color: "#EF4444", marginTop: 4 }}>{errors.email}</div>
                )}
              </div>

              {/* Teléfono */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="telefono"
                  style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, color: "#1E293B", marginBottom: 6 }}
                >
                  Teléfono (opcional)
                </label>
                <input
                  id="telefono"
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  autoComplete="tel"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: ".9375rem",
                    fontFamily: "inherit",
                    color: "#1E293B",
                    background: "#F7F8FC",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 8,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Material */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="material"
                  style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, color: "#1E293B", marginBottom: 6 }}
                >
                  Tipo de material
                </label>
                <select
                  id="material"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: ".9375rem",
                    fontFamily: "inherit",
                    color: "#1E293B",
                    background: "#F7F8FC",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 8,
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="vinilo">Vinilo adhesivo</option>
                  <option value="lona">Lona / Banner</option>
                  <option value="papel">Papel fotográfico</option>
                  <option value="tela">Tela / Textil</option>
                  <option value="acrilico">Acrílico / PVC</option>
                  <option value="otro">Otro (especificar en mensaje)</option>
                </select>
              </div>

              {/* Mensaje */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="mensaje"
                  style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, color: "#1E293B", marginBottom: 6 }}
                >
                  Mensaje o instrucciones
                </label>
                <textarea
                  id="mensaje"
                  placeholder="Ej: Necesito 2 copias en tamaño 1m x 0.5m, acabado mate..."
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: ".9375rem",
                    fontFamily: "inherit",
                    color: "#1E293B",
                    background: "#F7F8FC",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 8,
                    outline: "none",
                    resize: "vertical",
                    minHeight: 80,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* File Upload */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, color: "#1E293B", marginBottom: 6 }}
                >
                  Sube tu archivo aquí abajo <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div
                  onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${files.length > 0 ? "#10B981" : dragOver ? "#00B4D8" : "#E2E8F0"}`,
                    borderRadius: 12,
                    padding: "40px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all .25s",
                    background: files.length > 0 ? "rgba(16,185,129,.04)" : dragOver ? "rgba(0,180,216,.04)" : "#F7F8FC",
                  }}
                >
                  <div
                    style={{
                      width: 48, height: 48, margin: "0 auto 12px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #00B4D8, #1B2A6B)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div style={{ fontSize: ".9375rem", fontWeight: 600, color: "#1E293B", marginBottom: 4 }}>
                    Arrastra o selecciona tus archivos aquí
                  </div>
                  <div style={{ fontSize: ".8125rem", color: "#64748B" }}>
                    PDF, JPG, PNG, AI, PSD — max. 50 MB por archivo, max. 5 archivos
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.ai,.psd,.tiff,.tif,.svg,.eps"
                    style={{ display: "none" }}
                    onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }}
                  />
                </div>

                {/* File List */}
                <div style={{ marginTop: 12 }}>
                  {files.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                        background: "#F7F8FC", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 8,
                        fontSize: ".8125rem", animation: "slideIn .3s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: "linear-gradient(135deg, #00B4D8, #1B2A6B)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {f.file.name}
                        </div>
                        <div style={{ color: "#64748B", fontSize: ".75rem" }}>{fmtSize(f.file.size)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4, borderRadius: 4, display: "flex" }}
                      >
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                {errors.file && (
                  <div style={{ fontSize: ".75rem", color: "#EF4444", marginTop: 4 }}>{errors.file}</div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px 24px", fontSize: "1rem", fontWeight: 700,
                  fontFamily: "inherit", color: "#FFF",
                  background: "linear-gradient(135deg, #1B2A6B 0%, #2D3F9E 100%)",
                  border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 28, letterSpacing: ".02em", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, opacity: loading ? 0.6 : 1, transition: "all .25s",
                }}
              >
                {loading && (
                  <span style={{
                    width: 18, height: 18, border: "2px solid rgba(255,255,255,.3)",
                    borderTopColor: "#FFF", borderRadius: "50%", animation: "spin .6s linear infinite",
                    display: "inline-block",
                  }} />
                )}
                <span>ENVIAR</span>
              </button>
            </form>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div
                style={{
                  width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "pop .5s cubic-bezier(.34,1.56,.64,1)",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={32} height={32}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1B2A6B", marginBottom: 8 }}>
                ¡Archivo recibido!
              </h2>
              <p style={{ color: "#64748B", fontSize: ".9375rem", lineHeight: 1.6 }}>
                Te confirmaremos recepción a tu correo.<br />
                Si tienes dudas, escríbenos por WhatsApp.
              </p>
            </div>
          )}
        </div>
      </main>
      <footer style={{ textAlign: "center", padding: "24px 20px", fontSize: ".75rem", color: "#6B7A8D" }}>
        PrintUp.cl — Tu impresión, nuestra huella
      </footer>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }
      `}</style>
    </>
  );
}
