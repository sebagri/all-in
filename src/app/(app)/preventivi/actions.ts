"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Voce } from "@/lib/formato";

export async function creaPreventivo(_: string | null, form: FormData) {
  const cliente_id = String(form.get("cliente_id") ?? "");
  const oggetto = String(form.get("oggetto") ?? "").trim();
  if (!cliente_id || !oggetto) return "Scegli un cliente e scrivi l'oggetto.";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("preventivi")
    .insert({ numero: "", cliente_id, oggetto })
    .select("id")
    .single();
  if (error) return "Creazione non riuscita: " + error.message;

  revalidatePath("/preventivi");
  redirect(`/preventivi/${data.id}`);
}

export type DatiPreventivo = {
  oggetto: string;
  data: string;
  validita_giorni: number;
  aliquota_iva: number;
  note: string;
  voci: Voce[];
};

export async function salvaPreventivo(id: string, dati: DatiPreventivo) {
  if (!dati.oggetto.trim()) return { errore: "L'oggetto è obbligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("preventivi")
    .update({
      oggetto: dati.oggetto.trim(),
      data: dati.data,
      validita_giorni: dati.validita_giorni,
      aliquota_iva: dati.aliquota_iva,
      note: dati.note.trim() || null,
    })
    .eq("id", id);
  if (error) return { errore: "Salvataggio non riuscito: " + error.message };

  const voci = dati.voci
    .filter((v) => v.descrizione.trim())
    .map((v, i) => ({
      preventivo_id: id,
      posizione: i + 1,
      descrizione: v.descrizione.trim(),
      unita: v.unita || "pz",
      quantita: Number(v.quantita) || 0,
      prezzo_unitario: Number(v.prezzo_unitario) || 0,
    }));
  const del = await supabase.from("voci_preventivo").delete().eq("preventivo_id", id);
  if (del.error) return { errore: "Salvataggio voci non riuscito: " + del.error.message };
  if (voci.length) {
    const ins = await supabase.from("voci_preventivo").insert(voci);
    if (ins.error) return { errore: "Salvataggio voci non riuscito: " + ins.error.message };
  }

  revalidatePath(`/preventivi/${id}`);
  revalidatePath("/preventivi");
  return { errore: null };
}

export async function cambiaStato(id: string, stato: "bozza" | "inviato" | "rifiutato") {
  const supabase = await createClient();
  await supabase.from("preventivi").update({ stato }).eq("id", id).is("commessa_id", null);
  revalidatePath(`/preventivi/${id}`);
  revalidatePath("/preventivi");
}

export async function accettaPreventivo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accetta_preventivo", { p_id: id });
  if (error) throw new Error(error.message);
  revalidatePath(`/preventivi/${id}`);
  revalidatePath("/preventivi");
  revalidatePath("/commesse");
}

export async function eliminaPreventivo(id: string) {
  const supabase = await createClient();
  await supabase.from("preventivi").delete().eq("id", id);
  revalidatePath("/preventivi");
  redirect("/preventivi");
}
