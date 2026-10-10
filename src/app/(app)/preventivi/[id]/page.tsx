import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Stato from "@/components/Stato";
import { createClient, utenteCorrente } from "@/lib/supabase/server";
import { accettaPreventivo, cambiaStato, eliminaPreventivo } from "../actions";
import EditorPreventivo from "./EditorPreventivo";

export default async function DettaglioPreventivo({ params }: { params: Promise<{ id: string }> }) {
  const utente = await utenteCorrente();
  if (utente?.ruolo === "operaio") redirect("/");
  const { id } = await params;

  const supabase = await createClient();
  const { data: p } = await supabase
    .from("preventivi")
    .select("*, clienti(id, ragione_sociale), commesse(id, codice), voci_preventivo(descrizione, unita, quantita, prezzo_unitario, posizione)")
    .eq("id", id)
    .single();
  if (!p) notFound();

  const cliente = p.clienti as { id: string; ragione_sociale: string };
  const commessa = p.commesse as { id: string; codice: string } | null;
  const voci = [...p.voci_preventivo]
    .sort((a, b) => a.posizione - b.posizione)
    .map(({ descrizione, unita, quantita, prezzo_unitario }) => ({
      descrizione,
      unita,
      quantita: Number(quantita),
      prezzo_unitario: Number(prezzo_unitario),
    }));
  const bloccato = p.stato === "accettato";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Preventivo {p.numero}</h1>
        <Stato stato={p.stato} />
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={`/stampa/preventivi/${id}`} target="_blank" className="bottone-secondario">
            Stampa / PDF
          </Link>
          {p.stato === "bozza" && (
            <form action={cambiaStato.bind(null, id, "inviato")}>
              <button className="bottone-secondario">Segna come inviato</button>
            </form>
          )}
          {p.stato === "rifiutato" && (
            <form action={cambiaStato.bind(null, id, "bozza")}>
              <button className="bottone-secondario">Riporta in bozza</button>
            </form>
          )}
          {(p.stato === "bozza" || p.stato === "inviato") && (
            <>
              <form action={cambiaStato.bind(null, id, "rifiutato")}>
                <button className="bottone-secondario">Rifiutato</button>
              </form>
              <form action={accettaPreventivo.bind(null, id)}>
                <button className="bottone">Accettato: crea commessa</button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Cliente:{" "}
        <Link href={`/clienti/${cliente.id}`} className="text-blue-700 hover:underline">
          {cliente.ragione_sociale}
        </Link>
        {commessa && (
          <>
            {" · "}Commessa{" "}
            <Link href="/commesse" className="font-medium text-blue-700 hover:underline">
              {commessa.codice}
            </Link>
          </>
        )}
      </p>
      {bloccato && <p className="text-sm text-slate-500">Il preventivo è accettato e non si può più modificare.</p>}

      <EditorPreventivo
        id={id}
        bloccato={bloccato}
        iniziale={{
          oggetto: p.oggetto,
          data: p.data,
          validita_giorni: p.validita_giorni,
          aliquota_iva: Number(p.aliquota_iva),
          note: p.note ?? "",
          voci,
        }}
      />

      {utente?.ruolo === "titolare" && !commessa && (
        <form action={eliminaPreventivo.bind(null, id)}>
          <button className="text-sm text-red-600 hover:underline">Elimina preventivo</button>
        </form>
      )}
    </div>
  );
}
