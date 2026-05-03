"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, User, Session } from "@supabase/supabase-js";

let _browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (_browserClient) return _browserClient;
  _browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
  return _browserClient;
}

export async function signUp(email: string, password: string, nombre: string, telefono?: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, telefono: telefono || null },
    },
  });

  if (error) throw error;

  // Create cliente record
  if (data.user) {
    const { error: clienteError } = await supabase.from("clientes").insert({
      id: data.user.id,
      email,
      nombre,
      telefono: telefono || null,
    });
    if (clienteError) console.error("Error creating cliente:", clienteError);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/recuperar-password/reset`,
  });
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const supabase = getSupabaseBrowser();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
