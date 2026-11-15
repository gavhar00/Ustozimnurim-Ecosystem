-- ============================================================
-- Rasm saqlash (avatar, muqova), postlar, obunalar va bog'lanishlar
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatarlar', 'avatarlar', true), ('muqovalar', 'muqovalar', true)
on conflict (id) do nothing;

create policy "rasm_ommaviy_oqish" on storage.objects for select
  using (bucket_id in ('avatarlar', 'muqovalar'));

create policy "rasm_ozi_yuklaydi" on storage.objects for insert
  with check (
    bucket_id in ('avatarlar', 'muqovalar')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "rasm_ozi_yangilaydi" on storage.objects for update
  using (
    bucket_id in ('avatarlar', 'muqovalar')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "rasm_ozi_ochiradi" on storage.objects for delete
  using (
    bucket_id in ('avatarlar', 'muqovalar')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- --- Postlar -------------------------------------------------

create table public.postlar (
  id uuid primary key default gen_random_uuid(),
  muallif_id uuid not null references public.profillar (id) on delete cascade,
  matn text not null,
  yoqtirishlar_soni int not null default 0,
  yaratilgan timestamptz not null default now()
);

create index postlar_muallif_idx on public.postlar (muallif_id);
create index postlar_sana_idx on public.postlar (yaratilgan desc);

alter table public.postlar enable row level security;

create policy "post_select" on public.postlar for select using (true);
create policy "post_insert" on public.postlar for insert with check (muallif_id = auth.uid());
create policy "post_update" on public.postlar for update
  using (muallif_id = auth.uid()) with check (muallif_id = auth.uid());
create policy "post_delete" on public.postlar for delete
  using (muallif_id = auth.uid() or public.admin_mi());

create table public.post_yoqtirishlari (
  post_id uuid not null references public.postlar (id) on delete cascade,
  foydalanuvchi_id uuid not null references public.profillar (id) on delete cascade,
  yaratilgan timestamptz not null default now(),
  primary key (post_id, foydalanuvchi_id)
);

alter table public.post_yoqtirishlari enable row level security;

create policy "yoqtirish_select" on public.post_yoqtirishlari for select using (true);
create policy "yoqtirish_insert" on public.post_yoqtirishlari for insert
  with check (foydalanuvchi_id = auth.uid());
create policy "yoqtirish_delete" on public.post_yoqtirishlari for delete
  using (foydalanuvchi_id = auth.uid());

create or replace function public.yoqtirishlarni_yangila()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.postlar set yoqtirishlar_soni = yoqtirishlar_soni + 1
      where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.postlar set yoqtirishlar_soni = greatest(yoqtirishlar_soni - 1, 0)
      where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger yoqtirishlar_yangilansin
  after insert or delete on public.post_yoqtirishlari
  for each row execute function public.yoqtirishlarni_yangila();

-- --- Obunalar (kuzatish) -------------------------------------

create table public.obunalar (
  kuzatuvchi_id uuid not null references public.profillar (id) on delete cascade,
  kuzatilgan_id uuid not null references public.profillar (id) on delete cascade,
  yaratilgan timestamptz not null default now(),
  primary key (kuzatuvchi_id, kuzatilgan_id),
  check (kuzatuvchi_id <> kuzatilgan_id)
);

create index obunalar_kuzatilgan_idx on public.obunalar (kuzatilgan_id);

alter table public.obunalar enable row level security;

create policy "obuna_select" on public.obunalar for select using (true);
create policy "obuna_insert" on public.obunalar for insert
  with check (kuzatuvchi_id = auth.uid());
create policy "obuna_delete" on public.obunalar for delete
  using (kuzatuvchi_id = auth.uid());

-- --- Bog'lanish so'rovlari -----------------------------------

create type public.sorov_holati as enum ('kutilmoqda', 'qabul', 'rad');

create table public.boglanishlar (
  id uuid primary key default gen_random_uuid(),
  yuboruvchi_id uuid not null references public.profillar (id) on delete cascade,
  qabul_qiluvchi_id uuid not null references public.profillar (id) on delete cascade,
  holat public.sorov_holati not null default 'kutilmoqda',
  yaratilgan timestamptz not null default now(),
  yangilangan timestamptz not null default now(),
  unique (yuboruvchi_id, qabul_qiluvchi_id),
  check (yuboruvchi_id <> qabul_qiluvchi_id)
);

create index boglanishlar_qabul_idx on public.boglanishlar (qabul_qiluvchi_id, holat);
create index boglanishlar_yubor_idx on public.boglanishlar (yuboruvchi_id, holat);

alter table public.boglanishlar enable row level security;

create policy "boglanish_select" on public.boglanishlar for select
  using (yuboruvchi_id = auth.uid() or qabul_qiluvchi_id = auth.uid());
create policy "boglanish_insert" on public.boglanishlar for insert
  with check (yuboruvchi_id = auth.uid());
create policy "boglanish_update" on public.boglanishlar for update
  using (qabul_qiluvchi_id = auth.uid())
  with check (qabul_qiluvchi_id = auth.uid());
create policy "boglanish_delete" on public.boglanishlar for delete
  using (yuboruvchi_id = auth.uid() or qabul_qiluvchi_id = auth.uid());

-- --- Xavfsizlik: trigger funksiyalarini API dan yopish --------

revoke execute on function public.profil_yarat() from anon, authenticated;
revoke execute on function public.rol_ozgarishini_tekshir() from anon, authenticated;
revoke execute on function public.javoblar_sonini_yangila() from anon, authenticated;
revoke execute on function public.yoqtirishlarni_yangila() from anon, authenticated;
