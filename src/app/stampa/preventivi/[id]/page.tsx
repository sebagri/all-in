import { notFound } from "next/navigation";
import { azienda } from "@/lib/azienda";
import { data, euro, totali } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import BottoneStampa from "./BottoneStampa";

export default async function StampaPreventivo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("preventivi")
    .select("*, clienti(*), voci_preventivo(*)")
    .eq("id", id)
    .single();
  if (!p) notFound();

  const c = p.clienti as Record<string, string | null>;
  const voci = [...p.voci_preventivo].sort((a, b) => a.posizione - b.posizione);
  const t = totali(voci, Number(p.aliquota_iva));

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm print:p-0">
      <title>{`Preventivo ${p.numero}`}</title>
      <div className="mb-6 flex justify-end print:hidden">
        <BottoneStampa />
      </div>
      <header className="flex justify-between gap-8">
        <div>
          <div className="text-xl font-bold">{azienda.nome}</div>
          <div>{azienda.indirizzo}</div>
          <div>P.IVA {azienda.partitaIva}</div>
          {azienda.telefono && <div>Tel. {azienda.telefono}</div>}
          {azienda.email && <div>{azienda.email}</div>}
        </div>
        <div className="text-right">
          <div className="text-slate-500">Spett.le</div>
          <div className="font-semibold">{c.ragione_sociale}</div>
          {c.indirizzo && <div>{c.indirizzo}</div>}
          {(c.cap || c.citta) && (
            <div>
              {c.cap} {c.citta} {c.provincia && `(${c.provincia})`}
            </div>
          )}
          {c.partita_iva && <div>P.IVA {c.partita_iva}</div>}
        </div>
      </header>

      <h1 className="mt-8 text-lg font-semibold">
        Preventivo n. {p.numero} del {data(p.data)}
      </h1>
      <p className="mt-1">
        <span className="text-slate-500">Oggetto:</span> {p.oggetto}
      </p>

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-800 text-left">
            <th className="py-2">Descrizione</th>
            <th className="py-2 text-center">U.M.</th>
            <th className="py-2 text-right">Q.tà</th>
            <th className="py-2 text-right">Prezzo</th>
            <th className="py-2 text-right">Importo</th>
          </tr>
        </thead>
        <tbody>
          {voci.map((v) => (
            <tr key={v.id} className="border-b border-slate-200 align-top">
              <td className="py-2 pr-4 whitespace-pre-line">{v.descrizione}</td>
              <td className="py-2 text-center">{v.unita}</td>
              <td className="py-2 text-right">{Number(v.quantita).toLocaleString("it-IT")}</td>
              <td className="py-2 pl-4 text-right whitespace-nowrap">{euro(v.prezzo_unitario)}</td>
              <td className="py-2 pl-4 text-right whitespace-nowrap">{euro(Number(v.quantita) * Number(v.prezzo_unitario))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 ml-auto grid w-64 grid-cols-2 gap-y-1">
        <dt>Imponibile</dt>
        <dd className="text-right">{euro(t.imponibile)}</dd>
        <dt>IVA {Number(p.aliquota_iva)}%</dt>
        <dd className="text-right">{euro(t.iva)}</dd>
        <dt className="border-t border-slate-800 pt-1 font-bold">Totale</dt>
        <dd className="border-t border-slate-800 pt-1 text-right font-bold">{euro(t.totale)}</dd>
      </dl>

      {p.note && <p className="mt-8 whitespace-pre-line">{p.note}</p>}
      <p className="mt-8 text-slate-500">Offerta valida {p.validita_giorni} giorni dalla data del preventivo.</p>

      <div className="mt-16 flex justify-end">
        <div className="w-64 border-t border-slate-400 pt-1 text-center text-slate-500">Timbro e firma per accettazione</div>
      </div>
    </div>
  );
}
