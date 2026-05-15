"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Track a Facebook Pixel event.
 * No-op if pixel is not loaded.
 */
export function trackFBEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", name, params);
  }
}

export function FBPixelProvider() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetch("/api/config/public")
      .then((r) => r.json())
      .then((config: Record<string, string>) => {
        const pixelId = config.fb_pixel_id;
        if (!pixelId) return;

        // Inject FB Pixel script
        const script = document.createElement("script");
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      })
      .catch(() => {
        // silently fail
      });
  }, []);

  return null;
}
