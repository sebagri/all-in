"use client";

import { useState, useTransition } from "react";
import { euro, totali, type Voce } from "@/lib/formato";
import { salvaPreventivo, type DatiPreventivo } from "../actions";

const vuota = (): Voce => ({ descrizione: "", unita: "pz", quantita: 1, prezzo_unitario: 0 });

export default function EditorPreventivo({ id, iniziale, bloccato }: { id: string; iniziale: DatiPreventivo; bloccato: boolean }) {
  const [dati, setDati] = useState<DatiPreventivo>({
    ...iniziale,
    voci: iniziale.voci.length ? iniziale.voci : [vuota()],
  });
  const [messaggio, setMessaggio] = useState<{ testo: string; errore: boolean } | null>(null);
  const [modificato, setModificato] = useState(false);
  const [inCorso, startTransition] = useTransition();

  const aggiorna = (parziale: Partial<DatiPreventivo>) => {
    setDati((d) => ({ ...d, ...parziale }));
    setModificato(true);
    setMessaggio(null);
  };
  const aggiornaVoce = (i: number, parziale: Partial<Voce>) =>
    aggiorna({ voci: dati.voci.map((v, j) => (j === i ? { ...v, ...parziale } : v)) });
  const sposta = (i: number, delta: number) => {
    const voci = [...dati.voci];
    const [v] = voci.splice(i, 1);
    voci.splice(i + delta, 0, v);
    aggiorna({ voci });
  };

  const salva = () =>
    startTransition(async () => {
      const { errore } = await salvaPreventivo(id, dati);
      setMessaggio(errore ? { testo: errore, errore: true } : { testo: "Salvato.", errore: false });
      if (!errore) setModificato(false);
    });

  const t = totali(dati.voci, dati.aliquota_iva);

  return (
    <div className="space-y-4">
      <fieldset disabled={bloccato} className="space-y-4">
        <section className="grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-4">
          <label className="text-sm sm:col-span-4">
            Oggetto
            <input value={dati.oggetto} onChange={(e) => aggiorna({ oggetto: e.target.value })} className="campo mt-1" />
          </label>
          <label className="text-sm">
            Data
            <input type="date" value={dati.data} onChange={(e) => aggiorna({ data: e.target.value })} className="campo mt-1" />
          </label>
          <label className="text-sm">
            Validità (giorni)
            <input
              type="number"
              min={0}
              value={dati.validita_giorni}
              onChange={(e) => aggiorna({ validita_giorni: Number(e.target.value) })}
              className="campo mt-1"
            />
          </label>
          <label className="text-sm">
            IVA %
            <input
              type="number"
              min={0}
              step="0.01"
              value={dati.aliquota_iva}
              onChange={(e) => aggiorna({ aliquota_iva: Number(e.target.value) })}
              className="campo mt-1"
            />
          </label>
        </section>

        <section className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Descrizione</th>
                <th className="w-20 px-3 py-2">U.M.</th>
                <th className="w-24 px-3 py-2">Quantità</th>
                <th className="w-32 px-3 py-2">Prezzo unit.</th>
                <th className="w-28 px-3 py-2 text-right">Importo</th>
                <th className="w-24 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {dati.voci.map((v, i) => (
                <tr key={i} className="border-b align-top last:border-0">
                  <td className="px-3 py-2">
                    <textarea
                      rows={1}
                      value={v.descrizione}
                      onChange={(e) => aggiornaVoce(i, { descrizione: e.target.value })}
                      className="campo"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input value={v.unita} onChange={(e) => aggiornaVoce(i, { unita: e.target.value })} className="campo" />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      value={v.quantita}
                      onChange={(e) => aggiornaVoce(i, { quantita: Number(e.target.value) })}
                      className="campo"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={v.prezzo_unitario}
                      onChange={(e) => aggiornaVoce(i, { prezzo_unitario: Number(e.target.value) })}
                      className="campo"
                    />
                  </td>
                  <td className="px-3 py-2 pt-4 text-right">{euro(Number(v.quantita) * Number(v.prezzo_unitario))}</td>
                  <td className="px-3 py-2 pt-3 text-right whitespace-nowrap">
                    <button type="button" title="Su" disabled={i === 0} onClick={() => sposta(i, -1)} className="px-1 disabled:opacity-30">
                      ↑
                    </button>
                    <button
                      type="button"
                      title="Giù"
                      disabled={i === dati.voci.length - 1}
                      onClick={() => sposta(i, 1)}
                      className="px-1 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      title="Rimuovi"
                      onClick={() => aggiorna({ voci: dati.voci.filter((_, j) => j !== i) })}
                      className="px-1 text-red-600"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!bloccato && (
            <div className="p-3">
              <button type="button" onClick={() => aggiorna({ voci: [...dati.voci, vuota()] })} className="bottone-secondario">
                + Aggiungi voce
              </button>
            </div>
          )}
        </section>

        <section className="rounded-lg bg-white p-4 shadow">
          <label className="text-sm">
            Note e condizioni (tempi, pagamento…)
            <textarea rows={3} value={dati.note} onChange={(e) => aggiorna({ note: e.target.value })} className="campo mt-1" />
          </label>
        </section>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <dl className="ml-auto grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-white p-4 text-sm shadow">
          <dt className="text-slate-500">Imponibile</dt>
          <dd className="text-right">{euro(t.imponibile)}</dd>
          <dt className="text-slate-500">IVA {dati.aliquota_iva}%</dt>
          <dd className="text-right">{euro(t.iva)}</dd>
          <dt className="font-semibold">Totale</dt>
          <dd className="text-right font-semibold">{euro(t.totale)}</dd>
        </dl>
      </div>

      {!bloccato && (
        <div className="flex items-center gap-3">
          <button onClick={salva} className="bottone" disabled={inCorso || !modificato}>
            {inCorso ? "Salvataggio…" : "Salva modifiche"}
          </button>
          {messaggio && <span className={`text-sm ${messaggio.errore ? "text-red-600" : "text-green-700"}`}>{messaggio.testo}</span>}
          {modificato && !messaggio && <span className="text-sm text-amber-700">Modifiche non salvate</span>}
        </div>
      )}
    </div>
  );
}
