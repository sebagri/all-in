"use client";

import { useActionState } from "react";
import { salvaUtente } from "./actions";

export default function RigaUtente({
  utente,
  sonoIo,
}: {
  utente: { id: string; nome: string; ruolo: string; costo_orario: number };
  sonoIo: boolean;
}) {
  const [esito, azione, inCorso] = useActionState(salvaUtente.bind(null, utente.id), null);
  return (
    <form action={azione} className="flex flex-wrap items-end gap-3 border-b py-3 last:border-0">
      <label className="min-w-48 flex-1 text-sm">
        Nome
        <input name="nome" defaultValue={utente.nome} className="campo mt-1" />
      </label>
      <label className="text-sm">
        Ruolo
        <select name="ruolo" defaultValue={utente.ruolo} disabled={sonoIo} className="campo mt-1">
          <option value="titolare">Titolare</option>
          <option value="ufficio">Ufficio</option>
          <option value="operaio">Operaio</option>
        </select>
        {sonoIo && <input type="hidden" name="ruolo" value={utente.ruolo} />}
      </label>
      <label className="w-32 text-sm">
        Costo orario €
        <input name="costo_orario" inputMode="decimal" defaultValue={utente.costo_orario} className="campo mt-1" />
      </label>
      <button className="bottone-secondario" disabled={inCorso}>
        Salva
      </button>
      {esito && <span className={`text-sm ${esito === "Salvato." ? "text-green-700" : "text-red-600"}`}>{esito}</span>}
    </form>
  );
}
