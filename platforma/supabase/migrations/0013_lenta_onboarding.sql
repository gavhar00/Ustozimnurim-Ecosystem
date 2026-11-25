-- Hamjamiyat lentasi (rasmli postlar, izohlar) va onboarding yakunlanganlik belgisi.

-- --- Onboarding belgisi ---------------------------------------
alter table public.profillar
  add column if not exists profil_toldirilgan boolean not null default false;

-- Mavjud, allaqachon to'ldirilgan profillar qayta so'ralmasin.
update public.profillar
set profil_toldirilgan = true
where array_length(regexp_split_to_array(btrim(coalesce(toliq_ism, '')), '\s+'), 1) >= 2
  and username is not null
  and nullif(btrim(coalesce(bio, '')), '') is not null
  and nullif(btrim(coalesce(kasb, talim, '')), '') is not null
  and cardinality(qiziqishlar) > 0
  and tajriba_darajasi is not null
  and nullif(btrim(coalesce(maqsad, '')), '') is not null;

-- Belgini faqat majburiy maydonlar to'liq bo'lganda yoqish mumkin (API orqali ham).
create or replace function public.profil_toldirilganligini_tekshir()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.profil_toldirilgan and (
    array_length(regexp_split_to_array(btrim(coalesce(new.toliq_ism, '')), '\s+'), 1) < 2
    or new.username is null
    or nullif(btrim(coalesce(new.bio, '')), '') is null
    or nullif(btrim(coalesce(new.kasb, new.talim, '')), '') is null
    or cardinality(new.qiziqishlar) = 0
    or new.tajriba_darajasi is null
    or nullif(btrim(coalesce(new.maqsad, '')), '') is null
  ) then
    raise exception 'Profilning majburiy maydonlari to''ldirilmagan';
  end if;
  return new;
end $$;

drop trigger if exists profil_toldirilganligi on public.profillar;
create trigger profil_toldirilganligi before insert or update on public.profillar
  for each row execute function public.profil_toldirilganligini_tekshir();
revoke execute on function public.profil_toldirilganligini_tekshir() from public, anon, authenticated;

-- --- Postlar: rasm, tahrir belgisi, izohlar soni ----------------
alter table public.postlar
  add column if not exists rasmlar text[] not null default '{}',
  add column if not exists yangilangan timestamptz,
  add column if not exists izohlar_soni integer not null default 0;

alter table public.postlar alter column matn set default '';
alter table public.postlar
  add constraint post_matn_yoki_rasm
    check (char_length(btrim(matn)) > 0 or cardinality(rasmlar) > 0),
  add constraint post_matn_uzunligi check (char_length(matn) <= 2000),
  add constraint post_rasmlar_soni check (cardinality(rasmlar) <= 4);

-- Muallif faqat matn va rasmni o'zgartira oladi; hisoblagichlarni yolg'on yozib bo'lmaydi.
create or replace function public.post_ozgarishini_tekshir()
returns trigger language plpgsql set search_path = '' as $$
begin
  if pg_trigger_depth() = 1 then
    new.muallif_id := old.muallif_id;
    new.yaratilgan := old.yaratilgan;
    new.yoqtirishlar_soni := old.yoqtirishlar_soni;
    new.izohlar_soni := old.izohlar_soni;
    if new.matn is distinct from old.matn or new.rasmlar is distinct from old.rasmlar then
      new.yangilangan := now();
    else
      new.yangilangan := old.yangilangan;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists post_ozgarishi on public.postlar;
create trigger post_ozgarishi before update on public.postlar
  for each row execute function public.post_ozgarishini_tekshir();
revoke execute on function public.post_ozgarishini_tekshir() from public, anon, authenticated;

-- --- Izohlar -----------------------------------------------------
create table if not exists public.post_izohlari (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.postlar (id) on delete cascade,
  muallif_id uuid not null default auth.uid() references public.profillar (id) on delete cascade,
  matn text not null check (char_length(btrim(matn)) between 1 and 1000),
  yaratilgan timestamptz not null default now()
);
create index if not exists post_izohlari_post_idx on public.post_izohlari (post_id, yaratilgan);
alter table public.post_izohlari enable row level security;

create policy "izoh_select" on public.post_izohlari for select using (true);
create policy "izoh_insert" on public.post_izohlari for insert
  with check (muallif_id = auth.uid());
create policy "izoh_delete" on public.post_izohlari for delete
  using (
    muallif_id = auth.uid()
    or public.admin_mi()
    or exists (select 1 from public.postlar p where p.id = post_id and p.muallif_id = auth.uid())
  );

create or replace function public.izohlar_sonini_yangila()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.postlar set izohlar_soni = izohlar_soni + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.postlar set izohlar_soni = greatest(izohlar_soni - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;

drop trigger if exists izohlar_yangilansin on public.post_izohlari;
create trigger izohlar_yangilansin after insert or delete on public.post_izohlari
  for each row execute function public.izohlar_sonini_yangila();
revoke execute on function public.izohlar_sonini_yangila() from public, anon, authenticated;

-- --- Post rasmlari ---------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-rasmlari', 'post-rasmlari', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "post_rasmi_oqish" on storage.objects for select
  using (bucket_id = 'post-rasmlari');
create policy "post_rasmi_yuklash" on storage.objects for insert
  with check (bucket_id = 'post-rasmlari' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "post_rasmi_ochirish" on storage.objects for delete
  using (bucket_id = 'post-rasmlari' and (auth.uid()::text = (storage.foldername(name))[1] or public.admin_mi()));
