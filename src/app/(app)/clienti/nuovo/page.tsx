import { redirect } from "next/navigation";
import { utenteCorrente } from "@/lib/supabase/server";
import ClienteForm from "../ClienteForm";

export default async function NuovoCliente() {
  const utente = await utenteCorrente();
  if (utente?.ruolo === "operaio") redirect("/clienti");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nuovo cliente</h1>
      <ClienteForm puoScrivere />
    </div>
  );
}
