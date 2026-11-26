-- Amaliyot: foydalanuvchining saqlangan kodlari (faqat egasi ko‘radi va o‘zgartiradi).
create table public.amaliyot_kodlari (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references public.profillar(id) on delete cascade,
  nom text not null check (char_length(nom) between 1 and 80),
  til text not null check (til in ('web','python')),
  html text not null default '' check (char_length(html) <= 50000),
  css text not null default '' check (char_length(css) <= 50000),
  js text not null default '' check (char_length(js) <= 50000),
  python text not null default '' check (char_length(python) <= 50000),
  yaratilgan timestamptz not null default now(),
  yangilangan timestamptz not null default now()
);
create index amaliyot_kodlari_egasi on public.amaliyot_kodlari (profil_id, yangilangan desc);
alter table public.amaliyot_kodlari enable row level security;

create policy amaliyot_oqish on public.amaliyot_kodlari for select to authenticated
  using (profil_id = (select auth.uid()));
create policy amaliyot_qoshish on public.amaliyot_kodlari for insert to authenticated
  with check (profil_id = (select auth.uid()));
create policy amaliyot_yangilash on public.amaliyot_kodlari for update to authenticated
  using (profil_id = (select auth.uid())) with check (profil_id = (select auth.uid()));
create policy amaliyot_ochirish on public.amaliyot_kodlari for delete to authenticated
  using (profil_id = (select auth.uid()));

revoke all on public.amaliyot_kodlari from anon;

-- Bitta foydalanuvchi eng ko‘pi bilan 50 ta kod saqlay oladi (siyosat o‘ziga murojaat qilsa cheksiz rekursiya bo‘ladi, shuning uchun trigger).
create or replace function public.amaliyot_soni_cheklash() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.amaliyot_kodlari where profil_id = new.profil_id) >= 50 then
    raise exception 'amaliyot_limit';
  end if;
  return new;
end $$;
revoke execute on function public.amaliyot_soni_cheklash() from public, anon, authenticated;
create trigger amaliyot_soni_cheklash before insert on public.amaliyot_kodlari
  for each row execute function public.amaliyot_soni_cheklash();

revoke truncate, trigger, references on public.amaliyot_kodlari from authenticated;
