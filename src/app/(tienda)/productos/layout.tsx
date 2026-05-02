import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productos",
  description: "Explora nuestro catalogo de productos personalizados: impresion DTF/DTG, poleras, bolsas, pendones, botellas sublimadas y mas.",
  openGraph: {
    title: "Productos | PrintUp",
    description: "Explora nuestro catalogo de productos personalizados.",
  },
};

export default function ProductosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
