# TAG Gestionale

App web per gestire commesse, clienti, preventivi, presenze, scadenze e fatturazione.
Next.js + Supabase (database PostgreSQL, login e allegati).

## Stato

- [x] Fase 1: login con ruoli (titolare, ufficio, operaio) e anagrafica clienti
- [x] Fase 2: preventivi con voci, stampa/PDF e conversione in commessa
- [ ] Fase 3: commesse (ore, costi, documenti, margine)
- [ ] Fase 4: presenze
- [ ] Fase 5: scadenze e promemoria
- [ ] Fase 6: fatturazione (poi fattura elettronica SDI tramite servizio esterno)

## Avvio

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Nel suo SQL Editor esegui, in ordine, i file in `supabase/migrations/` (`0001_base.sql`, `0002_preventivi.sql`, ...).
3. In Authentication > Users crea il primo utente: diventa automaticamente **titolare**.
   Gli utenti successivi partono come **operaio**; il ruolo si cambia nella tabella `profili`.
4. Copia `.env.example` in `.env.local` e inserisci URL e chiave anon (Project Settings > API).
5. Metti i dati della tua azienda (intestazione dei preventivi) in `src/lib/azienda.ts`.
6. `npm install` e poi `npm run dev`, quindi apri http://localhost:3000.

## Ruoli

| Ruolo    | Clienti e commesse              | Preventivi                     |
|----------|---------------------------------|--------------------------------|
| titolare | legge, crea, modifica, elimina  | tutto                          |
| ufficio  | legge, crea, modifica           | tutto tranne eliminare         |
| operaio  | solo lettura (senza importi)    | non li vede                    |

I permessi sono applicati nel database (Row Level Security), non solo nell'interfaccia.

## Preventivi

- Numerazione automatica per anno (2026-001, 2026-002, ...).
- Voci con unità di misura, quantità e prezzo; totali con IVA calcolati in automatico.
- "Stampa / PDF" apre una pagina pronta da stampare o salvare come PDF dal browser.
- "Accettato: crea commessa" genera la commessa collegata (codice 2026-001, ...) con l'imponibile come importo previsto; da lì il preventivo non è più modificabile.
