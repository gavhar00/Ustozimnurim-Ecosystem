-- Amaliyot vazifalari: admin vazifa (fayl bilan) beradi, o‘quvchi "Boshlash"ni bosganda
-- muddat (standart 48 soat) shu zahoti ochiladi; muddat ichida topshiriladi, keyin keyingi vazifa.

create table public.vazifalar (
  id uuid primary key default gen_random_uuid(),
  tartib integer not null,
  nom text not null check (char_length(nom) between 3 and 150),
  tavsif text not null check (char_length(tavsif) between 10 and 6000),
  fayl_yoli text,
  fayl_nomi text,
  holat text not null default 'qoralama' check (holat in ('qoralama', 'chop_etilgan')),
  muddat_soat integer not null default 48 check (muddat_soat between 1 and 720),
  yaratilgan timestamptz not null default now()
);
create unique index vazifalar_tartib_idx on public.vazifalar (tartib);
alter table public.vazifalar enable row level security;

create policy vazifa_oqish on public.vazifalar for select to authenticated
  using (holat = 'chop_etilgan' or public.admin_mi());
create policy vazifa_qoshish on public.vazifalar for insert to authenticated
  with check (public.admin_mi());
create policy vazifa_yangilash on public.vazifalar for update to authenticated
  using (public.admin_mi()) with check (public.admin_mi());
create policy vazifa_ochirish on public.vazifalar for delete to authenticated
  using (public.admin_mi());

create table public.vazifa_urinishlari (
  id uuid primary key default gen_random_uuid(),
  vazifa_id uuid not null references public.vazifalar (id) on delete cascade,
  profil_id uuid not null references public.profillar (id) on delete cascade,
  boshlangan timestamptz not null default now(),
  muddat timestamptz not null,
  topshirilgan timestamptz,
  til text not null default 'web' check (til in ('web', 'python')),
  html text not null default '' check (char_length(html) <= 50000),
  css text not null default '' check (char_length(css) <= 50000),
  js text not null default '' check (char_length(js) <= 50000),
  python text not null default '' check (char_length(python) <= 50000),
  yangilangan timestamptz not null default now(),
  unique (vazifa_id, profil_id)
);
alter table public.vazifa_urinishlari enable row level security;
create policy urinish_oqish on public.vazifa_urinishlari for select to authenticated
  using (profil_id = (select auth.uid()) or public.admin_mi());
-- Yozish faqat quyidagi RPC lar orqali.

revoke truncate, trigger, references on public.vazifalar, public.vazifa_urinishlari from authenticated, anon;

-- Boshlash: keyingi (tartib bo‘yicha birinchi boshlanmagan) vazifa; bir vaqtda bittadan ortiq faol vazifa yo‘q.
create or replace function public.vazifa_boshlash(p_vazifa uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  men uuid := auth.uid();
  v public.vazifalar;
  keyingi uuid;
  m timestamptz;
begin
  if men is null then raise exception 'Avval tizimga kiring.'; end if;
  select * into v from public.vazifalar where id = p_vazifa and holat = 'chop_etilgan';
  if not found then raise exception 'Vazifa topilmadi.'; end if;
  if exists (select 1 from public.vazifa_urinishlari where vazifa_id = p_vazifa and profil_id = men) then
    raise exception 'Bu vazifa allaqachon boshlangan.';
  end if;
  if exists (
    select 1 from public.vazifa_urinishlari
    where profil_id = men and topshirilgan is null and muddat > now()
  ) then
    raise exception 'Avval joriy vazifani topshiring.';
  end if;
  select vz.id into keyingi from public.vazifalar vz
  where vz.holat = 'chop_etilgan'
    and not exists (select 1 from public.vazifa_urinishlari u where u.vazifa_id = vz.id and u.profil_id = men)
  order by vz.tartib limit 1;
  if keyingi is distinct from p_vazifa then
    raise exception 'Vazifalar tartib bilan bajariladi.';
  end if;
  m := now() + make_interval(hours => v.muddat_soat);
  insert into public.vazifa_urinishlari (vazifa_id, profil_id, muddat) values (p_vazifa, men, m);
  return m;
end;
$$;

-- Qoralama saqlash yoki yakuniy topshirish (muddat ichida, bir marta).
create or replace function public.vazifa_saqla(
  p_vazifa uuid, p_til text, p_html text, p_css text, p_js text, p_python text, p_yakuniy boolean
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  men uuid := auth.uid();
  u public.vazifa_urinishlari;
  t timestamptz;
begin
  if men is null then raise exception 'Avval tizimga kiring.'; end if;
  if p_til not in ('web', 'python') then raise exception 'Noto‘g‘ri til.'; end if;
  select * into u from public.vazifa_urinishlari where vazifa_id = p_vazifa and profil_id = men for update;
  if not found then raise exception 'Avval vazifani boshlang.'; end if;
  if u.topshirilgan is not null then raise exception 'Vazifa allaqachon topshirilgan.'; end if;
  if u.muddat <= now() then raise exception 'Muddat tugagan.'; end if;
  t := case when p_yakuniy then now() else null end;
  update public.vazifa_urinishlari
     set til = p_til, html = left(p_html, 50000), css = left(p_css, 50000),
         js = left(p_js, 50000), python = left(p_python, 50000),
         topshirilgan = t, yangilangan = now()
   where id = u.id;
  return t;
end;
$$;

revoke execute on function public.vazifa_boshlash(uuid) from public, anon;
revoke execute on function public.vazifa_saqla(uuid, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.vazifa_boshlash(uuid) to authenticated;
grant execute on function public.vazifa_saqla(uuid, text, text, text, text, text, boolean) to authenticated;

-- Vazifa fayllari (shaxsiy bucket; havola server orqali beriladi).
insert into storage.buckets (id, name, public, file_size_limit)
values ('vazifa-fayllari', 'vazifa-fayllari', false, 26214400)
on conflict (id) do nothing;
create policy vazifa_fayli_oqish on storage.objects for select to authenticated
  using (
    bucket_id = 'vazifa-fayllari'
    and (
      public.admin_mi()
      or exists (
        select 1 from public.vazifalar v
        join public.vazifa_urinishlari u on u.vazifa_id = v.id
        where v.fayl_yoli = name and u.profil_id = (select auth.uid())
      )
    )
  );
create policy vazifa_fayli_yuklash on storage.objects for insert to authenticated
  with check (bucket_id = 'vazifa-fayllari' and public.admin_mi());
create policy vazifa_fayli_ochirish on storage.objects for delete to authenticated
  using (bucket_id = 'vazifa-fayllari' and public.admin_mi());
