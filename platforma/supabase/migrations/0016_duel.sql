-- Duel: ikki foydalanuvchi o‘rtasida bir xil savollar bilan bellashuv.
-- Vaqt, javob tekshiruvi, g‘olib va reyting FAQAT serverda (security definer funksiyalar).

create table public.duel_savollari (
  id uuid primary key default gen_random_uuid(),
  yonalish text not null check (yonalish in ('html','css','javascript','python')),
  qiyinlik text not null check (qiyinlik in ('oson','orta','qiyin')),
  savol text not null check (char_length(savol) between 5 and 500),
  variantlar jsonb not null check (jsonb_typeof(variantlar)='array' and jsonb_array_length(variantlar)=4),
  togri_indeks smallint not null check (togri_indeks between 0 and 3),
  yaratilgan timestamptz not null default now()
);
alter table public.duel_savollari enable row level security; -- siyosat yo‘q: to‘g‘ri javob mijozga ochilmaydi
create index duel_savollari_tanlov on public.duel_savollari (yonalish, qiyinlik);

create table public.duellar (
  id uuid primary key default gen_random_uuid(),
  chaqiruvchi_id uuid not null references public.profillar(id) on delete cascade,
  raqib_id uuid not null references public.profillar(id) on delete cascade,
  yonalish text not null check (yonalish in ('html','css','javascript','python')),
  qiyinlik text not null check (qiyinlik in ('oson','orta','qiyin')),
  davomiylik_soniya integer not null check (davomiylik_soniya between 30 and 900),
  vazifalar_soni smallint not null check (vazifalar_soni between 3 and 8),
  holat text not null default 'kutilmoqda' check (holat in ('kutilmoqda','qabul_qilindi','boshlandi','tugadi','rad','bekor')),
  chaqiruvchi_tayyor boolean not null default false,
  raqib_tayyor boolean not null default false,
  boshlanish_vaqti timestamptz,
  tugash_vaqti timestamptz,
  galib_id uuid references public.profillar(id) on delete set null,
  chaqiruvchi_ball smallint,
  raqib_ball smallint,
  chaqiruvchi_reyting_ozgarishi smallint,
  raqib_reyting_ozgarishi smallint,
  yaratilgan timestamptz not null default now(),
  tugagan timestamptz,
  check (chaqiruvchi_id <> raqib_id)
);
create index duellar_chaqiruvchi on public.duellar (chaqiruvchi_id, yaratilgan desc);
create index duellar_raqib on public.duellar (raqib_id, yaratilgan desc);
create index duellar_tugagan on public.duellar (tugagan desc) where holat = 'tugadi';
alter table public.duellar enable row level security;
create policy duellar_ishtirokchi_korishi on public.duellar for select to authenticated
  using (auth.uid() in (chaqiruvchi_id, raqib_id));
-- insert/update/delete siyosati yo‘q: faqat funksiyalar orqali.

create table public.duel_vazifalari (
  duel_id uuid not null references public.duellar(id) on delete cascade,
  tartib smallint not null,
  savol_id uuid not null references public.duel_savollari(id),
  primary key (duel_id, tartib)
);
alter table public.duel_vazifalari enable row level security;

create table public.duel_javoblari (
  duel_id uuid not null references public.duellar(id) on delete cascade,
  profil_id uuid not null references public.profillar(id) on delete cascade,
  tartib smallint not null,
  tanlov smallint not null check (tanlov between 0 and 3),
  togri boolean not null,
  javob_vaqti timestamptz not null default now(),
  primary key (duel_id, profil_id, tartib)
);
alter table public.duel_javoblari enable row level security;

create table public.duel_statistikasi (
  profil_id uuid primary key references public.profillar(id) on delete cascade,
  reyting integer not null default 1000 check (reyting >= 0),
  galabalar integer not null default 0,
  magliubiyatlar integer not null default 0,
  durranglar integer not null default 0,
  yangilangan timestamptz not null default now()
);
alter table public.duel_statistikasi enable row level security;
create policy duel_statistikasi_ochiq on public.duel_statistikasi for select using (true);
create index duel_statistikasi_reyting on public.duel_statistikasi (reyting desc);

