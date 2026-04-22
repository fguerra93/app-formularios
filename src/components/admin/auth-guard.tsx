"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        setStatus("unauthenticated");
        router.replace("/admin/login");
      });
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-[3px] border-current border-t-transparent"
            style={{ color: "#1B2A6B" }}
          />
          <p className="text-sm" style={{ color: "#64748B" }}>
            Verificando acceso...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
