-- Lahzalar: ommaviy, tasdiqsiz lenta — matn (5000 so'zgacha), rasmlar, layk, izoh, repost.

-- --- Lahzalar jadvali kengaytmasi -------------------------------
alter table public.lahzalar
  add column if not exists matn text not null default '',
  add column if not exists rasmlar text[] not null default '{}',
  add column if not exists asl_id uuid references public.lahzalar (id) on delete cascade,
  add column if not exists layklar_soni integer not null default 0,
  add column if not exists izohlar_soni integer not null default 0,
  add column if not exists repostlar_soni integer not null default 0,
  add column if not exists yangilangan timestamptz;

alter table public.lahzalar alter column rasm_url drop not null;
alter table public.lahzalar alter column rozilik set default true;
alter table public.lahzalar drop constraint if exists lahzalar_rozilik_check;
alter table public.lahzalar drop constraint if exists lahzalar_izoh_check;
alter table public.lahzalar alter column holat set default 'tasdiqlangan';

-- Hech kimning tasdig'i kerak emas: kutilayotganlar ham ochiladi.
update public.lahzalar set holat = 'tasdiqlangan' where holat = 'kutilmoqda';
-- Eski rasmlar yangi massivga ko'chadi.
update public.lahzalar
  set rasmlar = array[rasm_url]
  where rasm_url is not null and cardinality(rasmlar) = 0;
update public.lahzalar set matn = izoh where coalesce(matn, '') = '' and izoh is not null;

alter table public.lahzalar
  add constraint lahza_matn_uzunligi check (
    char_length(matn) <= 60000
    and coalesce(cardinality(regexp_split_to_array(btrim(matn), '\s+')), 0) <= 5000
  ),
  add constraint lahza_rasmlar_soni check (cardinality(rasmlar) <= 4),
  add constraint lahza_mazmuni check (
    asl_id is not null
    or char_length(btrim(matn)) > 0
    or cardinality(rasmlar) > 0
  );

create unique index if not exists lahza_repost_bir_marta
  on public.lahzalar (profil_id, asl_id) where asl_id is not null;
create index if not exists lahzalar_yaratilgan_idx on public.lahzalar (yaratilgan desc);

-- --- RLS: hamma o'qiydi, kirgan foydalanuvchi o'zi yozadi ---------
drop policy if exists "lahza_oqish" on public.lahzalar;
drop policy if exists "lahza_ozi_yuklaydi" on public.lahzalar;
drop policy if exists "lahza_ozi_yangilaydi" on public.lahzalar;

create policy "lahza_oqish" on public.lahzalar for select
  using (holat = 'tasdiqlangan' or profil_id = auth.uid() or public.admin_mi());
create policy "lahza_ozi_yuklaydi" on public.lahzalar for insert
  with check (profil_id = auth.uid() and holat = 'tasdiqlangan');
create policy "lahza_ozi_yangilaydi" on public.lahzalar for update
  using (profil_id = auth.uid()) with check (profil_id = auth.uid());

-- Muallif faqat matn/rasmni o'zgartira oladi; hisoblagich va holatni emas.
create or replace function public.lahza_ozgarishini_tekshir()
returns trigger language plpgsql set search_path = '' as $$
begin
  if pg_trigger_depth() = 1 then
    new.profil_id := old.profil_id;
    new.asl_id := old.asl_id;
    new.yaratilgan := old.yaratilgan;
    new.layklar_soni := old.layklar_soni;
    new.izohlar_soni := old.izohlar_soni;
    new.repostlar_soni := old.repostlar_soni;
    if not public.admin_mi() then
      new.holat := old.holat;
    end if;
    if new.matn is distinct from old.matn or new.rasmlar is distinct from old.rasmlar then
      new.yangilangan := now();
    else
      new.yangilangan := old.yangilangan;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists lahza_ozgarishi on public.lahzalar;
create trigger lahza_ozgarishi before update on public.lahzalar
  for each row execute function public.lahza_ozgarishini_tekshir();

-- Repost: faqat asl lahzani, o'zinikini emas, repostni qayta repost qilib bo'lmaydi.
create or replace function public.lahza_repostini_tekshir()
returns trigger language plpgsql security definer set search_path = '' as $$
declare a record;
begin
  if new.asl_id is not null then
    select profil_id, asl_id, holat into a from public.lahzalar where id = new.asl_id;
    if not found or a.holat <> 'tasdiqlangan' then
      raise exception 'Asl lahza topilmadi';
    end if;
    if a.asl_id is not null then
      raise exception 'Repostni qayta repost qilib bo''lmaydi';
    end if;
    if a.profil_id = new.profil_id then
      raise exception 'O''z lahzangizni repost qilib bo''lmaydi';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists lahza_repost_tekshiruvi on public.lahzalar;
create trigger lahza_repost_tekshiruvi before insert on public.lahzalar
  for each row execute function public.lahza_repostini_tekshir();

create or replace function public.lahza_repostlarini_hisobla()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.asl_id is not null then
    update public.lahzalar set repostlar_soni = repostlar_soni + 1 where id = new.asl_id;
  elsif tg_op = 'DELETE' and old.asl_id is not null then
    update public.lahzalar set repostlar_soni = greatest(repostlar_soni - 1, 0) where id = old.asl_id;
  end if;
  return null;
end $$;
drop trigger if exists lahza_repostlari on public.lahzalar;
create trigger lahza_repostlari after insert or delete on public.lahzalar
  for each row execute function public.lahza_repostlarini_hisobla();

-- --- Layklar (kim bosgani hammaga ko'rinadi) ----------------------
create table if not exists public.lahza_layklari (
  id uuid primary key default gen_random_uuid(),
  lahza_id uuid not null references public.lahzalar (id) on delete cascade,
  profil_id uuid not null default auth.uid() references public.profillar (id) on delete cascade,
  yaratilgan timestamptz not null default now(),
  unique (lahza_id, profil_id)
);
create index if not exists lahza_layklari_lahza_idx on public.lahza_layklari (lahza_id, yaratilgan desc);
alter table public.lahza_layklari enable row level security;

create policy "layk_oqish" on public.lahza_layklari for select using (true);
create policy "layk_ozi_bosadi" on public.lahza_layklari for insert
  with check (profil_id = auth.uid());
create policy "layk_ozi_olib_tashlaydi" on public.lahza_layklari for delete
  using (profil_id = auth.uid());

create or replace function public.lahza_layklarini_hisobla()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.lahzalar set layklar_soni = layklar_soni + 1 where id = new.lahza_id;
  elsif tg_op = 'DELETE' then
    update public.lahzalar set layklar_soni = greatest(layklar_soni - 1, 0) where id = old.lahza_id;
  end if;
  return null;
end $$;
drop trigger if exists lahza_layklari_hisobi on public.lahza_layklari;
create trigger lahza_layklari_hisobi after insert or delete on public.lahza_layklari
  for each row execute function public.lahza_layklarini_hisobla();

-- --- Izohlar -----------------------------------------------------
create table if not exists public.lahza_izohlari (
  id uuid primary key default gen_random_uuid(),
  lahza_id uuid not null references public.lahzalar (id) on delete cascade,
  muallif_id uuid not null default auth.uid() references public.profillar (id) on delete cascade,
  matn text not null check (char_length(btrim(matn)) between 1 and 1000),
  yaratilgan timestamptz not null default now()
);
create index if not exists lahza_izohlari_lahza_idx on public.lahza_izohlari (lahza_id, yaratilgan);
alter table public.lahza_izohlari enable row level security;

create policy "lahza_izoh_oqish" on public.lahza_izohlari for select using (true);
create policy "lahza_izoh_yozish" on public.lahza_izohlari for insert
  with check (muallif_id = auth.uid());
create policy "lahza_izoh_ochirish" on public.lahza_izohlari for delete
  using (
    muallif_id = auth.uid()
    or public.admin_mi()
    or exists (select 1 from public.lahzalar l where l.id = lahza_id and l.profil_id = auth.uid())
  );

create or replace function public.lahza_izohlarini_hisobla()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.lahzalar set izohlar_soni = izohlar_soni + 1 where id = new.lahza_id;
  elsif tg_op = 'DELETE' then
    update public.lahzalar set izohlar_soni = greatest(izohlar_soni - 1, 0) where id = old.lahza_id;
  end if;
  return null;
end $$;
drop trigger if exists lahza_izohlari_hisobi on public.lahza_izohlari;
create trigger lahza_izohlari_hisobi after insert or delete on public.lahza_izohlari
  for each row execute function public.lahza_izohlarini_hisobla();

-- --- Rasmlar: mavjud ommaviy 'post-rasmlari' bucket'i ishlatiladi ---
revoke execute on function public.lahza_ozgarishini_tekshir() from public, anon, authenticated;
revoke execute on function public.lahza_repostini_tekshir() from public, anon, authenticated;
revoke execute on function public.lahza_repostlarini_hisobla() from public, anon, authenticated;
revoke execute on function public.lahza_layklarini_hisobla() from public, anon, authenticated;
revoke execute on function public.lahza_izohlarini_hisobla() from public, anon, authenticated;
