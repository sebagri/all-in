"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function salvaUtente(id: string, _: string | null, form: FormData) {
  const supabase = await createClient();
  const nome = String(form.get("nome") ?? "").trim();
  const ruolo = String(form.get("ruolo"));
  const costo = Number(String(form.get("costo_orario") ?? "0").replace(",", ".")) || 0;

  const p = await supabase.from("profili").update({ nome, ruolo }).eq("id", id);
  if (p.error) return "Errore: " + p.error.message;
  const t = await supabase.from("tariffe").upsert({ utente_id: id, costo_orario: costo });
  if (t.error) return "Errore: " + t.error.message;

  revalidatePath("/utenti");
  return "Salvato.";
}
