"use client";

import Link from "next/link";
import { useActionState } from "react";
import { creaPreventivo } from "../actions";

export default function NuovoPreventivoForm({
  clienti,
  clienteIniziale,
}: {
  clienti: { id: string; ragione_sociale: string }[];
  clienteIniziale?: string;
}) {
  const [errore, azione, inCorso] = useActionState(creaPreventivo, null);
  return (
    <form action={azione} className="space-y-4 rounded-lg bg-white p-4 shadow">
      <label className="block text-sm">
        Cliente *
        <select name="cliente_id" required defaultValue={clienteIniziale ?? ""} className="campo mt-1">
          <option value="">Scegli…</option>
          {clienti.map((c) => (
            <option key={c.id} value={c.id}>
              {c.ragione_sociale}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Oggetto *
        <input name="oggetto" required placeholder="Es. Rifacimento impianto elettrico" className="campo mt-1" />
      </label>
      {errore && <p className="text-sm text-red-600">{errore}</p>}
      <div className="flex gap-3">
        <button className="bottone" disabled={inCorso}>
          {inCorso ? "Creazione…" : "Crea e aggiungi voci"}
        </button>
        <Link href="/preventivi" className="bottone-secondario">
          Annulla
        </Link>
      </div>
      {!clienti.length && (
        <p className="text-sm text-slate-500">
          Nessun cliente ancora: <Link href="/clienti/nuovo" className="text-blue-700 underline">creane uno</Link>.
        </p>
      )}
    </form>
  );
}
