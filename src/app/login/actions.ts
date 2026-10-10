"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function accedi(_: string | null, form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) return "Email o password non corretti.";
  redirect("/");
}

export async function esci() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
