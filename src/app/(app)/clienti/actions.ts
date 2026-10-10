"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const campi = [
  "ragione_sociale", "partita_iva", "codice_fiscale", "indirizzo", "citta", "cap",
  "provincia", "email", "pec", "telefono", "codice_sdi", "note",
] as const;

function leggiForm(form: FormData) {
  const dati: Record<string, string | null> = {};
  for (const c of campi) {
    const v = String(form.get(c) ?? "").trim();
    dati[c] = v === "" ? null : v;
  }
  return dati;
}

export async function salvaCliente(id: string | null, _: string | null, form: FormData) {
  const dati = leggiForm(form);
  if (!dati.ragione_sociale) return "La ragione sociale è obbligatoria.";

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("clienti").update({ ...dati, aggiornato_il: new Date().toISOString() }).eq("id", id)
    : await supabase.from("clienti").insert(dati);
  if (error) return "Salvataggio non riuscito: " + error.message;

  revalidatePath("/clienti");
  redirect("/clienti");
}

export async function eliminaCliente(id: string) {
  const supabase = await createClient();
  await supabase.from("clienti").delete().eq("id", id);
  revalidatePath("/clienti");
  redirect("/clienti");
}
