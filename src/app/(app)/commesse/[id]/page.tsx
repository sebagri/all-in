import Link from "next/link";
import { notFound } from "next/navigation";
import Stato from "@/components/Stato";
import { createClient, utenteCorrente } from "@/lib/supabase/server";
import { data, etichetteCategoria, euro } from "@/lib/formato";
import { eliminaCosto, eliminaDocumento, eliminaOre } from "../actions";
import { DatiCommessa, NuoveOre, NuovoCosto, NuovoDocumento } from "../Moduli";

const numero = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 2 });

export default async function DettaglioCommessa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const utente = await utenteCorrente();
  const ufficio = utente?.ruolo !== "operaio";
  const supabase = await createClient();

  const [{ data: c }, { data: ore }, costi, riepilogo, persone, documenti] = await Promise.all([
    supabase
      .from("commesse")
      .select("*, clienti(id, ragione_sociale), preventivi(id, numero)")
      .eq("id", id)
      .single(),
    supabase
      .from("ore_commessa")
      .select("id, data, ore, descrizione, utente_id, profili(nome)")
      .eq("commessa_id", id)
      .order("data", { ascending: false }),
    ufficio
      ? supabase.from("costi_commessa").select("*").eq("commessa_id", id).order("data", { ascending: false })
      : Promise.resolve({ data: null }),
    supabase.from("riepilogo_commesse").select("*").eq("commessa_id", id).single(),
    ufficio ? supabase.from("profili").select("id, nome").order("nome") : Promise.resolve({ data: null }),
    supabase.storage.from("documenti").list(id, { sortBy: { column: "created_at", order: "desc" } }),
  ]);
  if (!c) notFound();

  const cliente = c.clienti as { id: string; ragione_sociale: string };
  const preventivo = (c.preventivi as { id: string; numero: string }[] | null)?.[0];
  const r = riepilogo.data ?? { ore_totali: 0, costo_manodopera: 0, costi_diretti: 0 };
  const previsto = Number(c.importo_previsto);
  const speso = Number(r.costo_manodopera) + Number(r.costi_diretti);
  const margine = previsto - speso;

  const fileDocumenti = (documenti.data ?? []).filter((f) => f.id);
  const link = await Promise.all(
    fileDocumenti.map(async (f) => {
      const { data: s } = await supabase.storage.from("documenti").createSignedUrl(`${id}/${f.name}`, 3600);
      return s?.signedUrl;
    }),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {c.codice} · {c.titolo}
          </h1>
          <Stato stato={c.stato} />
        </div>
        <p className="text-sm text-slate-600">
          Cliente:{" "}
          <Link href={`/clienti/${cliente.id}`} className="text-blue-700 hover:underline">
            {cliente.ragione_sociale}
          </Link>
          {ufficio && preventivo && (
            <>
              {" · "}Preventivo{" "}
              <Link href={`/preventivi/${preventivo.id}`} className="text-blue-700 hover:underline">
                {preventivo.numero}
              </Link>
            </>
          )}
          {" · "}dal {data(c.data_inizio)}
        </p>
      </div>

      {ufficio ? (
        <section className="grid gap-4 sm:grid-cols-4">
          <Riquadro titolo="Importo previsto" valore={euro(previsto)} />
          <Riquadro titolo={`Manodopera (${numero(Number(r.ore_totali))} h)`} valore={euro(r.costo_manodopera)} />
          <Riquadro titolo="Altri costi" valore={euro(r.costi_diretti)} />
          <Riquadro
            titolo={`Margine${previsto ? ` (${Math.round((margine / previsto) * 100)}%)` : ""}`}
            valore={euro(margine)}
            colore={margine < 0 ? "text-red-600" : "text-green-700"}
          />
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-4">
          <Riquadro titolo="Le tue ore su questa commessa" valore={`${numero(Number(r.ore_totali))} h`} />
        </section>
      )}

      {ufficio && (
        <DatiCommessa
          id={id}
          commessa={{
            titolo: c.titolo,
            stato: c.stato,
            importo_previsto: previsto,
            data_inizio: c.data_inizio,
            note: c.note,
          }}
        />
      )}

      <Sezione titolo="Ore lavorate">
        <NuoveOre id={id} persone={persone.data} />
        <Tabella
          intestazioni={["Data", "Persona", "Ore", "Lavoro svolto", ""]}
          vuota="Nessuna ora registrata."
          righe={(ore ?? []).map((o) => [
            data(o.data),
            (o.profili as unknown as { nome: string } | null)?.nome ?? "",
            numero(Number(o.ore)),
            o.descrizione ?? "",
            ufficio || o.utente_id === utente?.id ? <Elimina key="x" azione={eliminaOre.bind(null, id, o.id)} /> : null,
          ])}
        />
      </Sezione>

      {ufficio && (
        <Sezione titolo="Costi (materiali, subappalti, noleggi…)">
          <NuovoCosto id={id} />
          <Tabella
            intestazioni={["Data", "Categoria", "Descrizione", "Fornitore", "Importo", ""]}
            vuota="Nessun costo registrato."
            righe={(costi.data ?? []).map((k) => [
              data(k.data),
              etichetteCategoria[k.categoria],
              k.descrizione,
              k.fornitore ?? "",
              euro(k.importo),
              <Elimina key="x" azione={eliminaCosto.bind(null, id, k.id)} />,
            ])}
          />
        </Sezione>
      )}

      <Sezione titolo="Documenti e foto">
        <NuovoDocumento id={id} />
        <ul className="divide-y text-sm">
          {fileDocumenti.map((f, i) => (
            <li key={f.id} className="flex items-center gap-3 py-2">
              <a href={link[i]} target="_blank" className="text-blue-700 hover:underline">
                {f.name.replace(/^\d+-/, "")}
              </a>
              <span className="text-slate-500">{data(f.created_at)}</span>
              {ufficio && (
                <form action={eliminaDocumento.bind(null, id, `${id}/${f.name}`)} className="ml-auto">
                  <button className="text-red-600 hover:underline">Elimina</button>
                </form>
              )}
            </li>
          ))}
          {!fileDocumenti.length && <li className="py-2 text-slate-500">Nessun documento.</li>}
        </ul>
      </Sezione>
    </div>
  );
}

function Riquadro({ titolo, valore, colore = "" }: { titolo: string; valore: string; colore?: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="text-sm text-slate-500">{titolo}</div>
      <div className={`text-2xl font-semibold ${colore}`}>{valore}</div>
    </div>
  );
}

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg bg-white p-4 shadow">
      <h2 className="font-medium">{titolo}</h2>
      {children}
    </section>
  );
}

function Tabella({ intestazioni, righe, vuota }: { intestazioni: string[]; righe: React.ReactNode[][]; vuota: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-slate-600">
          <tr>
            {intestazioni.map((h, i) => (
              <th key={i} className="px-2 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {r.map((v, j) => (
                <td key={j} className="px-2 py-2">
                  {v}
                </td>
              ))}
            </tr>
          ))}
          {!righe.length && (
            <tr>
              <td colSpan={intestazioni.length} className="px-2 py-4 text-slate-500">
                {vuota}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Elimina({ azione }: { azione: () => Promise<void> }) {
  return (
    <form action={azione} className="text-right">
      <button className="text-red-600 hover:underline">Elimina</button>
    </form>
  );
}
