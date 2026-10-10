import Link from "next/link";
import { redirect } from "next/navigation";
import Stato from "@/components/Stato";
import { createClient, utenteCorrente } from "@/lib/supabase/server";
import { data, euro, etichetteStato } from "@/lib/formato";

const stati = ["bozza", "inviato", "accettato", "rifiutato"];

export default async function Preventivi({ searchParams }: { searchParams: Promise<{ stato?: string }> }) {
  const utente = await utenteCorrente();
  if (utente?.ruolo === "operaio") redirect("/");
  const { stato } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("preventivi")
    .select("id, numero, data, oggetto, stato, clienti(ragione_sociale), voci_preventivo(quantita, prezzo_unitario)")
    .order("numero", { ascending: false });
  if (stato && stati.includes(stato)) query = query.eq("stato", stato);
  const { data: preventivi } = await query;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Preventivi</h1>
        <Link href="/preventivi/nuovo" className="bottone ml-auto">
          Nuovo preventivo
        </Link>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href="/preventivi" className={!stato ? "font-semibold" : "text-blue-700"}>
          Tutti
        </Link>
        {stati.map((s) => (
          <Link key={s} href={`/preventivi?stato=${s}`} className={stato === s ? "font-semibold" : "text-blue-700"}>
            {etichetteStato[s]}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-2">Numero</th>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Oggetto</th>
              <th className="px-4 py-2 text-right">Imponibile</th>
              <th className="px-4 py-2">Stato</th>
            </tr>
          </thead>
          <tbody>
            {preventivi?.map((p) => {
              const imponibile = p.voci_preventivo.reduce((s, v) => s + Number(v.quantita) * Number(v.prezzo_unitario), 0);
              const cliente = p.clienti as unknown as { ragione_sociale: string } | null;
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/preventivi/${p.id}`} className="font-medium text-blue-700 hover:underline">
                      {p.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{data(p.data)}</td>
                  <td className="px-4 py-2">{cliente?.ragione_sociale}</td>
                  <td className="px-4 py-2">{p.oggetto}</td>
                  <td className="px-4 py-2 text-right">{euro(imponibile)}</td>
                  <td className="px-4 py-2">
                    <Stato stato={p.stato} />
                  </td>
                </tr>
              );
            })}
            {!preventivi?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Nessun preventivo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
