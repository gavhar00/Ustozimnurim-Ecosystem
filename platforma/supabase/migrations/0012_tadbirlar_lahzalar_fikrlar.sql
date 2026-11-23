-- Tadbirlar, lahzalar galereyasi (rozilik bilan) va fikr-mulohazalar.

-- --- Tadbirlar -------------------------------------------------
create table if not exists public.tadbirlar (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null check (char_length(nom) between 3 and 150),
  tavsif text not null check (char_length(tavsif) between 10 and 4000),
  joy text,
  boshlanish timestamptz not null,
  sigim integer check (sigim is null or sigim > 0),
  holat text not null default 'qoralama' check (holat in ('qoralama', 'chop_etilgan')),
  yaratilgan timestamptz not null default now()
);
alter table public.tadbirlar enable row level security;

create policy "tadbir_oqish" on public.tadbirlar for select
  using (holat = 'chop_etilgan' or public.admin_mi());
create policy "tadbir_admin_yozadi" on public.tadbirlar for insert
  with check (public.admin_mi());
create policy "tadbir_admin_yangilaydi" on public.tadbirlar for update
  using (public.admin_mi()) with check (public.admin_mi());
create policy "tadbir_admin_ochiradi" on public.tadbirlar for delete
  using (public.admin_mi());

create table if not exists public.tadbir_royxati (
  id uuid primary key default gen_random_uuid(),
  tadbir_id uuid not null references public.tadbirlar (id) on delete cascade,
  profil_id uuid not null default auth.uid() references public.profillar (id) on delete cascade,
  yaratilgan timestamptz not null default now(),
  unique (tadbir_id, profil_id)
);
alter table public.tadbir_royxati enable row level security;

create policy "royxat_oqish" on public.tadbir_royxati for select
  using (profil_id = auth.uid() or public.admin_mi());
create policy "royxat_ozi_yoziladi" on public.tadbir_royxati for insert
  with check (
    profil_id = auth.uid()
    and exists (select 1 from public.tadbirlar t
                where t.id = tadbir_id and t.holat = 'chop_etilgan' and t.boshlanish > now())
  );
create policy "royxat_ozi_chiqadi" on public.tadbir_royxati for delete
  using (profil_id = auth.uid() or public.admin_mi());

-- Sig'imdan oshib ketmasligi uchun.
create or replace function public.tadbir_sigimini_tekshir()
returns trigger language plpgsql security definer set search_path = '' as $$
declare s integer; n integer;
begin
  select sigim into s from public.tadbirlar where id = new.tadbir_id;
  if s is not null then
    select count(*) into n from public.tadbir_royxati where tadbir_id = new.tadbir_id;
    if n >= s then
      raise exception 'Tadbirda joy qolmagan';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists tadbir_sigimi on public.tadbir_royxati;
create trigger tadbir_sigimi before insert on public.tadbir_royxati
  for each row execute function public.tadbir_sigimini_tekshir();
revoke execute on function public.tadbir_sigimini_tekshir() from anon, authenticated;

-- Ro'yxatdan o'tganlar soni (boshqalarning shaxsiy ma'lumotisiz).
create or replace function public.tadbir_qatnashchilari(p_tadbir uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.tadbir_royxati where tadbir_id = p_tadbir;
$$;
grant execute on function public.tadbir_qatnashchilari(uuid) to anon, authenticated;

-- --- Fikr-mulohazalar -----------------------------------------
create table if not exists public.fikrlar (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null default auth.uid() references public.profillar (id) on delete cascade,
  turi text not null check (turi in ('taklif', 'xato', 'savol', 'minnatdorchilik')),
  matn text not null check (char_length(matn) between 10 and 1000),
  holat text not null default 'yangi' check (holat in ('yangi', 'korib_chiqildi', 'yopilgan')),
  admin_javobi text check (admin_javobi is null or char_length(admin_javobi) <= 1000),
  yaratilgan timestamptz not null default now()
);
alter table public.fikrlar enable row level security;

create policy "fikr_oqish" on public.fikrlar for select
  using (profil_id = auth.uid() or public.admin_mi());
create policy "fikr_ozi_yozadi" on public.fikrlar for insert
  with check (profil_id = auth.uid() and holat = 'yangi' and admin_javobi is null);
create policy "fikr_admin_yangilaydi" on public.fikrlar for update
  using (public.admin_mi()) with check (public.admin_mi());
create policy "fikr_admin_ochiradi" on public.fikrlar for delete
  using (public.admin_mi());

-- --- Lahzalar galereyasi (moderatsiya + rozilik) ---------------
create table if not exists public.lahzalar (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null default auth.uid() references public.profillar (id) on delete cascade,
  tadbir_id uuid references public.tadbirlar (id) on delete set null,
  rasm_url text not null,
  izoh text check (izoh is null or char_length(izoh) <= 300),
  rozilik boolean not null check (rozilik),
  holat text not null default 'kutilmoqda' check (holat in ('kutilmoqda', 'tasdiqlangan', 'rad')),
  yaratilgan timestamptz not null default now()
);
alter table public.lahzalar enable row level security;

create policy "lahza_oqish" on public.lahzalar for select
  using (holat = 'tasdiqlangan' or profil_id = auth.uid() or public.admin_mi());
create policy "lahza_ozi_yuklaydi" on public.lahzalar for insert
  with check (profil_id = auth.uid() and holat = 'kutilmoqda');
create policy "lahza_admin_yangilaydi" on public.lahzalar for update
  using (public.admin_mi()) with check (public.admin_mi());
create policy "lahza_ochirish" on public.lahzalar for delete
  using (profil_id = auth.uid() or public.admin_mi());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lahzalar', 'lahzalar', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "lahza_rasmi_oqish" on storage.objects for select
  using (bucket_id = 'lahzalar');
create policy "lahza_rasmi_yuklash" on storage.objects for insert
  with check (bucket_id = 'lahzalar' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "lahza_rasmi_ochirish" on storage.objects for delete
  using (bucket_id = 'lahzalar' and (auth.uid()::text = (storage.foldername(name))[1] or public.admin_mi()));
revoke execute on function public.tadbir_sigimini_tekshir() from public;
