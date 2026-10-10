import { redirect } from "next/navigation";
import { createClient, utenteCorrente } from "@/lib/supabase/server";
import { NuovaCommessa } from "../Moduli";

export default async function PaginaNuovaCommessa() {
  const utente = await utenteCorrente();
  if (utente?.ruolo === "operaio") redirect("/commesse");
  const supabase = await createClient();
  const { data: clienti } = await supabase.from("clienti").select("id, ragione_sociale").order("ragione_sociale");
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuova commessa</h1>
      <p className="text-sm text-slate-500">Per i lavori senza preventivo. Le altre commesse nascono accettando un preventivo.</p>
      <NuovaCommessa clienti={clienti ?? []} />
    </div>
  );
}
