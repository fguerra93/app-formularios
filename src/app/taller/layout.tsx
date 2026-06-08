import type { Metadata, Viewport } from "next";
import { SWRegister } from "./sw-register";

export const metadata: Metadata = {
  title: "Taller — Comanda | PrintUp",
  manifest: "/taller/manifest.json",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
};

/** Superficie "taller" (KDS): pantalla oscura de kiosko, fuera del storefront. */
export default function TallerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      <SWRegister />
      {children}
    </div>
  );
}
