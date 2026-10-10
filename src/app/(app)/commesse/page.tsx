import Link from "next/link";
import Stato from "@/components/Stato";
import { createClient, utenteCorrente } from "@/lib/supabase/server";
import { data, etichetteStato, euro, statiCommessa } from "@/lib/formato";

export default async function Commesse({ searchParams }: { searchParams: Promise<{ stato?: string }> }) {
  const { stato } = await searchParams;
  const utente = await utenteCorrente();
  const ufficio = utente?.ruolo !== "operaio";
  const supabase = await createClient();

  let query = supabase
    .from("commesse")
    .select("id, codice, titolo, stato, importo_previsto, data_inizio, clienti(ragione_sociale)")
    .order("codice", { ascending: false });
  if (stato && (statiCommessa as readonly string[]).includes(stato)) query = query.eq("stato", stato);
  const [{ data: commesse }, { data: riepiloghi }] = await Promise.all([
    query,
    ufficio ? supabase.from("riepilogo_commesse").select("*") : Promise.resolve({ data: null }),
  ]);
  const speso = new Map(
    (riepiloghi ?? []).map((r) => [r.commessa_id, Number(r.costo_manodopera) + Number(r.costi_diretti)]),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Commesse</h1>
        {ufficio && (
          <Link href="/commesse/nuova" className="bottone ml-auto">
            Nuova commessa
          </Link>
        )}
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href="/commesse" className={!stato ? "font-semibold" : "text-blue-700"}>
          Tutte
        </Link>
        {statiCommessa.map((s) => (
          <Link key={s} href={`/commesse?stato=${s}`} className={stato === s ? "font-semibold" : "text-blue-700"}>
            {etichetteStato[s]}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-2">Codice</th>
              <th className="px-4 py-2">Titolo</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Inizio</th>
              {ufficio && <th className="px-4 py-2 text-right">Previsto</th>}
              {ufficio && <th className="px-4 py-2 text-right">Speso</th>}
              {ufficio && <th className="px-4 py-2 text-right">Margine</th>}
              <th className="px-4 py-2">Stato</th>
            </tr>
          </thead>
          <tbody>
            {commesse?.map((c) => {
              const cliente = c.clienti as unknown as { ragione_sociale: string } | null;
              const s = speso.get(c.id) ?? 0;
              const margine = Number(c.importo_previsto) - s;
              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/commesse/${c.id}`} className="font-medium whitespace-nowrap text-blue-700 hover:underline">
                      {c.codice}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{c.titolo}</td>
                  <td className="px-4 py-2">{cliente?.ragione_sociale}</td>
                  <td className="px-4 py-2">{data(c.data_inizio)}</td>
                  {ufficio && <td className="px-4 py-2 text-right">{euro(c.importo_previsto)}</td>}
                  {ufficio && <td className="px-4 py-2 text-right">{euro(s)}</td>}
                  {ufficio && (
                    <td className={`px-4 py-2 text-right ${margine < 0 ? "text-red-600" : "text-green-700"}`}>
                      {euro(margine)}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <Stato stato={c.stato} />
                  </td>
                </tr>
              );
            })}
            {!commesse?.length && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  Nessuna commessa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
