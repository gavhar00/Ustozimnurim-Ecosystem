-- Duel endi bir vaqtda emas: ikkalasiga bir xil savollar, har kim o‘ziga qulay payt (24 soat ichida) ishlaydi.
-- Kim muddatgacha kirmasa, ishlagan odam g‘olib bo‘ladi.

alter table public.duellar
  add column if not exists chaqiruvchi_boshladi timestamptz,
  add column if not exists raqib_boshladi timestamptz,
  add column if not exists muddat timestamptz;

update public.duellar set holat = 'kutilmoqda' where holat = 'qabul_qilindi';
update public.duellar set muddat = now() + interval '24 hours' where muddat is null and holat in ('kutilmoqda', 'boshlandi');
update public.duellar set muddat = yaratilgan + interval '24 hours' where muddat is null;
alter table public.duellar alter column muddat set default (now() + interval '24 hours');
alter table public.duellar alter column muddat set not null;

create or replace function public.duel_yarat(p_raqib uuid, p_yonalish text, p_qiyinlik text, p_davomiylik integer, p_soni integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  d uuid;
  mavjud integer;
begin
  if me is null then raise exception 'Tizimga kiring'; end if;
  if p_raqib is null or p_raqib = me then raise exception 'Raqib noto‘g‘ri'; end if;
  if not exists (select 1 from public.profillar where id = p_raqib) then raise exception 'Raqib topilmadi'; end if;
  if p_yonalish not in ('html','css','javascript','python') then raise exception 'Yo‘nalish noto‘g‘ri'; end if;
  if p_qiyinlik not in ('oson','orta','qiyin') then raise exception 'Qiyinlik noto‘g‘ri'; end if;
  if p_davomiylik not between 30 and 900 then raise exception 'Davomiylik noto‘g‘ri'; end if;
  if p_soni not between 3 and 8 then raise exception 'Vazifalar soni noto‘g‘ri'; end if;

  select count(*) into mavjud from public.duellar
   where holat in ('kutilmoqda','boshlandi')
     and ((chaqiruvchi_id = me and raqib_id = p_raqib) or (chaqiruvchi_id = p_raqib and raqib_id = me));
  if mavjud > 0 then raise exception 'Bu foydalanuvchi bilan tugallanmagan duel bor'; end if;

  select count(*) into mavjud from public.duellar where chaqiruvchi_id = me and holat = 'kutilmoqda';
  if mavjud >= 5 then raise exception 'Javob kutilayotgan takliflar juda ko‘p'; end if;

  if (select count(*) from public.duel_savollari where yonalish = p_yonalish) < p_soni then
    raise exception 'Bu yo‘nalishda savollar yetarli emas';
  end if;

  insert into public.duellar (chaqiruvchi_id, raqib_id, yonalish, qiyinlik, davomiylik_soniya, vazifalar_soni)
  values (me, p_raqib, p_yonalish, p_qiyinlik, p_davomiylik, p_soni) returning id into d;

  insert into public.duel_vazifalari (duel_id, tartib, savol_id)
  select d, (row_number() over (order by k.tartiblash))::smallint - 1, k.id
    from (select s.id, row_number() over (order by (s.qiyinlik = p_qiyinlik) desc, random()) as tartiblash
            from public.duel_savollari s where s.yonalish = p_yonalish) k
   where k.tartiblash <= p_soni;

  insert into public.bildirishnomalar (qabul_qiluvchi_id, yuboruvchi_id, turi, matn, havola)
  values (p_raqib, me, 'duel_taklifi',
    (select toliq_ism from public.profillar where id = me) || ' sizni duelga chaqirdi. 24 soat ichida kiring, aks holda u g‘olib bo‘ladi', '/duel/' || d);
  return d;
end $$;

-- Natijani hisoblaydi. Ikkalasi tugatgan bo‘lsa — oddiy hisob; muddat o‘tib, bittasi kirmagan bo‘lsa —
-- ishlagan odam g‘olib; hech kim kirmagan bo‘lsa — duel bekor qilinadi.
create or replace function public.duel_javob_ber_ichki_yakunla(p_duel uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  d public.duellar%rowtype;
  a_ball int; b_ball int; a_son int; b_son int; a_oxirgi timestamptz; b_oxirgi timestamptz;
  a_tugadi boolean; b_tugadi boolean; a_s numeric; b_s numeric;
  galib uuid; ra int; rb int; ea numeric; sa numeric; da int; db int; ok boolean := false;
begin
  select * into d from public.duellar where id = p_duel for update;
  if not found or d.holat not in ('kutilmoqda','boshlandi') then return; end if;

  if d.chaqiruvchi_boshladi is null and d.raqib_boshladi is null then
    if now() > d.muddat then
      update public.duellar set holat = 'bekor', tugagan = now() where id = p_duel;
    end if;
    return;
  end if;

  select count(*) filter (where togri), count(*), max(javob_vaqti) into a_ball, a_son, a_oxirgi
    from public.duel_javoblari where duel_id = p_duel and profil_id = d.chaqiruvchi_id;
  select count(*) filter (where togri), count(*), max(javob_vaqti) into b_ball, b_son, b_oxirgi
    from public.duel_javoblari where duel_id = p_duel and profil_id = d.raqib_id;

  a_tugadi := d.chaqiruvchi_boshladi is not null and (a_son >= d.vazifalar_soni
    or now() > d.chaqiruvchi_boshladi + make_interval(secs => d.davomiylik_soniya) + interval '3 seconds');
  b_tugadi := d.raqib_boshladi is not null and (b_son >= d.vazifalar_soni
    or now() > d.raqib_boshladi + make_interval(secs => d.davomiylik_soniya) + interval '3 seconds');

  if a_tugadi and b_tugadi then
    ok := true;
    if a_ball > b_ball then galib := d.chaqiruvchi_id;
    elsif b_ball > a_ball then galib := d.raqib_id;
    elsif a_ball = 0 then galib := null;
    else
      a_s := coalesce(extract(epoch from (a_oxirgi - d.chaqiruvchi_boshladi)), 1e9);
      b_s := coalesce(extract(epoch from (b_oxirgi - d.raqib_boshladi)), 1e9);
      galib := case when a_s < b_s then d.chaqiruvchi_id when b_s < a_s then d.raqib_id else null end;
    end if;
  elsif now() > d.muddat and d.raqib_boshladi is null and a_tugadi then
    ok := true; galib := d.chaqiruvchi_id;
  elsif now() > d.muddat and d.chaqiruvchi_boshladi is null and b_tugadi then
    ok := true; galib := d.raqib_id;
  end if;
  if not ok then return; end if;

  insert into public.duel_statistikasi (profil_id) values (d.chaqiruvchi_id), (d.raqib_id) on conflict do nothing;
  select reyting into ra from public.duel_statistikasi where profil_id = d.chaqiruvchi_id;
  select reyting into rb from public.duel_statistikasi where profil_id = d.raqib_id;
  ea := 1 / (1 + power(10, (rb - ra)::numeric / 400));
  sa := case when galib = d.chaqiruvchi_id then 1 when galib = d.raqib_id then 0 else 0.5 end;
  da := round(32 * (sa - ea));
  db := -da;

  update public.duel_statistikasi set
    reyting = greatest(0, reyting + da),
    galabalar = galabalar + coalesce((galib = d.chaqiruvchi_id)::int, 0),
    magliubiyatlar = magliubiyatlar + coalesce((galib = d.raqib_id)::int, 0),
    durranglar = durranglar + (galib is null)::int,
    yangilangan = now()
  where profil_id = d.chaqiruvchi_id;
  update public.duel_statistikasi set
    reyting = greatest(0, reyting + db),
    galabalar = galabalar + coalesce((galib = d.raqib_id)::int, 0),
    magliubiyatlar = magliubiyatlar + coalesce((galib = d.chaqiruvchi_id)::int, 0),
    durranglar = durranglar + (galib is null)::int,
    yangilangan = now()
  where profil_id = d.raqib_id;

  update public.duellar set holat = 'tugadi', galib_id = galib, chaqiruvchi_ball = a_ball, raqib_ball = b_ball,
    chaqiruvchi_reyting_ozgarishi = da, raqib_reyting_ozgarishi = db, tugagan = now()
  where id = p_duel;

  insert into public.bildirishnomalar (qabul_qiluvchi_id, yuboruvchi_id, turi, matn, havola)
  values
    (d.chaqiruvchi_id, d.raqib_id, 'duel_taklifi',
      case when galib is null then 'Duel durang tugadi' when galib = d.chaqiruvchi_id then 'Duelda g‘alaba qozondingiz' else 'Duelda mag‘lub bo‘ldingiz' end, '/duel/' || p_duel),
    (d.raqib_id, d.chaqiruvchi_id, 'duel_taklifi',
      case when galib is null then 'Duel durang tugadi' when galib = d.raqib_id then 'Duelda g‘alaba qozondingiz' else 'Duelda mag‘lub bo‘ldingiz' end, '/duel/' || p_duel);
end $$;

-- Raqibning chaqiruvini rad etish. Chaqiruvchi allaqachon ishlagan bo‘lsa, u g‘olib bo‘ladi.
create or replace function public.duel_qabul(p_duel uuid, p_qabul boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); d public.duellar%rowtype;
begin
  select * into d from public.duellar where id = p_duel for update;
  if not found or d.raqib_id <> coalesce(me, '00000000-0000-0000-0000-000000000000') then raise exception 'Ruxsat yo‘q'; end if;
  if p_qabul then return; end if;
  perform public.duel_javob_ber_ichki_yakunla(p_duel);
  select * into d from public.duellar where id = p_duel for update;
  if d.holat not in ('kutilmoqda','boshlandi') or d.raqib_boshladi is not null then
    raise exception 'Taklif allaqachon hal qilingan';
  end if;
  if d.chaqiruvchi_boshladi is null then
    update public.duellar set holat = 'rad', tugagan = now() where id = p_duel;
  else
    update public.duellar set muddat = now() where id = p_duel;
    perform public.duel_javob_ber_ichki_yakunla(p_duel);
  end if;
  insert into public.bildirishnomalar (qabul_qiluvchi_id, yuboruvchi_id, turi, matn, havola)
  values (d.chaqiruvchi_id, me, 'duel_taklifi',
    (select toliq_ism from public.profillar where id = me) || ' duel taklifingizni rad etdi', '/duel/' || p_duel);
end $$;

-- Chaqiruvchi faqat hech kim boshlamagan duelni bekor qila oladi.
create or replace function public.duel_bekor(p_duel uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  update public.duellar set holat = 'bekor', tugagan = now()
   where id = p_duel and chaqiruvchi_id = me and holat = 'kutilmoqda'
     and chaqiruvchi_boshladi is null and raqib_boshladi is null;
  if not found then raise exception 'Bekor qilib bo‘lmaydi'; end if;
end $$;

-- Eski «tayyorman» bosqichi endi yo‘q (funksiya moslik uchun qoldirildi).
create or replace function public.duel_tayyor(p_duel uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  return;
end $$;

-- O‘z navbatini boshlash: vaqt shu zahoti hisoblana boshlaydi.
create or replace function public.duel_boshlash(p_duel uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); d public.duellar%rowtype; men_chaq boolean; raqib_boshlagan boolean;
begin
  select * into d from public.duellar where id = p_duel for update;
  if not found or me is null or me not in (d.chaqiruvchi_id, d.raqib_id) then raise exception 'Ruxsat yo‘q'; end if;
  perform public.duel_javob_ber_ichki_yakunla(p_duel);
  select * into d from public.duellar where id = p_duel for update;
  if d.holat not in ('kutilmoqda','boshlandi') then raise exception 'Duel yakunlangan'; end if;
  if now() > d.muddat then raise exception 'Duel muddati tugagan'; end if;
  men_chaq := me = d.chaqiruvchi_id;
  if (men_chaq and d.chaqiruvchi_boshladi is not null) or (not men_chaq and d.raqib_boshladi is not null) then
    raise exception 'Siz duelni allaqachon boshlagansiz';
  end if;
  raqib_boshlagan := case when men_chaq then d.raqib_boshladi is not null else d.chaqiruvchi_boshladi is not null end;
  update public.duellar set
    chaqiruvchi_boshladi = case when men_chaq then now() else chaqiruvchi_boshladi end,
    raqib_boshladi = case when not men_chaq then now() else raqib_boshladi end,
    holat = 'boshlandi'
  where id = p_duel;
  if not raqib_boshlagan then
    insert into public.bildirishnomalar (qabul_qiluvchi_id, yuboruvchi_id, turi, matn, havola)
    values (case when men_chaq then d.raqib_id else d.chaqiruvchi_id end, me, 'duel_taklifi',
      (select toliq_ism from public.profillar where id = me) || ' duelni boshladi. Muddatgacha siz ham kiring, aks holda u g‘olib bo‘ladi', '/duel/' || p_duel);
  end if;
end $$;

create or replace function public.duel_javob_ber(p_duel uuid, p_tartib integer, p_tanlov integer)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); d public.duellar%rowtype; t smallint; mening timestamptz;
begin
  select * into d from public.duellar where id = p_duel;
  if not found or me is null or me not in (d.chaqiruvchi_id, d.raqib_id) then raise exception 'Ruxsat yo‘q'; end if;
  mening := case when me = d.chaqiruvchi_id then d.chaqiruvchi_boshladi else d.raqib_boshladi end;
  if d.holat <> 'boshlandi' or mening is null
     or now() > mening + make_interval(secs => d.davomiylik_soniya) + interval '2 seconds' then
    raise exception 'Duel vaqti tugagan yoki boshlanmagan';
  end if;
  select s.togri_indeks into t from public.duel_vazifalari v join public.duel_savollari s on s.id = v.savol_id
   where v.duel_id = p_duel and v.tartib = p_tartib;
  if not found then raise exception 'Vazifa topilmadi'; end if;
  insert into public.duel_javoblari (duel_id, profil_id, tartib, tanlov, togri)
  values (p_duel, me, p_tartib, p_tanlov, p_tanlov = t) on conflict do nothing;
end $$;

create or replace function public.duel_holati(p_duel uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid(); d public.duellar%rowtype; res jsonb;
  men_chaq boolean; mening timestamptz; mening_tugash timestamptz; men_soni int;
  men_boshladi boolean; raqib_boshladi boolean; men_tugatdim boolean; tugadi boolean; ochiq boolean;
begin
  select * into d from public.duellar where id = p_duel;
  if not found or me is null or me not in (d.chaqiruvchi_id, d.raqib_id) then return null; end if;

  if d.holat in ('kutilmoqda','boshlandi') then
    perform public.duel_javob_ber_ichki_yakunla(p_duel);
    select * into d from public.duellar where id = p_duel;
  end if;

  men_chaq := me = d.chaqiruvchi_id;
  mening := case when men_chaq then d.chaqiruvchi_boshladi else d.raqib_boshladi end;
  men_boshladi := mening is not null;
  raqib_boshladi := (case when men_chaq then d.raqib_boshladi else d.chaqiruvchi_boshladi end) is not null;
  mening_tugash := mening + make_interval(secs => d.davomiylik_soniya);
  select count(*) into men_soni from public.duel_javoblari where duel_id = p_duel and profil_id = me;
  men_tugatdim := men_boshladi and (men_soni >= d.vazifalar_soni or now() > mening_tugash + interval '2 seconds');
  tugadi := d.holat = 'tugadi';
  ochiq := men_boshladi or tugadi;

  res := jsonb_build_object(
    'id', d.id, 'holat', d.holat, 'men_chaqiruvchi', men_chaq,
    'chaqiruvchi_id', d.chaqiruvchi_id, 'raqib_id', d.raqib_id,
    'yonalish', d.yonalish, 'qiyinlik', d.qiyinlik, 'davomiylik', d.davomiylik_soniya,
    'vazifalar_soni', d.vazifalar_soni,
    'muddat', d.muddat, 'men_boshladi', men_boshladi, 'raqib_boshladi', raqib_boshladi, 'men_tugatdim', men_tugatdim,
    'boshlanish', mening, 'tugash', mening_tugash, 'server_vaqti', now(),
    'galib_id', d.galib_id, 'chaqiruvchi_ball', d.chaqiruvchi_ball, 'raqib_ball', d.raqib_ball,
    'chaqiruvchi_ozgarish', d.chaqiruvchi_reyting_ozgarishi, 'raqib_ozgarish', d.raqib_reyting_ozgarishi
  );

  if ochiq then
    res := res || jsonb_build_object('vazifalar', coalesce((
      select jsonb_agg(jsonb_build_object('tartib', v.tartib, 'savol', s.savol, 'variantlar', s.variantlar)
             || case when tugadi then jsonb_build_object('togri', s.togri_indeks) else '{}'::jsonb end
             order by v.tartib)
        from public.duel_vazifalari v join public.duel_savollari s on s.id = v.savol_id where v.duel_id = p_duel), '[]'::jsonb));
    res := res || jsonb_build_object('mening_javoblarim', coalesce((
      select jsonb_agg(jsonb_build_object('tartib', tartib, 'tanlov', tanlov) order by tartib)
        from public.duel_javoblari where duel_id = p_duel and profil_id = me), '[]'::jsonb));
  end if;
  if tugadi then
    res := res || jsonb_build_object('raqib_javoblari', coalesce((
      select jsonb_agg(jsonb_build_object('tartib', tartib, 'tanlov', tanlov, 'togri', togri) order by tartib)
        from public.duel_javoblari where duel_id = p_duel and profil_id <> me), '[]'::jsonb));
  end if;
  return res;
end $$;

-- Ro‘yxat ochilganda muddati o‘tgan duellarni ham hisoblab qo‘yadi.
create or replace function public.duel_yakunlarni_tekshir()
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); r record;
begin
  if me is null then return; end if;
  for r in select id from public.duellar
            where holat in ('kutilmoqda','boshlandi') and me in (chaqiruvchi_id, raqib_id) loop
    perform public.duel_javob_ber_ichki_yakunla(r.id);
  end loop;
end $$;

revoke execute on function public.duel_boshlash(uuid), public.duel_yakunlarni_tekshir() from public, anon;
grant execute on function public.duel_boshlash(uuid), public.duel_yakunlarni_tekshir() to authenticated;
revoke execute on function public.duel_javob_ber_ichki_yakunla(uuid) from public, anon, authenticated;

revoke execute on function public.duel_tayyor(uuid), public.duel_qabul(uuid,boolean), public.duel_bekor(uuid), public.duel_javob_ber(uuid,integer,integer), public.duel_holati(uuid), public.duel_yarat(uuid,text,text,integer,integer) from public, anon;
grant execute on function public.duel_tayyor(uuid), public.duel_qabul(uuid,boolean), public.duel_bekor(uuid), public.duel_javob_ber(uuid,integer,integer), public.duel_holati(uuid), public.duel_yarat(uuid,text,text,integer,integer) to authenticated;
