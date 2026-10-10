# TAG Gestionale

App web per gestire commesse, clienti, preventivi, presenze, scadenze e fatturazione.
Next.js + Supabase (database PostgreSQL, login e allegati).

## Stato

- [x] Fase 1: login con ruoli (titolare, ufficio, operaio) e anagrafica clienti
- [ ] Fase 2: preventivi (PDF, conversione in commessa)
- [ ] Fase 3: commesse (ore, costi, documenti, margine)
- [ ] Fase 4: presenze
- [ ] Fase 5: scadenze e promemoria
- [ ] Fase 6: fatturazione (poi fattura elettronica SDI tramite servizio esterno)

## Avvio

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Nel suo SQL Editor esegui `supabase/migrations/0001_base.sql`.
3. In Authentication > Users crea il primo utente: diventa automaticamente **titolare**.
   Gli utenti successivi partono come **operaio**; il ruolo si cambia nella tabella `profili`.
4. Copia `.env.example` in `.env.local` e inserisci URL e chiave anon (Project Settings > API).
5. `npm install` e poi `npm run dev`, quindi apri http://localhost:3000.

## Ruoli

| Ruolo    | Clienti                         |
|----------|---------------------------------|
| titolare | legge, crea, modifica, elimina  |
| ufficio  | legge, crea, modifica           |
| operaio  | solo lettura                    |

I permessi sono applicati nel database (Row Level Security), non solo nell'interfaccia.
