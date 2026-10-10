"use client";

export default function BottoneStampa() {
  return (
    <button onClick={() => window.print()} className="bottone">
      Stampa o salva PDF
    </button>
  );
}
