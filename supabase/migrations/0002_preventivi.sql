-- Fase 2: preventivi con voci e conversione in commessa

create type stato_preventivo as enum ('bozza', 'inviato', 'accettato', 'rifiutato');
create type stato_commessa as enum ('aperta', 'in_corso', 'completata', 'annullata');

create table commesse (
  id uuid primary key default gen_random_uuid(),
  codice text not null unique,
  cliente_id uuid not null references clienti on delete restrict,
  titolo text not null,
  stato stato_commessa not null default 'aperta',
  importo_previsto numeric(12, 2) not null default 0,
  data_inizio date not null default current_date,
  note text,
  creato_il timestamptz not null default now()
);

create table preventivi (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  cliente_id uuid not null references clienti on delete restrict,
  data date not null default current_date,
  validita_giorni int not null default 30,
  oggetto text not null,
  note text,
  aliquota_iva numeric(5, 2) not null default 22,
  stato stato_preventivo not null default 'bozza',
  commessa_id uuid references commesse on delete set null,
  creato_il timestamptz not null default now()
);

create table voci_preventivo (
  id uuid primary key default gen_random_uuid(),
  preventivo_id uuid not null references preventivi on delete cascade,
  posizione int not null,
  descrizione text not null,
  unita text not null default 'pz',
  quantita numeric(12, 3) not null default 1,
  prezzo_unitario numeric(12, 2) not null default 0
);

create index voci_preventivo_idx on voci_preventivo (preventivo_id, posizione);
create index preventivi_cliente_idx on preventivi (cliente_id);
create index commesse_cliente_idx on commesse (cliente_id);

-- Numerazione progressiva per anno: 2026-001, 2026-002, ...
create function prossimo_numero(tabella text, anno int) returns text
language plpgsql as $$
declare
  ultimo int;
begin
  perform pg_advisory_xact_lock(hashtext(tabella || anno));
  execute format(
    'select coalesce(max(split_part(%s, ''-'', 2)::int), 0) from %I where %s like $1',
    case when tabella = 'commesse' then 'codice' else 'numero' end,
    tabella,
    case when tabella = 'commesse' then 'codice' else 'numero' end
  ) into ultimo using anno || '-%';
  return anno || '-' || lpad((ultimo + 1)::text, 3, '0');
end $$;

create function numera_preventivo() returns trigger language plpgsql as $$
begin
  if new.numero is null or new.numero = '' then
    new.numero := prossimo_numero('preventivi', extract(year from new.data)::int);
  end if;
  return new;
end $$;

create trigger preventivi_numero before insert on preventivi
  for each row execute function numera_preventivo();

create function numera_commessa() returns trigger language plpgsql as $$
begin
  if new.codice is null or new.codice = '' then
    new.codice := prossimo_numero('commesse', extract(year from new.data_inizio)::int);
  end if;
  return new;
end $$;

create trigger commesse_codice before insert on commesse
  for each row execute function numera_commessa();

-- Accetta un preventivo: crea la commessa collegata con l'importo imponibile
create function accetta_preventivo(p_id uuid) returns uuid
language plpgsql as $$
declare
  p preventivi;
  nuova uuid;
begin
  select * into p from preventivi where id = p_id for update;
  if p is null then raise exception 'Preventivo non trovato'; end if;
  if p.commessa_id is not null then return p.commessa_id; end if;

  insert into commesse (codice, cliente_id, titolo, importo_previsto)
  values (
    '', p.cliente_id, p.oggetto,
    (select coalesce(sum(quantita * prezzo_unitario), 0) from voci_preventivo where preventivo_id = p_id)
  )
  returning id into nuova;

  update preventivi set stato = 'accettato', commessa_id = nuova where id = p_id;
  return nuova;
end $$;

alter table commesse enable row level security;
alter table preventivi enable row level security;
alter table voci_preventivo enable row level security;

-- Preventivi e voci: solo titolare e ufficio (gli operai non vedono i prezzi)
create policy preventivi_ufficio on preventivi for all to authenticated
  using (ruolo_corrente() in ('titolare', 'ufficio'))
  with check (ruolo_corrente() in ('titolare', 'ufficio'));
create policy voci_ufficio on voci_preventivo for all to authenticated
  using (ruolo_corrente() in ('titolare', 'ufficio'))
  with check (ruolo_corrente() in ('titolare', 'ufficio'));

-- Commesse: tutti leggono, titolare e ufficio scrivono
create policy commesse_lettura on commesse for select to authenticated using (true);
create policy commesse_inserimento on commesse for insert to authenticated
  with check (ruolo_corrente() in ('titolare', 'ufficio'));
create policy commesse_modifica on commesse for update to authenticated
  using (ruolo_corrente() in ('titolare', 'ufficio'));
create policy commesse_eliminazione on commesse for delete to authenticated
  using (ruolo_corrente() = 'titolare');
