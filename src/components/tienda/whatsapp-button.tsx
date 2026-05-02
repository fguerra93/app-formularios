"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const message = encodeURIComponent(
    "Hola! Me interesa conocer mas sobre sus servicios de impresion."
  );

  return (
    <a
      href={`https://wa.me/56966126645?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5A] hover:scale-110 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
