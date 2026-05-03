"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/auth-client";
import type { User } from "@supabase/supabase-js";
import type { Cliente } from "@/lib/types";

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCliente = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", userId)
      .single();
    setCliente(data as Cliente | null);
  }, []);

  const refreshCliente = useCallback(async () => {
    if (user) await fetchCliente(user.id);
  }, [user, fetchCliente]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCliente(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchCliente(session.user.id);
        } else {
          setCliente(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchCliente]);

  return (
    <AuthContext.Provider value={{ user, cliente, loading, refreshCliente }}>
      {children}
    </AuthContext.Provider>
  );
}
