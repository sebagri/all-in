import { redirect } from "next/navigation";
import { createClient, utenteCorrente } from "@/lib/supabase/server";
import RigaUtente from "./RigaUtente";

export default async function Utenti() {
  const io = await utenteCorrente();
  if (io?.ruolo !== "titolare") redirect("/");
  const supabase = await createClient();
  const [{ data: profili }, { data: tariffe }] = await Promise.all([
    supabase.from("profili").select("id, nome, ruolo").order("nome"),
    supabase.from("tariffe").select("utente_id, costo_orario"),
  ]);
  const costo = new Map((tariffe ?? []).map((t) => [t.utente_id, Number(t.costo_orario)]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Utenti</h1>
      <p className="text-sm text-slate-500">
        Il costo orario serve a calcolare il costo della manodopera sulle commesse; lo vedono solo titolare e ufficio. I nuovi
        utenti si creano dal pannello Supabase (Authentication &gt; Users) e compaiono qui come operai.
      </p>
      <div className="rounded-lg bg-white px-4 shadow">
        {profili?.map((p) => (
          <RigaUtente key={p.id} sonoIo={p.id === io.id} utente={{ ...p, costo_orario: costo.get(p.id) ?? 0 }} />
        ))}
      </div>
    </div>
  );
}
