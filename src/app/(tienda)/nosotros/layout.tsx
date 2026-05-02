import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description: "Conoce PrintUp: tu aliado en impresion y publicidad en Donihue, Region de O'Higgins. Servicios DTF, DTG, sublimacion y grafica publicitaria.",
  openGraph: {
    title: "Sobre Nosotros | PrintUp",
    description: "Conoce PrintUp: tu aliado en impresion y publicidad en Donihue.",
  },
};

export default function NosotrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
