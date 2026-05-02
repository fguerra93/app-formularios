import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/cart/cart-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://printup.cl";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "PrintUp - Impresion y Publicidad en Donihue | Tu impresion, nuestra huella",
    template: "%s | PrintUp",
  },
  description: "Tu impresion, nuestra huella. Productos personalizados, impresion DTF/DTG, pendones, bolsas y mas en Donihue, Region de O'Higgins.",
  keywords: ["impresion", "publicidad", "DTF", "DTG", "pendones", "sublimacion", "Donihue", "Rancagua", "PrintUp"],
  authors: [{ name: "PrintUp" }],
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "PrintUp",
    title: "PrintUp - Impresion y Publicidad en Donihue",
    description: "Tu impresion, nuestra huella. Productos personalizados, impresion DTF/DTG, pendones, bolsas y mas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrintUp - Impresion y Publicidad en Donihue",
    description: "Tu impresion, nuestra huella. Productos personalizados, impresion DTF/DTG, pendones, bolsas y mas.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-sans)]">
        <CartProvider>
          {children}
        </CartProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
