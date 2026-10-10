import { coloriStato, etichetteStato } from "@/lib/formato";

export default function Stato({ stato }: { stato: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${coloriStato[stato] ?? ""}`}>
      {etichetteStato[stato] ?? stato}
    </span>
  );
}
