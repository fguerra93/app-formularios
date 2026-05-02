import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto y Subida de Archivos",
  description: "Contacta a PrintUp. Envia tus archivos de diseno y solicita cotizaciones. Ubicados en Errazuriz 09, Donihue.",
  openGraph: {
    title: "Contacto y Subida de Archivos | PrintUp",
    description: "Contacta a PrintUp. Envia tus archivos y solicita cotizaciones.",
  },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
