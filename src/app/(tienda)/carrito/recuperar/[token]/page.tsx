"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

/**
 * Recuperación de carrito abandonado: el link del email trae un token,
 * cargamos los items guardados al carrito local y seguimos al checkout.
 */
export default function RecuperarCarritoPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [error, setError] = useState(false);
  const corrido = useRef(false);

  useEffect(() => {
    if (!token || corrido.current) return;
    corrido.current = true;

    fetch(`/api/carritos/recuperar/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.items) && data.items.length > 0) {
          localStorage.setItem("printup_cart", JSON.stringify(data.items));
          // El provider lee localStorage al montar: recarga dura al carrito.
          window.location.assign("/carrito?recuperado=1");
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [token, router]);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      {error ? (
        <>
          <h1 className="mc-h2 mb-3">No encontramos ese carrito</h1>
          <p className="mc-sub mb-8">
            Puede que ya lo hayas recuperado o que el link haya vencido.
            Tu catálogo sigue aquí mismo.
          </p>
          <Link href="/productos" className="mc-btn mc-btn-primary">
            Ver productos
          </Link>
        </>
      ) : (
        <>
          <Loader2 className="size-8 mx-auto mb-4 animate-spin" style={{ color: "var(--mc-ink-2)" }} />
          <h1 className="mc-h2 mb-2">Recuperando tu carrito…</h1>
          <p className="mc-sub">Te llevamos de vuelta a donde quedaste.</p>
        </>
      )}
    </div>
  );
}
