"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";

interface RecentPurchase {
  nombre_parcial: string;
  producto_nombre: string;
  producto_imagen: string | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

const CITIES = [
  "Donihue",
  "Rancagua",
  "Machali",
  "Coltauco",
  "Coinco",
  "Olivar",
  "Rengo",
  "San Fernando",
];

export function RecentPurchasePopup() {
  const [purchases, setPurchases] = useState<RecentPurchase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch purchases on mount
  useEffect(() => {
    // Check session storage for dismissal
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("hide_recent_purchase") === "1") {
        setDismissed(true);
        return;
      }
    }

    fetch("/api/compras-recientes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPurchases(data);
        }
      })
      .catch(() => {
        // silently fail
      });
  }, []);

  const showPopup = useCallback(() => {
    if (dismissed) return;
    setExiting(false);
    setVisible(true);

    // Hide after 5 seconds
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        setExiting(false);
        setCurrentIndex((prev) => prev + 1);
      }, 500);
    }, 5000);
  }, [dismissed]);

  // Start the cycle
  useEffect(() => {
    if (purchases.length === 0 || dismissed) return;

    // Initial delay of 8 seconds
    const initialDelay = setTimeout(() => {
      showPopup();
    }, 8000);

    return () => clearTimeout(initialDelay);
  }, [purchases, dismissed, showPopup]);

  // Set up interval for subsequent popups
  useEffect(() => {
    if (purchases.length === 0 || dismissed) return;
    if (currentIndex === 0) return; // First show handled by initial delay

    // Random interval between 30-45 seconds
    const delay = 30000 + Math.random() * 15000;
    intervalRef.current = setTimeout(() => {
      showPopup();
    }, delay);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [currentIndex, purchases.length, dismissed, showPopup]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      setDismissed(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("hide_recent_purchase", "1");
      }
    }, 300);
  };

  if (dismissed || purchases.length === 0 || !visible) return null;

  const purchase = purchases[currentIndex % purchases.length];
  const city = CITIES[currentIndex % CITIES.length];

  return (
    <>
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOutLeft {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-120%);
            opacity: 0;
          }
        }
        .popup-enter {
          animation: slideInLeft 0.4s ease-out forwards;
        }
        .popup-exit {
          animation: fadeOutLeft 0.4s ease-in forwards;
        }
      `}</style>
      <div
        className={`recent-pop fixed bottom-6 left-4 z-40 max-w-xs bg-white rounded-xl shadow-lg border border-[#e8eaee] overflow-hidden ${
          exiting ? "popup-exit" : "popup-enter"
        }`}
      >
        <div className="flex items-center gap-3 p-3 pr-8">
          {/* Thumbnail */}
          {purchase.producto_imagen ? (
            <img
              src={purchase.producto_imagen}
              alt={purchase.producto_nombre}
              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#fafafb]"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0f1115] to-[#00B4D8] flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                width={20}
                height={20}
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
          )}

          {/* Text */}
          <div className="min-w-0">
            <p className="text-sm text-[#0f1115] leading-snug">
              <strong className="font-semibold">{purchase.nombre_parcial}</strong>{" "}
              de {city} compro{" "}
              <strong className="font-semibold text-[#0f1115]">
                {purchase.producto_nombre}
              </strong>
            </p>
            <p className="text-xs text-[#5b6472] mt-0.5">
              {timeAgo(purchase.created_at)}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-[#8b94a3] hover:text-[#0f1115] hover:bg-[#F1F5F9] transition-colors"
          aria-label="Cerrar"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </>
  );
}
