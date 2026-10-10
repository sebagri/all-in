import Link from "next/link";
import Stato from "@/components/Stato";
import { createClient, utenteCorrente } from "@/lib/supabase/server";
import { data, euro } from "@/lib/formato";

export default async function Commesse() {
  const utente = await utenteCorrente();
  const supabase = await createClient();
  const { data: commesse } = await supabase
    .from("commesse")
    .select("id, codice, titolo, stato, importo_previsto, data_inizio, clienti(id, ragione_sociale)")
    .order("codice", { ascending: false });
  const vedeImporti = utente?.ruolo !== "operaio";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Commesse</h1>
      <p className="text-sm text-slate-500">Le commesse nascono dai preventivi accettati. La gestione completa arriva con la fase 3.</p>
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-2">Codice</th>
              <th className="px-4 py-2">Titolo</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Inizio</th>
              {vedeImporti && <th className="px-4 py-2 text-right">Importo previsto</th>}
              <th className="px-4 py-2">Stato</th>
            </tr>
          </thead>
          <tbody>
            {commesse?.map((c) => {
              const cliente = c.clienti as unknown as { id: string; ragione_sociale: string } | null;
              return (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{c.codice}</td>
                  <td className="px-4 py-2">{c.titolo}</td>
                  <td className="px-4 py-2">
                    {cliente && (
                      <Link href={`/clienti/${cliente.id}`} className="text-blue-700 hover:underline">
                        {cliente.ragione_sociale}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-2">{data(c.data_inizio)}</td>
                  {vedeImporti && <td className="px-4 py-2 text-right">{euro(c.importo_previsto)}</td>}
                  <td className="px-4 py-2">
                    <Stato stato={c.stato} />
                  </td>
                </tr>
              );
            })}
            {!commesse?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
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
