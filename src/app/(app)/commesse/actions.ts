"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const testo = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();

export async function creaCommessa(_: string | null, form: FormData) {
  const cliente_id = testo(form, "cliente_id");
  const titolo = testo(form, "titolo");
  if (!cliente_id || !titolo) return "Scegli un cliente e scrivi il titolo.";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commesse")
    .insert({
      codice: "",
      cliente_id,
      titolo,
      importo_previsto: Number(testo(form, "importo_previsto").replace(",", ".")) || 0,
      data_inizio: testo(form, "data_inizio") || undefined,
    })
    .select("id")
    .single();
  if (error) return "Creazione non riuscita: " + error.message;

  revalidatePath("/commesse");
  redirect(`/commesse/${data.id}`);
}

export async function aggiornaCommessa(id: string, _: string | null, form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("commesse")
    .update({
      titolo: testo(form, "titolo"),
      stato: testo(form, "stato"),
      importo_previsto: Number(testo(form, "importo_previsto").replace(",", ".")) || 0,
      data_inizio: testo(form, "data_inizio"),
      note: testo(form, "note") || null,
    })
    .eq("id", id);
  if (error) return "Salvataggio non riuscito: " + error.message;
  revalidatePath(`/commesse/${id}`);
  revalidatePath("/commesse");
  return "Salvato.";
}

export async function aggiungiOre(id: string, _: string | null, form: FormData) {
  const ore = Number(testo(form, "ore").replace(",", "."));
  if (!(ore > 0 && ore <= 24)) return "Inserisci un numero di ore tra 0 e 24.";

  const supabase = await createClient();
  const utente = testo(form, "utente_id");
  const { error } = await supabase.from("ore_commessa").insert({
    commessa_id: id,
    ore,
    data: testo(form, "data"),
    descrizione: testo(form, "descrizione") || null,
    ...(utente ? { utente_id: utente } : {}),
  });
  if (error) return "Registrazione non riuscita: " + error.message;
  revalidatePath(`/commesse/${id}`);
  return null;
}

export async function eliminaOre(commessaId: string, id: string) {
  const supabase = await createClient();
  await supabase.from("ore_commessa").delete().eq("id", id);
  revalidatePath(`/commesse/${commessaId}`);
}

export async function aggiungiCosto(id: string, _: string | null, form: FormData) {
  const importo = Number(testo(form, "importo").replace(",", "."));
  const descrizione = testo(form, "descrizione");
  if (!descrizione || !importo) return "Inserisci descrizione e importo.";

  const supabase = await createClient();
  const { error } = await supabase.from("costi_commessa").insert({
    commessa_id: id,
    data: testo(form, "data"),
    categoria: testo(form, "categoria"),
    descrizione,
    fornitore: testo(form, "fornitore") || null,
    importo,
  });
  if (error) return "Registrazione non riuscita: " + error.message;
  revalidatePath(`/commesse/${id}`);
  return null;
}

export async function eliminaCosto(commessaId: string, id: string) {
  const supabase = await createClient();
  await supabase.from("costi_commessa").delete().eq("id", id);
  revalidatePath(`/commesse/${commessaId}`);
}

export async function caricaDocumento(id: string, _: string | null, form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return "Scegli un file.";

  const supabase = await createClient();
  const nome = file.name.replace(/[^\w.\- ]+/g, "_");
  const { error } = await supabase.storage.from("documenti").upload(`${id}/${Date.now()}-${nome}`, file, {
    contentType: file.type || undefined,
  });
  if (error) return "Caricamento non riuscito: " + error.message;
  revalidatePath(`/commesse/${id}`);
  return null;
}

export async function eliminaDocumento(commessaId: string, percorso: string) {
  const supabase = await createClient();
  await supabase.storage.from("documenti").remove([percorso]);
  revalidatePath(`/commesse/${commessaId}`);
}
