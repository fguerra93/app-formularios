"use client";

import { useEffect } from "react";

/** Registra el service worker de la app del dueño (scope /m). */
export function SWRegisterM() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/m/sw.js", { scope: "/m" }).catch(() => {});
  }, []);
  return null;
}
