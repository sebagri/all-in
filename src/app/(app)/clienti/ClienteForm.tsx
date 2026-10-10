"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvaCliente } from "./actions";

export type Cliente = Record<string, string | null> & { id?: string };

const sezioni: { label: string; campi: [string, string, string?][] }[] = [
  {
    label: "Dati fiscali",
    campi: [
      ["ragione_sociale", "Ragione sociale *"],
      ["partita_iva", "Partita IVA"],
      ["codice_fiscale", "Codice fiscale"],
      ["codice_sdi", "Codice SDI"],
    ],
  },
  {
    label: "Indirizzo",
    campi: [
      ["indirizzo", "Indirizzo"],
      ["citta", "Città"],
      ["cap", "CAP"],
      ["provincia", "Provincia"],
    ],
  },
  {
    label: "Contatti",
    campi: [
      ["email", "Email", "email"],
      ["pec", "PEC", "email"],
      ["telefono", "Telefono", "tel"],
    ],
  },
];

export default function ClienteForm({ cliente, puoScrivere }: { cliente?: Cliente; puoScrivere: boolean }) {
  const [errore, azione, inCorso] = useActionState(salvaCliente.bind(null, cliente?.id ?? null), null);

  return (
    <form action={azione} className="space-y-6">
      <fieldset disabled={!puoScrivere} className="space-y-6">
        {sezioni.map((s) => (
          <section key={s.label} className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-3 font-medium">{s.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {s.campi.map(([nome, label, tipo]) => (
                <label key={nome} className="text-sm">
                  {label}
                  <input
                    name={nome}
                    type={tipo ?? "text"}
                    defaultValue={cliente?.[nome] ?? ""}
                    required={nome === "ragione_sociale"}
                    className="campo mt-1"
                  />
                </label>
              ))}
            </div>
          </section>
        ))}
        <section className="rounded-lg bg-white p-4 shadow">
          <label className="text-sm">
            Note
            <textarea name="note" rows={3} defaultValue={cliente?.note ?? ""} className="campo mt-1" />
          </label>
        </section>
      </fieldset>
      {errore && <p className="text-sm text-red-600">{errore}</p>}
      <div className="flex gap-3">
        {puoScrivere && (
          <button className="bottone" disabled={inCorso}>
            {inCorso ? "Salvataggio…" : "Salva"}
          </button>
        )}
        <Link href="/clienti" className="bottone-secondario">
          Indietro
        </Link>
      </div>
    </form>
  );
}