-- ---------------------------------------------------------------- funksiyalar

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
   where holat in ('kutilmoqda','qabul_qilindi','boshlandi')
     and ((chaqiruvchi_id = me and raqib_id = p_raqib) or (chaqiruvchi_id = p_raqib and raqib_id = me));
  if mavjud > 0 then raise exception 'Bu foydalanuvchi bilan tugallanmagan duel bor'; end if;

  select count(*) into mavjud from public.duellar where chaqiruvchi_id = me and holat = 'kutilmoqda';
  if mavjud >= 5 then raise exception 'Javob kutilayotgan takliflar juda ko‘p'; end if;

  -- yetarli savol bormi? (tanlangan qiyinlik, yetmasa boshqa qiyinliklardan to‘ldiriladi)
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
    (select toliq_ism from public.profillar where id = me) || ' sizni duelga chaqirdi', '/duel/' || d);
  return d;
end $$;

create or replace function public.duel_javob_ber_ichki_yakunla(p_duel uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  d public.duellar%rowtype;
  a_ball int; b_ball int; a_vaqt timestamptz; b_vaqt timestamptz;
  galib uuid; ra int; rb int; ea numeric; sa numeric; da int; db int;
begin
  select * into d from public.duellar where id = p_duel for update;
  if not found or d.holat <> 'boshlandi' then return; end if;

  select count(*) filter (where togri), max(javob_vaqti) into a_ball, a_vaqt
    from public.duel_javoblari where duel_id = p_duel and profil_id = d.chaqiruvchi_id;
  select count(*) filter (where togri), max(javob_vaqti) into b_ball, b_vaqt
    from public.duel_javoblari where duel_id = p_duel and profil_id = d.raqib_id;

  -- g‘olib: ko‘proq to‘g‘ri javob; teng bo‘lsa, ishni tezroq tugatgan (javob bermagan — eng sekin)
  if a_ball > b_ball then galib := d.chaqiruvchi_id;
  elsif b_ball > a_ball then galib := d.raqib_id;
  else
    if a_ball = 0 then galib := null;
    elsif coalesce(a_vaqt, 'infinity') < coalesce(b_vaqt, 'infinity') then galib := d.chaqiruvchi_id;
    elsif coalesce(b_vaqt, 'infinity') < coalesce(a_vaqt, 'infinity') then galib := d.raqib_id;
    else galib := null; end if;
  end if;

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
end $$;

create or replace function public.duel_qabul(p_duel uuid, p_qabul boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); d public.duellar%rowtype;
begin
  select * into d from public.duellar where id = p_duel for update;
  if not found or d.raqib_id <> coalesce(me, '00000000-0000-0000-0000-000000000000') then raise exception 'Ruxsat yo‘q'; end if;
  if d.holat <> 'kutilmoqda' then raise exception 'Taklif allaqachon hal qilingan'; end if;
  update public.duellar set holat = case when p_qabul then 'qabul_qilindi' else 'rad' end where id = p_duel;
  insert into public.bildirishnomalar (qabul_qiluvchi_id, yuboruvchi_id, turi, matn, havola)
  values (d.chaqiruvchi_id, me, 'duel_taklifi',
    (select toliq_ism from public.profillar where id = me) || case when p_qabul then ' duel taklifingizni qabul qildi' else ' duel taklifingizni rad etdi' end,
    '/duel/' || p_duel);
end $$;

create or replace function public.duel_bekor(p_duel uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  update public.duellar set holat = 'bekor'
   where id = p_duel and chaqiruvchi_id = me and holat in ('kutilmoqda','qabul_qilindi');
  if not found then raise exception 'Bekor qilib bo‘lmaydi'; end if;
end $$;

create or replace function public.duel_tayyor(p_duel uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); d public.duellar%rowtype; a boolean; b boolean;
begin
  select * into d from public.duellar where id = p_duel for update;
  if not found or me is null or me not in (d.chaqiruvchi_id, d.raqib_id) then raise exception 'Ruxsat yo‘q'; end if;
  if d.holat <> 'qabul_qilindi' then return; end if;
  a := d.chaqiruvchi_tayyor or me = d.chaqiruvchi_id;
  b := d.raqib_tayyor or me = d.raqib_id;
  if a and b then
    update public.duellar set chaqiruvchi_tayyor = true, raqib_tayyor = true, holat = 'boshlandi',
      boshlanish_vaqti = now() + interval '4 seconds',
      tugash_vaqti = now() + interval '4 seconds' + make_interval(secs => d.davomiylik_soniya)
    where id = p_duel;
  else
    update public.duellar set chaqiruvchi_tayyor = a, raqib_tayyor = b where id = p_duel;
  end if;
end $$;

create or replace function public.duel_javob_ber(p_duel uuid, p_tartib integer, p_tanlov integer)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); d public.duellar%rowtype; t smallint;
begin
  select * into d from public.duellar where id = p_duel;
  if not found or me is null or me not in (d.chaqiruvchi_id, d.raqib_id) then raise exception 'Ruxsat yo‘q'; end if;
  if d.holat <> 'boshlandi' or now() < d.boshlanish_vaqti or now() > d.tugash_vaqti + interval '2 seconds' then
    raise exception 'Duel vaqti tugagan yoki boshlanmagan';
  end if;
  select s.togri_indeks into t from public.duel_vazifalari v join public.duel_savollari s on s.id = v.savol_id
   where v.duel_id = p_duel and v.tartib = p_tartib;
  if not found then raise exception 'Vazifa topilmadi'; end if;
  insert into public.duel_javoblari (duel_id, profil_id, tartib, tanlov, togri)
  values (p_duel, me, p_tartib, p_tanlov, p_tanlov = t) on conflict do nothing;
end $$;

-- Holatni qaytaradi. Kerak bo‘lsa duelni yakunlaydi. Savollar faqat boshlangandan keyin,
-- raqib javoblari va to‘g‘ri javoblar faqat tugagandan keyin ko‘rsatiladi.
create or replace function public.duel_holati(p_duel uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid(); d public.duellar%rowtype; res jsonb;
  hammasi boolean; ochiq boolean; tugadi boolean;
begin
  select * into d from public.duellar where id = p_duel;
  if not found or me is null or me not in (d.chaqiruvchi_id, d.raqib_id) then return null; end if;

  if d.holat = 'boshlandi' then
    hammasi := (select count(distinct (profil_id, tartib)) from public.duel_javoblari where duel_id = p_duel) = d.vazifalar_soni * 2;
    if now() > d.tugash_vaqti or hammasi then
      perform public.duel_javob_ber_ichki_yakunla(p_duel);
      select * into d from public.duellar where id = p_duel;
    end if;
  end if;

  ochiq := d.holat in ('boshlandi','tugadi') and now() >= coalesce(d.boshlanish_vaqti, 'infinity');
  tugadi := d.holat = 'tugadi';

  res := jsonb_build_object(
    'id', d.id, 'holat', d.holat, 'men_chaqiruvchi', me = d.chaqiruvchi_id,
    'chaqiruvchi_id', d.chaqiruvchi_id, 'raqib_id', d.raqib_id,
    'yonalish', d.yonalish, 'qiyinlik', d.qiyinlik, 'davomiylik', d.davomiylik_soniya,
    'vazifalar_soni', d.vazifalar_soni,
    'chaqiruvchi_tayyor', d.chaqiruvchi_tayyor, 'raqib_tayyor', d.raqib_tayyor,
    'boshlanish', d.boshlanish_vaqti, 'tugash', d.tugash_vaqti, 'server_vaqti', now(),
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
    res := res || jsonb_build_object('mening_togrilarim', coalesce((
      select jsonb_agg(jsonb_build_object('tartib', tartib, 'togri', togri) order by tartib)
        from public.duel_javoblari where duel_id = p_duel and profil_id = me), '[]'::jsonb));
  end if;
  return res;
end $$;

-- TOP reyting: umumiy yoki oxirgi 7 kundagi g‘alabalar bo‘yicha.
create or replace function public.duel_top(p_haftalik boolean default false, p_limit integer default 10)
returns table (profil_id uuid, toliq_ism text, username text, avatar_url text, reyting integer, galabalar bigint)
language sql security definer set search_path = '' stable as $$
  select p.id, p.toliq_ism, p.username, p.avatar_url, coalesce(s.reyting, 1000),
         case when p_haftalik
              then (select count(*) from public.duellar d where d.galib_id = p.id and d.holat = 'tugadi' and d.tugagan >= now() - interval '7 days')
              else coalesce(s.galabalar, 0)::bigint end
    from public.profillar p
    left join public.duel_statistikasi s on s.profil_id = p.id
   where (p_haftalik and exists (select 1 from public.duellar d where d.galib_id = p.id and d.holat = 'tugadi' and d.tugagan >= now() - interval '7 days'))
      or (not p_haftalik and s.profil_id is not null)
   order by 6 desc, 5 desc
   limit least(greatest(p_limit, 1), 50)
$$;

revoke execute on function public.duel_yarat(uuid,text,text,integer,integer), public.duel_qabul(uuid,boolean),
  public.duel_bekor(uuid), public.duel_tayyor(uuid), public.duel_javob_ber(uuid,integer,integer),
  public.duel_holati(uuid), public.duel_top(boolean,integer), public.duel_javob_ber_ichki_yakunla(uuid) from public, anon;
grant execute on function public.duel_yarat(uuid,text,text,integer,integer), public.duel_qabul(uuid,boolean),
  public.duel_bekor(uuid), public.duel_tayyor(uuid), public.duel_javob_ber(uuid,integer,integer),
  public.duel_holati(uuid), public.duel_top(boolean,integer) to authenticated;
revoke execute on function public.duel_javob_ber_ichki_yakunla(uuid) from authenticated;

insert into public.duel_savollari (yonalish, qiyinlik, savol, variantlar, togri_indeks) values
('html','oson','HTML’da eng katta sarlavha qaysi teg bilan yoziladi?','["<h6>", "<h1>", "<head>", "<title>"]'::jsonb,1),
('html','oson','Havola (link) yaratish uchun qaysi teg ishlatiladi?','["<a>", "<link>", "<href>", "<url>"]'::jsonb,0),
('html','oson','Sahifaga rasm qo‘yish uchun qaysi teg kerak?','["<image>", "<pic>", "<img>", "<src>"]'::jsonb,2),
('html','orta','<ul> ichida har bir band qaysi teg bilan yoziladi?','["<li>", "<ol>", "<item>", "<td>"]'::jsonb,0),
('html','orta','Bir qatorli matn kiritish maydoni qaysi?','["<input type=\"text\">", "<textarea>", "<text>", "<field>"]'::jsonb,0),
('html','orta','Sahifa kodlashini (UTF-8) belgilovchi yozuv qaysi?','["<meta charset=\"UTF-8\">", "<script charset>", "<title utf-8>", "<body utf>"]'::jsonb,0),
('html','qiyin','Sahifaning asosiy navigatsiya havolalarini o‘rash uchun mos semantik teg qaysi?','["<nav>", "<section>", "<aside>", "<div>"]'::jsonb,0),
('html','qiyin','Rasm yuklanmaganda o‘rniga matn chiqishi uchun qaysi atribut ishlatiladi?','["title", "alt", "src", "name"]'::jsonb,1),
('css','oson','Matn rangini o‘zgartiruvchi xossa qaysi?','["font-color", "color", "text-color", "fg"]'::jsonb,1),
('css','oson','Elementning orqa fon rangi qaysi xossa bilan beriladi?','["background-color", "bgcolor", "color-bg", "back"]'::jsonb,0),
('css','oson','CSS’da izoh qanday yoziladi?','["// izoh", "<!-- izoh -->", "/* izoh */", "# izoh"]'::jsonb,2),
('css','orta','Element ichki bo‘sh joyi qaysi xossa bilan beriladi?','["margin", "padding", "gap", "space"]'::jsonb,1),
('css','orta','Elementni flex konteynerga aylantirish uchun nima yoziladi?','["display: flex", "position: flex", "flex: container", "layout: flex"]'::jsonb,0),
('css','orta','Class selektori qaysi belgi bilan boshlanadi?','["#", ".", "*", "&"]'::jsonb,1),
('css','qiyin','Ikkita teng ustunli grid uchun to‘g‘ri yozuv qaysi?','["grid-template-columns: 1fr 1fr", "grid-columns: 2", "columns: grid 2", "grid-template: 2"]'::jsonb,0),
('css','qiyin','position: absolute berilgan element nimaga nisbatan joylashadi?','["Har doim brauzer oynasiga", "Position berilgan eng yaqin ota elementga", "Oqimdagi o‘z joyiga", "Faqat body’ga"]'::jsonb,1),
('javascript','oson','O‘zgaruvchini e’lon qilishning zamonaviy usuli qaysi?','["var x", "let x", "variable x", "dim x"]'::jsonb,1),
('javascript','oson','Konsolga chiqarish buyrug‘i qaysi?','["print()", "console.log()", "echo()", "write.log()"]'::jsonb,1),
('javascript','oson','2 + ''2'' ifodasi JavaScript’da nima beradi?','["4", "\"22\"", "NaN", "22 (son)"]'::jsonb,1),
('javascript','orta','Massivning oxiriga element qo‘shuvchi metod qaysi?','["push", "pop", "shift", "add"]'::jsonb,0),
('javascript','orta','=== operatori nimani tekshiradi?','["Faqat qiymatni", "Qiymat va turni", "Faqat turni", "Havolani nusxalaydi"]'::jsonb,1),
('javascript','orta','Massivning har bir elementidan yangi massiv hosil qiluvchi metod qaysi?','["forEach", "map", "push", "splice"]'::jsonb,1),
('javascript','qiyin','typeof null natijasi nima?','["\"null\"", "\"undefined\"", "\"object\"", "\"number\""]'::jsonb,2),
('javascript','qiyin','Promise.resolve(1).then(x => x + 1) nima qaytaradi?','["1", "2 ga yechiladigan promise", "NaN", "undefined"]'::jsonb,1),
('python','oson','Ekranga chiqarish funksiyasi qaysi?','["echo", "print", "console.log", "write"]'::jsonb,1),
('python','oson','Ro‘yxat (list) qaysi qavs bilan yoziladi?','["()", "{}", "[]", "<>"]'::jsonb,2),
('python','oson','len([1, 2, 3]) natijasi nima?','["2", "3", "4", "[3]"]'::jsonb,1),
('python','orta','range(3) qanday sonlarni beradi?','["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "1, 2"]'::jsonb,1),
('python','orta','Lug‘at (dict) dan kalit bo‘yicha qiymat qanday olinadi?','["d(key)", "d[key]", "d.key()", "d->key"]'::jsonb,1),
('python','orta','''salom''.upper() natijasi nima?','["''SALOM''", "''Salom''", "''salom''", "''SaLoM''"]'::jsonb,0),
('python','qiyin','3 // 2 natijasi nima?','["1.5", "1", "2", "0"]'::jsonb,1),
('python','qiyin','[x * 2 for x in range(3)] natijasi nima?','["[0, 2, 4]", "[2, 4, 6]", "[0, 1, 2]", "[1, 2, 3]"]'::jsonb,0);
