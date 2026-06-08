import type { Metadata, Viewport } from "next";
import { SWRegisterM } from "./sw-register";

export const metadata: Metadata = {
  title: "PrintUp — Dueño",
  manifest: "/m/manifest.json",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
};

/** Superficie "dueño" (PWA móvil), fuera del storefront y del admin de escritorio. */
export default function MLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      <SWRegisterM />
      {children}
    </div>
  );
}
