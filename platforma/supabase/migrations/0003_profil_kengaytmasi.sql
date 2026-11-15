-- ============================================================
-- Profil kengaytmasi: ommaviy profil, ko'nikmalar, loyihalar
-- ============================================================

alter table public.profillar
  add column if not exists username text unique,
  add column if not exists bio text,
  add column if not exists kasb text,
  add column if not exists talim text,
  add column if not exists joylashuv text,
  add column if not exists maqsad text,
  add column if not exists tillar text[] not null default '{}',
  add column if not exists qiziqishlar text[] not null default '{}',
  add column if not exists hamkorlikka_ochiq boolean not null default false,
  add column if not exists muqova_url text,
  add column if not exists havolalar jsonb not null default '{}'::jsonb,
  add column if not exists oxirgi_faollik timestamptz;

-- Username shakli: 3-20 belgi, kichik lotin harflari, raqam va pastki chiziq
alter table public.profillar
  add constraint username_shakli
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');

create index if not exists profillar_username_idx on public.profillar (username);

-- Ommaviy profil: profilni hamma ko'ra oladi (tahrirlash avvalgidek o'ziniki)
drop policy if exists "profil_select" on public.profillar;
create policy "profil_select" on public.profillar for select using (true);

-- --- Ko'nikmalar ---------------------------------------------

create type public.konikma_turkumi as enum (
  'til', 'texnologiya', 'dizayn', 'yumshoq'
);

create table public.konikmalar (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references public.profillar (id) on delete cascade,
  nom text not null,
  turkum public.konikma_turkumi not null default 'texnologiya',
  daraja public.daraja_turi not null default 'boshlangich',
  yaratilgan timestamptz not null default now(),
  unique (profil_id, nom)
);

create index konikmalar_profil_idx on public.konikmalar (profil_id);

alter table public.konikmalar enable row level security;

create policy "konikma_select" on public.konikmalar for select using (true);
create policy "konikma_insert" on public.konikmalar for insert
  with check (profil_id = auth.uid());
create policy "konikma_update" on public.konikmalar for update
  using (profil_id = auth.uid()) with check (profil_id = auth.uid());
create policy "konikma_delete" on public.konikmalar for delete
  using (profil_id = auth.uid() or public.admin_mi());

-- --- Loyihalar (portfolio) -----------------------------------

create type public.loyiha_holati as enum ('goya', 'jarayonda', 'tugallangan');

create table public.loyihalar (
  id uuid primary key default gen_random_uuid(),
  muallif_id uuid not null references public.profillar (id) on delete cascade,
  nom text not null,
  tavsif text not null default '',
  texnologiyalar text[] not null default '{}',
  turkum text not null default 'Umumiy',
  holat public.loyiha_holati not null default 'jarayonda',
  github_url text,
  demo_url text,
  muqova_url text,
  yaratilgan timestamptz not null default now()
);

create index loyihalar_muallif_idx on public.loyihalar (muallif_id);
create index loyihalar_sana_idx on public.loyihalar (yaratilgan desc);

alter table public.loyihalar enable row level security;

create policy "loyiha_select" on public.loyihalar for select using (true);
create policy "loyiha_insert" on public.loyihalar for insert
  with check (muallif_id = auth.uid());
create policy "loyiha_update" on public.loyihalar for update
  using (muallif_id = auth.uid()) with check (muallif_id = auth.uid());
create policy "loyiha_delete" on public.loyihalar for delete
  using (muallif_id = auth.uid() or public.admin_mi());
