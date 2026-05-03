"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Track a custom event via Google Analytics 4.
 * No-op if GA is not loaded.
 */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, params);
  }
}

export function GAProvider() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetch("/api/config/public")
      .then((r) => r.json())
      .then((config: Record<string, string>) => {
        const gaId = config.ga4_measurement_id;
        if (!gaId) return;

        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        window.gtag = function (...args: unknown[]) {
          window.dataLayer!.push(args);
        };
        window.gtag("js", new Date());
        window.gtag("config", gaId);

        // Inject GA4 script
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);
      })
      .catch(() => {
        // silently fail if config unavailable
      });
  }, []);

  return null;
}
