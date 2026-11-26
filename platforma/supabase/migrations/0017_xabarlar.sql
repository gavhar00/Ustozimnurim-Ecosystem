-- Xabarlar: faqat bog‘langan (qabul qilingan) foydalanuvchilar o‘rtasida shaxsiy chat.
-- Jadval to‘g‘ridan-to‘g‘ri ochilmaydi (RLS yoqilgan, siyosat yo‘q): barcha amallar security definer funksiyalar orqali.

create table public.xabarlar (
  id uuid primary key default gen_random_uuid(),
  yuboruvchi_id uuid not null references public.profillar(id) on delete cascade,
  qabul_qiluvchi_id uuid not null references public.profillar(id) on delete cascade,
  matn text check (matn is null or char_length(matn) between 1 and 2000),
  fayl_url text check (fayl_url is null or char_length(fayl_url) <= 400),
  fayl_nomi text check (fayl_nomi is null or char_length(fayl_nomi) <= 200),
  fayl_turi text check (fayl_turi in ('rasm','fayl')),
  fayl_hajmi integer check (fayl_hajmi is null or fayl_hajmi between 1 and 10485760),
  oqilgan timestamptz,
  yaratilgan timestamptz not null default now(),
  check (yuboruvchi_id <> qabul_qiluvchi_id),
  check (matn is not null or fayl_url is not null),
  check ((fayl_url is null) = (fayl_turi is null))
);
alter table public.xabarlar enable row level security;
create index xabarlar_juftlik on public.xabarlar (yuboruvchi_id, qabul_qiluvchi_id, yaratilgan desc);
create index xabarlar_oqilmagan on public.xabarlar (qabul_qiluvchi_id) where oqilgan is null;

-- Fayllar uchun omborxona (nomi tasodifiy UUID, papka — yuboruvchi id'si)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('xabar-fayllari', 'xabar-fayllari', true, 10485760, array[
  'image/jpeg','image/png','image/webp','image/gif',
  'application/pdf','text/plain','application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])
on conflict (id) do nothing;

create policy xabar_fayli_yuklash on storage.objects for insert to authenticated
  with check (bucket_id = 'xabar-fayllari' and (auth.uid())::text = (storage.foldername(name))[1]);
create policy xabar_fayli_ochirish on storage.objects for delete to authenticated
  using (bucket_id = 'xabar-fayllari' and (auth.uid())::text = (storage.foldername(name))[1]);

-- Ikki foydalanuvchi bog‘langanmi?
create or replace function public.xabar_boglanganmi(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.boglanishlar
    where holat = 'qabul'
      and ((yuboruvchi_id = a and qabul_qiluvchi_id = b) or (yuboruvchi_id = b and qabul_qiluvchi_id = a))
  );
$$;

-- Faollik belgisi (onlayn holati uchun)
create or replace function public.faollik_yangila() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return; end if;
  update public.profillar set oxirgi_faollik = now()
  where id = auth.uid() and (oxirgi_faollik is null or oxirgi_faollik < now() - interval '30 seconds');
end $$;

create or replace function public.xabar_yubor(
  p_qabul uuid, p_matn text, p_fayl_url text default null, p_fayl_nomi text default null,
  p_fayl_turi text default null, p_fayl_hajmi integer default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  men uuid := auth.uid();
  matn text := nullif(btrim(coalesce(p_matn, '')), '');
  yangi uuid;
begin
  if men is null then raise exception 'kirish_kerak'; end if;
  if men = p_qabul then raise exception 'ozingizga_yozib_bolmaydi'; end if;
  if not public.xabar_boglanganmi(men, p_qabul) then raise exception 'boglanmagan'; end if;
  if matn is null and p_fayl_url is null then raise exception 'bosh_xabar'; end if;
  if matn is not null and char_length(matn) > 2000 then raise exception 'matn_uzun'; end if;
  if p_fayl_url is not null then
    if p_fayl_turi not in ('rasm','fayl')
       or p_fayl_url not like '%/storage/v1/object/public/xabar-fayllari/' || men::text || '/%'
       or p_fayl_url like '%..%' then
      raise exception 'fayl_notogri';
    end if;
  end if;
  insert into public.xabarlar (yuboruvchi_id, qabul_qiluvchi_id, matn, fayl_url, fayl_nomi, fayl_turi, fayl_hajmi)
  values (men, p_qabul, matn, p_fayl_url, left(p_fayl_nomi, 200), p_fayl_turi, p_fayl_hajmi)
  returning id into yangi;
  return yangi;
end $$;

-- Suhbatlar ro‘yxati: barcha bog‘langanlar + oxirgi xabar + o‘qilmaganlar soni
create or replace function public.xabar_suhbatlar() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare men uuid := auth.uid();
begin
  if men is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(row order by (row->>'oxirgi_vaqt') desc nulls last)
    from (
      select jsonb_build_object(
        'id', p.id, 'toliq_ism', p.toliq_ism, 'username', p.username, 'avatar_url', p.avatar_url,
        'onlayn', coalesce(p.oxirgi_faollik > now() - interval '2 minutes', false),
        'oxirgi_matn', lx.matn, 'oxirgi_fayl_turi', lx.fayl_turi,
        'oxirgi_men', lx.yuboruvchi_id = men,
        'oxirgi_vaqt', coalesce(lx.yaratilgan, b.yangilangan),
        'oqilmagan', (select count(*) from public.xabarlar x
                      where x.yuboruvchi_id = p.id and x.qabul_qiluvchi_id = men and x.oqilgan is null)
      ) as row
      from public.boglanishlar b
      join public.profillar p
        on p.id = case when b.yuboruvchi_id = men then b.qabul_qiluvchi_id else b.yuboruvchi_id end
      left join lateral (
        select x.matn, x.fayl_turi, x.yuboruvchi_id, x.yaratilgan from public.xabarlar x
        where (x.yuboruvchi_id = men and x.qabul_qiluvchi_id = p.id)
           or (x.yuboruvchi_id = p.id and x.qabul_qiluvchi_id = men)
        order by x.yaratilgan desc limit 1
      ) lx on true
      where b.holat = 'qabul' and (b.yuboruvchi_id = men or b.qabul_qiluvchi_id = men)
    ) t
  ), '[]'::jsonb);
