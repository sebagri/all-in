import Link from "next/link";
import { createClient, utenteCorrente } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const utente = await utenteCorrente();
  const { count } = await supabase.from("clienti").select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Ciao {utente?.nome}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/clienti" className="rounded-lg bg-white p-4 shadow hover:shadow-md">
          <div className="text-sm text-slate-500">Clienti</div>
          <div className="text-3xl font-semibold">{count ?? 0}</div>
        </Link>
      </div>
    </div>
  );
}
