import Link from "next/link";
import { redirect } from "next/navigation";
import { utenteCorrente } from "@/lib/supabase/server";
import { esci } from "@/app/login/actions";

const voci = [
  { href: "/", label: "Home" },
  { href: "/clienti", label: "Clienti" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const utente = await utenteCorrente();
  if (!utente) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-semibold">TAG</span>
          <nav className="flex gap-3 text-sm">
            {voci.map((v) => (
              <Link key={v.href} href={v.href} className="hover:text-blue-700">
                {v.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-slate-500">
              {utente.nome} · {utente.ruolo}
            </span>
            <form action={esci}>
              <button className="text-blue-700 hover:underline">Esci</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
