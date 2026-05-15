"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  onClose: () => void;
}

function LightboxModal({ images, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  const current = images[currentIndex];

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative">
        <img
          src={current.url}
          alt={current.alt || ""}
          className="select-none"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ProductGalleryProps {
  images: { url: string; alt?: string }[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const mainImage = images[selectedIndex] || images[0];

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square rounded-xl bg-white border border-[#E2E8F0] overflow-hidden flex items-center justify-center">
        <div className="text-center text-[#64748B]">
          <ZoomIn className="size-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Sin imagen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image with zoom trigger */}
      <div
        className="aspect-square rounded-xl bg-white border border-[#E2E8F0] overflow-hidden flex items-center justify-center relative group cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
      >
        {mainImage?.url ? (
          <img
            src={mainImage.url}
            alt={mainImage.alt || productName}
            className="w-full h-full object-contain"
          />
        ) : (
          <ZoomIn className="size-24 text-[#00B4D8]/20" />
        )}

        {/* Zoom overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
            <ZoomIn className="size-6 text-[#1B2A6B]" />
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`aspect-square rounded-lg bg-white border overflow-hidden transition-all ${
                selectedIndex === i
                  ? "border-[#00B4D8] ring-2 ring-[#00B4D8]/30"
                  : "border-[#E2E8F0] hover:border-[#00B4D8]"
              }`}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.alt || `${productName} ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ZoomIn className="size-4 text-[#00B4D8]/20" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <LightboxModal
          images={images.filter((img) => img.url)}
          initialIndex={selectedIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
