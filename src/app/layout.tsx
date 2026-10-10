import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAG Gestionale",
  description: "Commesse, clienti, preventivi, presenze, scadenze e fatturazione",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
