"use client";

import { useEffect } from "react";

/** Registra el service worker del taller (scope /taller) para instalar la PWA. */
export function SWRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/taller/sw.js", { scope: "/taller" })
      .catch(() => {
        /* SW opcional: si falla, la app sigue funcionando online */
      });
  }, []);
  return null;
}
