-- Fase 3: ore, costi e documenti delle commesse

-- Costo orario di ogni persona: visibile solo a titolare e ufficio
create table tariffe (
  utente_id uuid primary key references profili on delete cascade,
  costo_orario numeric(10, 2) not null default 0
);

create table ore_commessa (
  id uuid primary key default gen_random_uuid(),
  commessa_id uuid not null references commesse on delete cascade,
  utente_id uuid not null references profili on delete restrict default auth.uid(),
  data date not null default current_date,
  ore numeric(5, 2) not null check (ore > 0 and ore <= 24),
  descrizione text,
  creato_il timestamptz not null default now()
);

create type categoria_costo as enum ('materiale', 'subappalto', 'noleggio', 'trasferta', 'altro');

create table costi_commessa (
  id uuid primary key default gen_random_uuid(),
  commessa_id uuid not null references commesse on delete cascade,
  data date not null default current_date,
  categoria categoria_costo not null default 'materiale',
  descrizione text not null,
  fornitore text,
  importo numeric(12, 2) not null,
  creato_il timestamptz not null default now()
);

create index ore_commessa_idx on ore_commessa (commessa_id, data);
create index ore_utente_idx on ore_commessa (utente_id, data);
create index costi_commessa_idx on costi_commessa (commessa_id, data);

alter table tariffe enable row level security;
alter table ore_commessa enable row level security;
alter table costi_commessa enable row level security;

create policy tariffe_lettura on tariffe for select to authenticated
  using (ruolo_corrente() in ('titolare', 'ufficio'));
create policy tariffe_scrittura on tariffe for all to authenticated
  using (ruolo_corrente() = 'titolare')
  with check (ruolo_corrente() = 'titolare');

-- Ore: l'operaio vede e registra solo le proprie, l'ufficio tutte
create policy ore_lettura on ore_commessa for select to authenticated
  using (utente_id = auth.uid() or ruolo_corrente() in ('titolare', 'ufficio'));
create policy ore_inserimento on ore_commessa for insert to authenticated
  with check (utente_id = auth.uid() or ruolo_corrente() in ('titolare', 'ufficio'));
create policy ore_eliminazione on ore_commessa for delete to authenticated
  using (utente_id = auth.uid() or ruolo_corrente() in ('titolare', 'ufficio'));

create policy costi_ufficio on costi_commessa for all to authenticated
  using (ruolo_corrente() in ('titolare', 'ufficio'))
  with check (ruolo_corrente() in ('titolare', 'ufficio'));

-- Riepilogo economico per commessa (rispetta i permessi di chi lo legge)
create view riepilogo_commesse with (security_invoker = true) as
select
  c.id as commessa_id,
  coalesce((select sum(o.ore) from ore_commessa o where o.commessa_id = c.id), 0) as ore_totali,
  coalesce((
    select sum(o.ore * coalesce(t.costo_orario, 0))
    from ore_commessa o left join tariffe t on t.utente_id = o.utente_id
    where o.commessa_id = c.id
  ), 0) as costo_manodopera,
  coalesce((select sum(k.importo) from costi_commessa k where k.commessa_id = c.id), 0) as costi_diretti
from commesse c;

-- Documenti: bucket privato, un percorso per commessa (commessa_id/nomefile)
insert into storage.buckets (id, name, public) values ('documenti', 'documenti', false)
on conflict (id) do nothing;

create policy documenti_lettura on storage.objects for select to authenticated
  using (bucket_id = 'documenti');
create policy documenti_caricamento on storage.objects for insert to authenticated
  with check (bucket_id = 'documenti');
create policy documenti_eliminazione on storage.objects for delete to authenticated
  using (bucket_id = 'documenti' and ruolo_corrente() in ('titolare', 'ufficio'));