end $$;

-- Bitta suhbat: xabarlar (o‘qilgan deb belgilanadi) + ular orasidagi duellar
create or replace function public.xabar_suhbat(p_boshqa uuid, p_limit integer default 200) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  men uuid := auth.uid();
  boshqa jsonb;
  xabarlar jsonb;
  duellar jsonb;
begin
  if men is null then raise exception 'kirish_kerak'; end if;
  if not public.xabar_boglanganmi(men, p_boshqa) then raise exception 'boglanmagan'; end if;

  update public.xabarlar set oqilgan = now()
  where yuboruvchi_id = p_boshqa and qabul_qiluvchi_id = men and oqilgan is null;

  select jsonb_build_object('id', p.id, 'toliq_ism', p.toliq_ism, 'username', p.username,
           'avatar_url', p.avatar_url, 'oxirgi_faollik', p.oxirgi_faollik,
           'onlayn', coalesce(p.oxirgi_faollik > now() - interval '2 minutes', false))
    into boshqa from public.profillar p where p.id = p_boshqa;

  select coalesce(jsonb_agg(m order by m.yaratilgan), '[]'::jsonb) into xabarlar from (
    select x.id, x.yuboruvchi_id = men as men, x.matn, x.fayl_url, x.fayl_nomi, x.fayl_turi,
           x.fayl_hajmi, x.oqilgan, x.yaratilgan
    from public.xabarlar x
    where (x.yuboruvchi_id = men and x.qabul_qiluvchi_id = p_boshqa)
       or (x.yuboruvchi_id = p_boshqa and x.qabul_qiluvchi_id = men)
    order by x.yaratilgan desc limit least(greatest(p_limit, 1), 500)
  ) m;

  select coalesce(jsonb_agg(d order by d.yaratilgan), '[]'::jsonb) into duellar from (
    select u.id, u.holat, u.yonalish, u.qiyinlik, u.chaqiruvchi_id = men as men_chaqirdim,
           u.galib_id, u.yaratilgan
    from public.duellar u
    where (u.chaqiruvchi_id = men and u.raqib_id = p_boshqa)
       or (u.chaqiruvchi_id = p_boshqa and u.raqib_id = men)
    order by u.yaratilgan desc limit 10
  ) d;

  return jsonb_build_object('boshqa', boshqa, 'xabarlar', xabarlar, 'duellar', duellar);
end $$;

-- Jami o‘qilmagan xabarlar (navigatsiya belgisi uchun)
create or replace function public.xabar_oqilmaganlar() returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.xabarlar where qabul_qiluvchi_id = auth.uid() and oqilgan is null;
$$;

-- Ruxsatlar: faqat kirgan foydalanuvchilar, yordamchi funksiyalar ichki
revoke execute on function public.xabar_boglanganmi(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.faollik_yangila() from public, anon;
revoke execute on function public.xabar_yubor(uuid, text, text, text, text, integer) from public, anon;
revoke execute on function public.xabar_suhbatlar() from public, anon;
revoke execute on function public.xabar_suhbat(uuid, integer) from public, anon;
revoke execute on function public.xabar_oqilmaganlar() from public, anon;
grant execute on function public.faollik_yangila() to authenticated;
grant execute on function public.xabar_yubor(uuid, text, text, text, text, integer) to authenticated;
grant execute on function public.xabar_suhbatlar() to authenticated;
grant execute on function public.xabar_suhbat(uuid, integer) to authenticated;
grant execute on function public.xabar_oqilmaganlar() to authenticated;
