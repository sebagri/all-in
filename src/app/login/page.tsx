"use client";

import { useActionState } from "react";
import { accedi } from "./actions";

export default function LoginPage() {
  const [errore, azione, inCorso] = useActionState(accedi, null);
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form action={azione} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">TAG Gestionale</h1>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="campo mt-1" />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" required className="campo mt-1" />
        </label>
        {errore && <p className="text-sm text-red-600">{errore}</p>}
        <button className="bottone w-full" disabled={inCorso}>
          {inCorso ? "Accesso…" : "Accedi"}
        </button>
      </form>
    </main>
  );
}
