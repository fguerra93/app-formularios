"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Cliente } from "@/lib/types";

interface UserLite {
  id: string;
  email: string;
}

interface AuthContextType {
  user: UserLite | null;
  cliente: Cliente | null;
  loading: boolean;
  refreshCliente: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  cliente: null,
  loading: true,
  refreshCliente: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserLite | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/cliente/auth/session", { credentials: "include" });
      const data = await res.json();
      setUser(data.user ?? null);
      setCliente((data.cliente as Cliente | null) ?? null);
    } catch {
      setUser(null);
      setCliente(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <AuthContext.Provider value={{ user, cliente, loading, refreshCliente: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}
