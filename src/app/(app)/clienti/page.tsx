import Link from "next/link";
import { createClient, utenteCorrente } from "@/lib/supabase/server";

export default async function Clienti({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  const utente = await utenteCorrente();

  let query = supabase
    .from("clienti")
    .select("id, ragione_sociale, partita_iva, citta, telefono, email")
    .order("ragione_sociale");
  if (q) {
    const termine = q.replace(/[,%()]/g, " ");
    query = query.or(`ragione_sociale.ilike.%${termine}%,partita_iva.ilike.%${termine}%,citta.ilike.%${termine}%`);
  }
  const { data: clienti } = await query;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Clienti</h1>
        {utente?.ruolo !== "operaio" && (
          <Link href="/clienti/nuovo" className="bottone ml-auto">
            Nuovo cliente
          </Link>
        )}
      </div>
      <form>
        <input name="q" defaultValue={q} placeholder="Cerca per nome, P.IVA o città" className="campo max-w-md" />
      </form>
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-2">Ragione sociale</th>
              <th className="px-4 py-2">P.IVA</th>
              <th className="px-4 py-2">Città</th>
              <th className="px-4 py-2">Telefono</th>
              <th className="px-4 py-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {clienti?.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/clienti/${c.id}`} className="font-medium text-blue-700 hover:underline">
                    {c.ragione_sociale}
                  </Link>
                </td>
                <td className="px-4 py-2">{c.partita_iva}</td>
                <td className="px-4 py-2">{c.citta}</td>
                <td className="px-4 py-2">{c.telefono}</td>
                <td className="px-4 py-2">{c.email}</td>
              </tr>
            ))}
            {!clienti?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Nessun cliente trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
