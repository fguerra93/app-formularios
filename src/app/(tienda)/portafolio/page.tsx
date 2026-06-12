"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/tienda/motion";
import { X, ChevronLeft, ChevronRight, MessageCircle, Mail, Image as ImageIcon } from "lucide-react";
import type { Trabajo, ClienteDestacado } from "@/lib/types";

export default function PortafolioPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [clientes, setClientes] = useState<ClienteDestacado[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [modalTrabajo, setModalTrabajo] = useState<Trabajo | null>(null);
  const [modalImageIdx, setModalImageIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/portafolio").then((r) => r.json()),
      fetch("/api/portafolio/clientes").then((r) => r.json()),
    ])
      .then(([trabajosData, clientesData]) => {
        const t = Array.isArray(trabajosData) ? trabajosData : [];
        setTrabajos(t);
        setClientes(Array.isArray(clientesData) ? clientesData : []);

        // Extract distinct categories
        const cats = Array.from(
          new Set(t.map((tr: Trabajo) => tr.categoria).filter(Boolean))
        ) as string[];
        setCategorias(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  const trabajosFiltrados =
    categoriaActiva === "Todos"
      ? trabajos
      : trabajos.filter((t) => t.categoria === categoriaActiva);

  const openModal = useCallback((trabajo: Trabajo) => {
    setModalTrabajo(trabajo);
    setModalImageIdx(0);
    document.body.style.overflow = "hidden";
  }, []);

  const closeModal = useCallback(() => {
    setModalTrabajo(null);
    setModalImageIdx(0);
    document.body.style.overflow = "";
  }, []);

  const nextImage = useCallback(() => {
    if (!modalTrabajo) return;
    setModalImageIdx((prev) =>
      prev < modalTrabajo.imagenes.length - 1 ? prev + 1 : 0
    );
  }, [modalTrabajo]);

  const prevImage = useCallback(() => {
    if (!modalTrabajo) return;
    setModalImageIdx((prev) =>
      prev > 0 ? prev - 1 : modalTrabajo.imagenes.length - 1
    );
  }, [modalTrabajo]);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!modalTrabajo) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalTrabajo, closeModal, nextImage, prevImage]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Portafolio" }]} />

      {/* Header */}
      <FadeIn>
        <section className="text-center mb-12">
          <h1
            className="text-4xl md:text-5xl font-extrabold text-[#0f1115] mb-4"
            style={{ letterSpacing: "-0.02em" }}
          >
            Nuestros <span className="text-[#00B4D8]">Trabajos</span>
          </h1>
          <p className="text-lg text-[#5b6472] max-w-2xl mx-auto">
            Mira lo que hemos creado para nuestros clientes
          </p>
        </section>
      </FadeIn>

      {/* Category filter tabs */}
      {!loading && categorias.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {["Todos", ...categorias].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  categoriaActiva === cat
                    ? "bg-[#0f1115] text-white shadow-md"
                    : "bg-white text-[#5b6472] border border-[#e8eaee] hover:border-[#00B4D8] hover:text-[#0f1115]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Grid of trabajos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : trabajosFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="size-16 text-[#e8eaee] mx-auto mb-4" />
          <p className="text-[#5b6472] text-lg">No hay trabajos en esta categoria</p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trabajosFiltrados.map((trabajo) => (
            <StaggerItem key={trabajo.id}>
              <button
                onClick={() => openModal(trabajo)}
                className="group block w-full text-left bg-white rounded-xl border border-[#e8eaee] overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="relative aspect-[4/3] bg-[#fafafb] overflow-hidden">
                  {trabajo.imagenes?.[0]?.url ? (
                    <img
                      src={trabajo.imagenes[0].url}
                      alt={trabajo.imagenes[0].alt || trabajo.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="size-16 text-[#00B4D8]/30" />
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115]/90 via-[#0f1115]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <h3 className="text-white font-bold text-lg leading-snug">
                      {trabajo.titulo}
                    </h3>
                    {trabajo.cliente_nombre && (
                      <p className="text-white/80 text-sm mt-1">
                        {trabajo.cliente_nombre}
                      </p>
                    )}
                    {trabajo.categoria && (
                      <span className="inline-block mt-2 px-3 py-1 rounded-full bg-[#00B4D8]/80 text-white text-xs font-medium w-fit">
                        {trabajo.categoria}
                      </span>
                    )}
                  </div>

                  {/* Image count badge */}
                  {trabajo.imagenes && trabajo.imagenes.length > 1 && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
                      <ImageIcon className="size-3" />
                      {trabajo.imagenes.length}
                    </span>
                  )}
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Clientes que confian en nosotros */}
      {clientes.length > 0 && (
        <FadeIn delay={0.2}>
          <section className="mt-20 mb-16">
            <h2
              className="text-2xl font-extrabold text-[#0f1115] text-center mb-2"
              style={{ letterSpacing: "-0.02em" }}
            >
              Mas de {clientes.length} empresas confian en PrintUp
            </h2>
            <p className="text-[#5b6472] text-center mb-10">
              Empresas y emprendedores que eligieron nuestro trabajo
            </p>

            {/* CSS Marquee */}
            <div className="overflow-hidden relative">
              <div className="flex animate-marquee whitespace-nowrap">
                {[...clientes, ...clientes].map((cliente, idx) => (
                  <div
                    key={`${cliente.id}-${idx}`}
                    className="mx-8 flex items-center justify-center shrink-0"
                  >
                    {cliente.url_web ? (
                      <a
                        href={cliente.url_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={cliente.logo_url}
                          alt={cliente.nombre}
                          className="h-12 w-auto max-w-[140px] object-contain grayscale hover:grayscale-0 transition-all duration-300"
                        />
                      </a>
                    ) : (
                      <img
                        src={cliente.logo_url}
                        alt={cliente.nombre}
                        className="h-12 w-auto max-w-[140px] object-contain grayscale hover:grayscale-0 transition-all duration-300"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>
      )}

      {/* CTA */}
      <section
        className="rounded-2xl py-16 px-6 mb-8"
        style={{
          background: "linear-gradient(135deg, #0f1115, #00B4D8)",
        }}
      >
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2
            className="text-3xl font-extrabold mb-4"
            style={{ letterSpacing: "-0.02em" }}
          >
            Quieres un trabajo como estos?
          </h2>
          <p className="text-white/80 mb-8">
            Cotiza ahora y hagamos realidad tu proyecto
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/56966126645"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] transition-colors"
            >
              <MessageCircle className="size-5" />
              WhatsApp
            </a>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white text-[#0f1115] font-bold text-sm hover:bg-white/90 transition-colors"
            >
              <Mail className="size-5" />
              Contacto
            </Link>
          </div>
        </div>
      </section>

      {/* Modal / Lightbox */}
      {modalTrabajo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeModal}
        >
          <div
            className="relative bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
              aria-label="Cerrar"
            >
              <X className="size-5 text-[#0f1115]" />
            </button>

            {/* Image viewer */}
            {modalTrabajo.imagenes && modalTrabajo.imagenes.length > 0 ? (
              <div className="relative aspect-[16/10] bg-[#fafafb] rounded-t-2xl overflow-hidden">
                <img
                  src={modalTrabajo.imagenes[modalImageIdx]?.url}
                  alt={
                    modalTrabajo.imagenes[modalImageIdx]?.alt ||
                    modalTrabajo.titulo
                  }
                  className="w-full h-full object-contain"
                />

                {/* Navigation arrows */}
                {modalTrabajo.imagenes.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft className="size-5 text-[#0f1115]" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
                      aria-label="Siguiente imagen"
                    >
                      <ChevronRight className="size-5 text-[#0f1115]" />
                    </button>

                    {/* Dot indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {modalTrabajo.imagenes.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setModalImageIdx(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            idx === modalImageIdx
                              ? "bg-white scale-110"
                              : "bg-white/50 hover:bg-white/75"
                          }`}
                          aria-label={`Ver imagen ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-[16/10] bg-[#fafafb] rounded-t-2xl flex items-center justify-center">
                <ImageIcon className="size-20 text-[#00B4D8]/30" />
              </div>
            )}

            {/* Info */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-2xl font-extrabold text-[#0f1115]">
                  {modalTrabajo.titulo}
                </h3>
                {modalTrabajo.categoria && (
                  <span className="shrink-0 px-3 py-1 rounded-full bg-[#00B4D8]/10 text-[#00B4D8] text-xs font-semibold">
                    {modalTrabajo.categoria}
                  </span>
                )}
              </div>
              {modalTrabajo.cliente_nombre && (
                <p className="text-sm text-[#5b6472] mb-3">
                  Cliente: {modalTrabajo.cliente_nombre}
                </p>
              )}
              {modalTrabajo.descripcion && (
                <p className="text-[#475569] leading-relaxed">
                  {modalTrabajo.descripcion}
                </p>
              )}

              {/* Thumbnail strip */}
              {modalTrabajo.imagenes && modalTrabajo.imagenes.length > 1 && (
                <div className="flex gap-2 mt-5 overflow-x-auto pb-2">
                  {modalTrabajo.imagenes.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setModalImageIdx(idx)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === modalImageIdx
                          ? "border-[#00B4D8]"
                          : "border-transparent hover:border-[#e8eaee]"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.alt || `Imagen ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
