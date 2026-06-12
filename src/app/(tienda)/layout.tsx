import { Navbar } from "@/components/tienda/navbar";
import { Footer } from "@/components/tienda/footer";

// Render dinámico de TODO el storefront: lee datos (productos, stock, precios)
// desde Cloud SQL en cada request. Evita el SSG en build (que leería Supabase y
// horneaba IDs de producto distintos a los de Cloud SQL, rompiendo el checkout).
export const dynamic = "force-dynamic";
import { WhatsAppButton } from "@/components/tienda/whatsapp-button";
import { RecentPurchasePopup } from "@/components/tienda/recent-purchase-popup";
import { ScrollToTop } from "@/components/tienda/scroll-to-top";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PrintUp",
  alternateName: "Servicios Graficos Spa",
  url: "https://printup.cl",
  logo: "https://printup.cl/cdn/shop/files/LOGO-2.gif?v=1768853492",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+56966126645",
    contactType: "customer service",
    availableLanguage: "Spanish",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Errazuriz 09 / Francisco Lira 082",
    addressLocality: "Donihue",
    addressRegion: "O'Higgins",
    addressCountry: "CL",
  },
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
