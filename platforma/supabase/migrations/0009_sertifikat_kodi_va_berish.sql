-- ============================================================
-- Sertifikat: ochiq tekshiruv kodi va kursni tugatganda avtomatik berish
-- ============================================================

alter table public.sertifikatlar
  add column if not exists kod text;

-- Mavjud yozuvlar uchun kod (hozircha bo'sh bo'lishi mumkin)
update public.sertifikatlar
set kod = 'UN-' || upper(substr(md5(id::text || clock_timestamp()::text), 1, 10))
where kod is null;

alter table public.sertifikatlar
  alter column kod set default
    'UN-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  alter column kod set not null;

create unique index if not exists sertifikatlar_kod_idx
  on public.sertifikatlar (kod);

-- Kursning barcha chop etilgan darslari tugatilgan bo'lsa, sertifikat beradi.
-- Foydalanuvchi o'zi ma'lumot yoza olmaydi: tekshiruv bazaning o'zida.
create or replace function public.sertifikat_ber(p_kurs_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_jami int;
  v_tugatilgan int;
  v_kod text;
begin
  if v_user is null then
    return null;
  end if;

  select count(*) into v_jami
  from public.darslar d
  where d.kurs_id = p_kurs_id and d.holat = 'chop_etilgan';

  if v_jami = 0 then
    return null;
  end if;

  select count(*) into v_tugatilgan
  from public.darslar d
  join public.dars_jarayoni j
    on j.dars_id = d.id
   and j.foydalanuvchi_id = v_user
   and j.tugatilgan
  where d.kurs_id = p_kurs_id and d.holat = 'chop_etilgan';

  if v_tugatilgan < v_jami then
    return null;
  end if;

  insert into public.sertifikatlar (foydalanuvchi_id, kurs_id)
  values (v_user, p_kurs_id)
  on conflict (foydalanuvchi_id, kurs_id) do nothing;

  select s.kod into v_kod
  from public.sertifikatlar s
  where s.foydalanuvchi_id = v_user and s.kurs_id = p_kurs_id;

  return v_kod;
end;
$$;

revoke all on function public.sertifikat_ber(uuid) from public, anon;
grant execute on function public.sertifikat_ber(uuid) to authenticated;

-- Ochiq tekshiruv: faqat ism, kurs nomi va sana qaytadi (boshqa ma'lumot yo'q).
create or replace function public.sertifikat_tekshir(p_kod text)
returns table (toliq_ism text, kurs_nomi text, berilgan timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.toliq_ism, k.nom, s.berilgan
  from public.sertifikatlar s
  join public.profillar p on p.id = s.foydalanuvchi_id
  join public.kurslar k on k.id = s.kurs_id
  where s.kod = upper(trim(p_kod))
  limit 1;
$$;

revoke all on function public.sertifikat_tekshir(text) from public;
grant execute on function public.sertifikat_tekshir(text) to anon, authenticated;
