import { Navbar } from "@/components/tienda/navbar";
import { Footer } from "@/components/tienda/footer";
import { WhatsAppButton } from "@/components/tienda/whatsapp-button";

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#F0F7FF]">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
