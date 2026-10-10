"use client";

import { useActionState, useRef } from "react";
import { categorieCosto, etichetteCategoria, etichetteStato, oggi, statiCommessa } from "@/lib/formato";
import { aggiornaCommessa, aggiungiCosto, aggiungiOre, caricaDocumento, creaCommessa } from "./actions";

function Errore({ testo }: { testo: string | null }) {
  if (!testo) return null;
  return <p className={`text-sm ${testo === "Salvato." ? "text-green-700" : "text-red-600"}`}>{testo}</p>;
}

// Svuota il modulo dopo un invio andato a buon fine
function useAzione(azione: (s: string | null, f: FormData) => Promise<string | null>) {
  const form = useRef<HTMLFormElement>(null);
  const [stato, esegui, inCorso] = useActionState(async (s: string | null, f: FormData) => {
    const esito = await azione(s, f);
    if (!esito) form.current?.reset();
    return esito;
  }, null);
  return { form, stato, esegui, inCorso };
}

export function NuovaCommessa({ clienti }: { clienti: { id: string; ragione_sociale: string }[] }) {
  const [errore, azione, inCorso] = useActionState(creaCommessa, null);
  return (
    <form action={azione} className="space-y-4 rounded-lg bg-white p-4 shadow">
      <label className="block text-sm">
        Cliente *
        <select name="cliente_id" required defaultValue="" className="campo mt-1">
          <option value="">Scegli…</option>
          {clienti.map((c) => (
            <option key={c.id} value={c.id}>
              {c.ragione_sociale}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Titolo *
        <input name="titolo" required placeholder="Es. Cantiere Via Roma" className="campo mt-1" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Importo previsto (€)
          <input name="importo_previsto" inputMode="decimal" className="campo mt-1" />
        </label>
        <label className="text-sm">
          Data inizio
          <input name="data_inizio" type="date" defaultValue={oggi()} className="campo mt-1" />
        </label>
      </div>
      <Errore testo={errore} />
      <button className="bottone" disabled={inCorso}>
        {inCorso ? "Creazione…" : "Crea commessa"}
      </button>
    </form>
  );
}

export function DatiCommessa({
  id,
  commessa,
}: {
  id: string;
  commessa: { titolo: string; stato: string; importo_previsto: number; data_inizio: string; note: string | null };
}) {
  const [esito, azione, inCorso] = useActionState(aggiornaCommessa.bind(null, id), null);
  return (
    <form action={azione} className="grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-4">
      <label className="text-sm sm:col-span-2">
        Titolo
        <input name="titolo" required defaultValue={commessa.titolo} className="campo mt-1" />
      </label>
      <label className="text-sm">
        Stato
        <select name="stato" defaultValue={commessa.stato} className="campo mt-1">
          {statiCommessa.map((s) => (
            <option key={s} value={s}>
              {etichetteStato[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Data inizio
        <input name="data_inizio" type="date" defaultValue={commessa.data_inizio} className="campo mt-1" />
      </label>
      <label className="text-sm">
        Importo previsto (€)
        <input name="importo_previsto" inputMode="decimal" defaultValue={commessa.importo_previsto} className="campo mt-1" />
      </label>
      <label className="text-sm sm:col-span-3">
        Note
        <input name="note" defaultValue={commessa.note ?? ""} className="campo mt-1" />
      </label>
      <div className="flex items-center gap-3 sm:col-span-4">
        <button className="bottone-secondario" disabled={inCorso}>
          {inCorso ? "Salvataggio…" : "Salva dati commessa"}
        </button>
        <Errore testo={esito} />
      </div>
    </form>
  );
}

export function NuoveOre({ id, persone }: { id: string; persone: { id: string; nome: string }[] | null }) {
  const { form, stato, esegui, inCorso } = useAzione(aggiungiOre.bind(null, id));
  return (
    <form ref={form} action={esegui} className="flex flex-wrap items-end gap-2">
      {persone && (
        <label className="text-sm">
          Persona
          <select name="utente_id" className="campo mt-1">
            {persone.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="text-sm">
        Data
        <input name="data" type="date" defaultValue={oggi()} required className="campo mt-1" />
      </label>
      <label className="w-20 text-sm">
        Ore
        <input name="ore" inputMode="decimal" required className="campo mt-1" />
      </label>
      <label className="min-w-48 flex-1 text-sm">
        Lavoro svolto
        <input name="descrizione" className="campo mt-1" />
      </label>
      <button className="bottone" disabled={inCorso}>
        Aggiungi
      </button>
      <div className="w-full">
        <Errore testo={stato} />
      </div>
    </form>
  );
}

export function NuovoCosto({ id }: { id: string }) {
  const { form, stato, esegui, inCorso } = useAzione(aggiungiCosto.bind(null, id));
  return (
    <form ref={form} action={esegui} className="flex flex-wrap items-end gap-2">
      <label className="text-sm">
        Data
        <input name="data" type="date" defaultValue={oggi()} required className="campo mt-1" />
      </label>
      <label className="text-sm">
        Categoria
        <select name="categoria" className="campo mt-1">
          {categorieCosto.map((c) => (
            <option key={c} value={c}>
              {etichetteCategoria[c]}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-48 flex-1 text-sm">
        Descrizione
        <input name="descrizione" required className="campo mt-1" />
      </label>
      <label className="text-sm">
        Fornitore
        <input name="fornitore" className="campo mt-1" />
      </label>
      <label className="w-28 text-sm">
        Importo €
        <input name="importo" inputMode="decimal" required className="campo mt-1" />
      </label>
      <button className="bottone" disabled={inCorso}>
        Aggiungi
      </button>
      <div className="w-full">
        <Errore testo={stato} />
      </div>
    </form>
  );
}

export function NuovoDocumento({ id }: { id: string }) {
  const { form, stato, esegui, inCorso } = useAzione(caricaDocumento.bind(null, id));
  return (
    <form ref={form} action={esegui} className="flex flex-wrap items-center gap-2">
      <input name="file" type="file" required className="text-sm" />
      <button className="bottone" disabled={inCorso}>
        {inCorso ? "Caricamento…" : "Carica"}
      </button>
      <div className="w-full">
        <Errore testo={stato} />
      </div>
    </form>
  );
}
