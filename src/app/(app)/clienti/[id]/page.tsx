import { notFound } from "next/navigation";
import { createClient, utenteCorrente } from "@/lib/supabase/server";
import ClienteForm from "../ClienteForm";
import { eliminaCliente } from "../actions";

export default async function DettaglioCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const utente = await utenteCorrente();
  const { data: cliente } = await supabase.from("clienti").select("*").eq("id", id).single();
  if (!cliente) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{cliente.ragione_sociale}</h1>
        {utente?.ruolo === "titolare" && (
          <form action={eliminaCliente.bind(null, id)} className="ml-auto">
            <button className="text-sm text-red-600 hover:underline">Elimina cliente</button>
          </form>
        )}
      </div>
      <ClienteForm cliente={cliente} puoScrivere={utente?.ruolo !== "operaio"} />
    </div>
  );
}
