import { redirect } from "next/navigation";
import { createClient, utenteCorrente } from "@/lib/supabase/server";
import NuovoPreventivoForm from "./NuovoPreventivoForm";

export default async function NuovoPreventivo({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const utente = await utenteCorrente();
  if (utente?.ruolo === "operaio") redirect("/");
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const { data: clienti } = await supabase.from("clienti").select("id, ragione_sociale").order("ragione_sociale");

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuovo preventivo</h1>
      <NuovoPreventivoForm clienti={clienti ?? []} clienteIniziale={cliente} />
    </div>
  );
}
