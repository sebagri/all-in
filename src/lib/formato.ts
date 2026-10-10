const euroFmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", useGrouping: "always" });
const dataFmt = new Intl.DateTimeFormat("it-IT");

export const euro = (n: number | string | null | undefined) => euroFmt.format(Number(n ?? 0));
export const data = (d: string | null | undefined) => (d ? dataFmt.format(new Date(d)) : "");

export type Voce = { descrizione: string; unita: string; quantita: number; prezzo_unitario: number };

export function totali(voci: Voce[], aliquotaIva: number) {
  const imponibile = voci.reduce((s, v) => s + Number(v.quantita) * Number(v.prezzo_unitario), 0);
  const iva = Math.round(imponibile * aliquotaIva) / 100;
  return { imponibile, iva, totale: imponibile + iva };
}

export const etichetteStato: Record<string, string> = {
  bozza: "Bozza",
  inviato: "Inviato",
  accettato: "Accettato",
  rifiutato: "Rifiutato",
  aperta: "Aperta",
  in_corso: "In corso",
  completata: "Completata",
  annullata: "Annullata",
};

export const coloriStato: Record<string, string> = {
  bozza: "bg-slate-100 text-slate-700",
  inviato: "bg-blue-100 text-blue-800",
  accettato: "bg-green-100 text-green-800",
  rifiutato: "bg-red-100 text-red-800",
  aperta: "bg-blue-100 text-blue-800",
  in_corso: "bg-amber-100 text-amber-800",
  completata: "bg-green-100 text-green-800",
  annullata: "bg-slate-100 text-slate-700",
};

export const categorieCosto = ["materiale", "subappalto", "noleggio", "trasferta", "altro"] as const;
export const etichetteCategoria: Record<string, string> = {
  materiale: "Materiale",
  subappalto: "Subappalto",
  noleggio: "Noleggio",
  trasferta: "Trasferta",
  altro: "Altro",
};
export const statiCommessa = ["aperta", "in_corso", "completata", "annullata"] as const;
export const oggi = () => new Date().toISOString().slice(0, 10);
