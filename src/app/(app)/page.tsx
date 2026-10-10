import Link from "next/link";
import { createClient, utenteCorrente } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const utente = await utenteCorrente();
  const conta = async (tabella: string, filtro?: [string, string[]]) => {
    let q = supabase.from(tabella).select("*", { count: "exact", head: true });
    if (filtro) q = q.in(filtro[0], filtro[1]);
    return (await q).count ?? 0;
  };
  const [clienti, preventiviAperti, commesseAttive] = await Promise.all([
    conta("clienti"),
    conta("preventivi", ["stato", ["bozza", "inviato"]]),
    conta("commesse", ["stato", ["aperta", "in_corso"]]),
  ]);

  const riquadri = [
    { href: "/clienti", label: "Clienti", valore: clienti },
    ...(utente?.ruolo !== "operaio"
      ? [{ href: "/preventivi", label: "Preventivi da chiudere", valore: preventiviAperti }]
      : []),
    { href: "/commesse", label: "Commesse attive", valore: commesseAttive },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Ciao {utente?.nome}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {riquadri.map((r) => (
          <Link key={r.href} href={r.href} className="rounded-lg bg-white p-4 shadow hover:shadow-md">
            <div className="text-sm text-slate-500">{r.label}</div>
            <div className="text-3xl font-semibold">{r.valore}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
