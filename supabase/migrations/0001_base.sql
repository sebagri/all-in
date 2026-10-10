-- Fase 1: utenti con ruolo e anagrafica clienti

create type ruolo as enum ('titolare', 'ufficio', 'operaio');

create table profili (
  id uuid primary key references auth.users on delete cascade,
  nome text not null default '',
  ruolo ruolo not null default 'operaio',
  creato_il timestamptz not null default now()
);

-- Crea il profilo quando un utente si registra (il primo utente diventa titolare)
create function crea_profilo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profili (id, nome, ruolo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    case when exists (select 1 from profili) then 'operaio'::ruolo else 'titolare'::ruolo end
  );
  return new;
end $$;

create trigger su_nuovo_utente after insert on auth.users
  for each row execute function crea_profilo();

create function ruolo_corrente() returns ruolo
language sql stable security definer set search_path = public as $$
  select ruolo from profili where id = auth.uid()
$$;

create table clienti (
  id uuid primary key default gen_random_uuid(),
  ragione_sociale text not null,
  partita_iva text,
  codice_fiscale text,
  indirizzo text,
  citta text,
  cap text,
  provincia text,
  email text,
  pec text,
  telefono text,
  codice_sdi text,
  note text,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);

create index clienti_ragione_sociale_idx on clienti (lower(ragione_sociale));

alter table profili enable row level security;
alter table clienti enable row level security;

-- Profili: ognuno vede tutti, solo il titolare cambia i ruoli
create policy profili_lettura on profili for select to authenticated using (true);
create policy profili_modifica on profili for update to authenticated
  using (ruolo_corrente() = 'titolare');

-- Clienti: tutti leggono, titolare e ufficio scrivono
create policy clienti_lettura on clienti for select to authenticated using (true);
create policy clienti_inserimento on clienti for insert to authenticated
  with check (ruolo_corrente() in ('titolare', 'ufficio'));
create policy clienti_modifica on clienti for update to authenticated
  using (ruolo_corrente() in ('titolare', 'ufficio'));
create policy clienti_eliminazione on clienti for delete to authenticated
  using (ruolo_corrente() = 'titolare');
