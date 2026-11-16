-- Google OAuth profilini to'ldirish va portfolio rasmlari.

alter table public.profillar
  add column if not exists sinf_kurs text,
  add column if not exists organish_yonalishlari text[] not null default '{}',
  add column if not exists organmoqchi_konikmalar text[] not null default '{}',
  add column if not exists mavjud_konikmalar text[] not null default '{}';

update public.profillar
set username = 'u_' || substr(md5(id::text), 1, 18)
where username is null;

create table if not exists public.profil_shaxsiy (
  profil_id uuid primary key references public.profillar (id) on delete cascade,
  tugilgan_sana date,
  yangilangan timestamptz not null default now()
);

alter table public.profil_shaxsiy enable row level security;

drop policy if exists "profil_shaxsiy_select" on public.profil_shaxsiy;
create policy "profil_shaxsiy_select" on public.profil_shaxsiy
  for select using (profil_id = auth.uid());
drop policy if exists "profil_shaxsiy_insert" on public.profil_shaxsiy;
create policy "profil_shaxsiy_insert" on public.profil_shaxsiy
  for insert with check (profil_id = auth.uid());
drop policy if exists "profil_shaxsiy_update" on public.profil_shaxsiy;
create policy "profil_shaxsiy_update" on public.profil_shaxsiy
  for update using (profil_id = auth.uid())
  with check (profil_id = auth.uid());

alter table public.loyihalar
  add column if not exists logo_url text,
  add column if not exists egalik_rol text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'loyiha-rasmlari',
  'loyiha-rasmlari',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "loyiha_rasmi_ommaviy_oqish" on storage.objects;
create policy "loyiha_rasmi_ommaviy_oqish" on storage.objects
  for select using (bucket_id = 'loyiha-rasmlari');
drop policy if exists "loyiha_rasmi_egasi_yuklaydi" on storage.objects;
create policy "loyiha_rasmi_egasi_yuklaydi" on storage.objects
  for insert with check (
    bucket_id = 'loyiha-rasmlari'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "loyiha_rasmi_egasi_yangilaydi" on storage.objects;
create policy "loyiha_rasmi_egasi_yangilaydi" on storage.objects
  for update using (
    bucket_id = 'loyiha-rasmlari'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "loyiha_rasmi_egasi_ochiradi" on storage.objects;
create policy "loyiha_rasmi_egasi_ochiradi" on storage.objects
  for delete using (
    bucket_id = 'loyiha-rasmlari'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Portfolio obyektlarini faqat ularning muallifi boshqaradi.
drop policy if exists "loyiha_delete" on public.loyihalar;
create policy "loyiha_delete" on public.loyihalar for delete
  using (muallif_id = auth.uid());

-- OAuth foydalanuvchisining nomini Google metadata maydonlaridan olamiz.
create or replace function public.profil_yarat()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profillar (id, toliq_ism)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'toliq_ism',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )
  );
  return new;
end;
$$;
