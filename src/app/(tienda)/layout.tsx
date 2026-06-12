import { Navbar } from "@/components/tienda/navbar";
import { Footer } from "@/components/tienda/footer";

// Render dinámico de TODO el storefront: lee datos (productos, stock, precios)
// desde Cloud SQL en cada request. Evita el SSG en build (que leería Supabase y
// horneaba IDs de producto distintos a los de Cloud SQL, rompiendo el checkout).
export const dynamic = "force-dynamic";
import { WhatsAppButton } from "@/components/tienda/whatsapp-button";
import { RecentPurchasePopup } from "@/components/tienda/recent-purchase-popup";
import { ScrollToTop } from "@/components/tienda/scroll-to-top";

// LocalBusiness (no solo Organization): habilita el panel de negocio local
// en Google con horario, zona y datos de contacto del taller.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "Organization"],
  "@id": "https://printup.cl/#taller",
  name: "PrintUp",
  alternateName: "Servicios Graficos Spa",
  description:
    "Imprenta en Doñihue, Región de O'Higgins: pendones, roller, DTF textil, poleras y artículos publicitarios con despacho a todo Chile.",
  url: "https://printup.cl",
  logo: "https://printup.cl/cdn/shop/files/LOGO-2.gif?v=1768853492",
  image: "https://printup.cl/cdn/shop/files/LOGO-2.gif?v=1768853492",
  telephone: "+56966126645",
  email: "contacto@printup.cl",
  priceRange: "$$",
  currenciesAccepted: "CLP",
  paymentAccepted: "Webpay, MercadoPago, Transferencia, Efectivo",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+56966126645",
    contactType: "customer service",
    availableLanguage: "Spanish",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Errázuriz 09 / Francisco Lira 082",
    addressLocality: "Doñihue",
    addressRegion: "Región del Libertador General Bernardo O'Higgins",
    addressCountry: "CL",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -34.2278,
    longitude: -70.9669,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "10:00",
      closes: "14:00",
    },
  ],
  sameAs: [
    "https://www.facebook.com/printup.cl",
    "https://www.instagram.com/printup.cl",
    "https://www.tiktok.com/@printup.cl",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PrintUp",
  url: "https://printup.cl",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://printup.cl/productos?search={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Navbar />
      <main className="flex-1 bg-white">{children}</main>
      <Footer />
      <WhatsAppButton />
      <RecentPurchasePopup />
      <ScrollToTop />
    </>
  );
}
