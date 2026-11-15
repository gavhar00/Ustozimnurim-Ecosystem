-- ============================================================
-- UstozimNurim — boshlang‘ich sxema
-- Jadval va ustun nomlari o‘zbekcha; kod bilan bir xil.
-- ============================================================

-- --- Turlar --------------------------------------------------

create type public.rol_turi as enum ('oquvchi', 'ustoz', 'admin');
create type public.daraja_turi as enum ('boshlangich', 'orta', 'yuqori');
create type public.dars_turi as enum ('video', 'amaliyot', 'test');
create type public.holat_turi as enum ('qoralama', 'chop_etilgan', 'arxiv');

-- --- Profillar -----------------------------------------------

create table public.profillar (
  id uuid primary key references auth.users (id) on delete cascade,
  toliq_ism text not null default '',
  rol public.rol_turi not null default 'oquvchi',
  avatar_url text,
  yaratilgan timestamptz not null default now()
);

comment on table public.profillar is 'Foydalanuvchi profillari va rollari';

-- Ro‘yxatdan o‘tgan har bir foydalanuvchiga avtomatik profil ochiladi.
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
    coalesce(new.raw_user_meta_data ->> 'toliq_ism', '')
  );
  return new;
end;
$$;

create trigger profil_yaratilsin
  after insert on auth.users
  for each row execute function public.profil_yarat();

-- Joriy foydalanuvchining roli. RLS ichida profillar jadvalini
-- to‘g‘ridan-to‘g‘ri o‘qish rekursiyaga olib keladi, shuning uchun
-- security definer funksiya ishlatiladi.
create or replace function public.joriy_rol()
returns public.rol_turi
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.profillar where id = auth.uid();
$$;

create or replace function public.admin_mi()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.joriy_rol() = 'admin', false);
$$;

create or replace function public.ustoz_yoki_admin_mi()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.joriy_rol() in ('ustoz', 'admin'), false);
$$;

-- --- Yo‘nalishlar --------------------------------------------

create table public.yonalishlar (
  slug text primary key,
  nom text not null,
  tavsif text not null default '',
  tartib int not null default 0
);

-- --- Kurslar -------------------------------------------------

create table public.kurslar (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  qisqa_tavsif text not null default '',
  tavsif text,
  daraja public.daraja_turi not null default 'boshlangich',
  yonalish_slug text references public.yonalishlar (slug) on delete set null,
  davomiylik_daqiqa int not null default 0,
  darslar_soni int not null default 0,
  ustoz_id uuid references public.profillar (id) on delete set null,
  ustoz_ismi text,
  pro boolean not null default false,
  holat public.holat_turi not null default 'qoralama',
  yaratilgan timestamptz not null default now()
);

create index kurslar_holat_idx on public.kurslar (holat);
create index kurslar_yonalish_idx on public.kurslar (yonalish_slug);

-- --- Modullar va darslar -------------------------------------

create table public.modullar (
  id uuid primary key default gen_random_uuid(),
  kurs_id uuid not null references public.kurslar (id) on delete cascade,
  nom text not null,
  tartib int not null default 0
);

create index modullar_kurs_idx on public.modullar (kurs_id);

create table public.darslar (
  id uuid primary key default gen_random_uuid(),
  kurs_id uuid not null references public.kurslar (id) on delete cascade,
  modul_id uuid references public.modullar (id) on delete cascade,
  slug text not null,
  nom text not null,
  tartib int not null default 0,
  turi public.dars_turi not null default 'video',
  davomiylik_daqiqa int not null default 0,
  video_url text,
  yoriqnoma text,
  boshlangich_kod text,
  kutilgan_natija text,
  holat public.holat_turi not null default 'qoralama',
  unique (kurs_id, slug)
);

create index darslar_kurs_idx on public.darslar (kurs_id);
create index darslar_holat_idx on public.darslar (holat);

-- --- Yozilish va jarayon -------------------------------------

create table public.yozilishlar (
  id uuid primary key default gen_random_uuid(),
  foydalanuvchi_id uuid not null references public.profillar (id) on delete cascade,
  kurs_id uuid not null references public.kurslar (id) on delete cascade,
  yaratilgan timestamptz not null default now(),
  unique (foydalanuvchi_id, kurs_id)
);

create table public.dars_jarayoni (
  id uuid primary key default gen_random_uuid(),
  foydalanuvchi_id uuid not null references public.profillar (id) on delete cascade,
  dars_id uuid not null references public.darslar (id) on delete cascade,
  tugatilgan boolean not null default false,
  saqlangan_kod text,
  yangilangan timestamptz not null default now(),
  unique (foydalanuvchi_id, dars_id)
);

create table public.sertifikatlar (
  id uuid primary key default gen_random_uuid(),
  foydalanuvchi_id uuid not null references public.profillar (id) on delete cascade,
  kurs_id uuid not null references public.kurslar (id) on delete cascade,
  berilgan timestamptz not null default now(),
  unique (foydalanuvchi_id, kurs_id)
);

-- --- Hamjamiyat ----------------------------------------------

create table public.munozaralar (
  id uuid primary key default gen_random_uuid(),
  muallif_id uuid not null references public.profillar (id) on delete cascade,
  muallif_ismi text not null default '',
  sarlavha text not null,
  matn text not null default '',
  turkum text not null default 'Umumiy',
  javoblar_soni int not null default 0,
  yaratilgan timestamptz not null default now()
);

create index munozaralar_sana_idx on public.munozaralar (yaratilgan desc);

create table public.javoblar (
  id uuid primary key default gen_random_uuid(),
  munozara_id uuid not null references public.munozaralar (id) on delete cascade,
  muallif_id uuid not null references public.profillar (id) on delete cascade,
  matn text not null,
  yaratilgan timestamptz not null default now()
);

create index javoblar_munozara_idx on public.javoblar (munozara_id);

-- --- Notlar --------------------------------------------------

create table public.notlar (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  qisqa_tavsif text not null default '',
  matn text,
  turkum text not null default 'Umumiy',
  holat public.holat_turi not null default 'qoralama',
  yaratilgan timestamptz not null default now()
);

-- ============================================================
-- RLS — barcha jadvallarda yoqiladi
-- ============================================================

alter table public.profillar enable row level security;
alter table public.yonalishlar enable row level security;
alter table public.kurslar enable row level security;
alter table public.modullar enable row level security;
alter table public.darslar enable row level security;
alter table public.yozilishlar enable row level security;
alter table public.dars_jarayoni enable row level security;
alter table public.sertifikatlar enable row level security;
alter table public.munozaralar enable row level security;
alter table public.javoblar enable row level security;
alter table public.notlar enable row level security;

-- --- Profillar -----------------------------------------------

create policy "Profilni o'zi ko'radi"
  on public.profillar for select
  using (id = auth.uid() or public.admin_mi());

create policy "Profilni o'zi tahrirlaydi"
  on public.profillar for update
  using (id = auth.uid() or public.admin_mi())
  with check (id = auth.uid() or public.admin_mi());

-- Rolni faqat admin o‘zgartira oladi: oddiy foydalanuvchi o‘z rolini
-- oshirib yubormasligi uchun trigger bilan qo‘riqlanadi.
create or replace function public.rol_ozgarishini_tekshir()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rol is distinct from old.rol and not public.admin_mi() then
    raise exception 'Rolni faqat administrator o''zgartira oladi';
  end if;
  return new;
end;
$$;

create trigger rol_qoriqlansin
  before update on public.profillar
  for each row execute function public.rol_ozgarishini_tekshir();

-- --- Ommaviy o‘qish ------------------------------------------

create policy "Yo'nalishlarni hamma ko'radi"
  on public.yonalishlar for select using (true);

create policy "Chop etilgan kurslarni hamma ko'radi"
  on public.kurslar for select
  using (holat = 'chop_etilgan' or public.ustoz_yoki_admin_mi());

create policy "Modullarni hamma ko'radi"
  on public.modullar for select
  using (
    exists (
      select 1 from public.kurslar k
      where k.id = modullar.kurs_id
        and (k.holat = 'chop_etilgan' or public.ustoz_yoki_admin_mi())
    )
  );

create policy "Chop etilgan darslarni hamma ko'radi"
  on public.darslar for select
  using (holat = 'chop_etilgan' or public.ustoz_yoki_admin_mi());

create policy "Chop etilgan notlarni hamma ko'radi"
  on public.notlar for select
  using (holat = 'chop_etilgan' or public.ustoz_yoki_admin_mi());

create policy "Munozaralarni hamma ko'radi"
  on public.munozaralar for select using (true);

create policy "Javoblarni hamma ko'radi"
  on public.javoblar for select using (true);

-- --- Kontentni boshqarish (ustoz va admin) --------------------

create policy "Kurslarni ustoz boshqaradi"
  on public.kurslar for all
  using (public.ustoz_yoki_admin_mi())
  with check (public.ustoz_yoki_admin_mi());

create policy "Modullarni ustoz boshqaradi"
  on public.modullar for all
  using (public.ustoz_yoki_admin_mi())
  with check (public.ustoz_yoki_admin_mi());

create policy "Darslarni ustoz boshqaradi"
  on public.darslar for all
  using (public.ustoz_yoki_admin_mi())
  with check (public.ustoz_yoki_admin_mi());

create policy "Notlarni ustoz boshqaradi"
  on public.notlar for all
  using (public.ustoz_yoki_admin_mi())
  with check (public.ustoz_yoki_admin_mi());

create policy "Yo'nalishlarni admin boshqaradi"
  on public.yonalishlar for all
  using (public.admin_mi())
  with check (public.admin_mi());

-- --- O‘quvchining shaxsiy ma’lumotlari ------------------------

create policy "O'z yozilishlarini ko'radi"
  on public.yozilishlar for select
  using (foydalanuvchi_id = auth.uid() or public.ustoz_yoki_admin_mi());

create policy "O'zi kursga yoziladi"
  on public.yozilishlar for insert
  with check (foydalanuvchi_id = auth.uid());

create policy "O'z yozilishini bekor qiladi"
  on public.yozilishlar for delete
  using (foydalanuvchi_id = auth.uid() or public.admin_mi());

create policy "O'z jarayonini ko'radi"
  on public.dars_jarayoni for select
  using (foydalanuvchi_id = auth.uid() or public.ustoz_yoki_admin_mi());

create policy "O'z jarayonini yozadi"
  on public.dars_jarayoni for insert
  with check (foydalanuvchi_id = auth.uid());

create policy "O'z jarayonini yangilaydi"
  on public.dars_jarayoni for update
  using (foydalanuvchi_id = auth.uid())
  with check (foydalanuvchi_id = auth.uid());

create policy "O'z sertifikatlarini ko'radi"
  on public.sertifikatlar for select
  using (foydalanuvchi_id = auth.uid() or public.ustoz_yoki_admin_mi());

create policy "Sertifikatni admin beradi"
  on public.sertifikatlar for all
  using (public.ustoz_yoki_admin_mi())
  with check (public.ustoz_yoki_admin_mi());

-- --- Hamjamiyat yozuvlari -------------------------------------

create policy "Kirgan foydalanuvchi munozara ochadi"
  on public.munozaralar for insert
  with check (muallif_id = auth.uid());

create policy "O'z munozarasini tahrirlaydi"
  on public.munozaralar for update
  using (muallif_id = auth.uid() or public.admin_mi())
  with check (muallif_id = auth.uid() or public.admin_mi());

create policy "O'z munozarasini o'chiradi"
  on public.munozaralar for delete
  using (muallif_id = auth.uid() or public.admin_mi());

create policy "Kirgan foydalanuvchi javob yozadi"
  on public.javoblar for insert
  with check (muallif_id = auth.uid());

create policy "O'z javobini tahrirlaydi"
  on public.javoblar for update
  using (muallif_id = auth.uid() or public.admin_mi())
  with check (muallif_id = auth.uid() or public.admin_mi());

create policy "O'z javobini o'chiradi"
  on public.javoblar for delete
  using (muallif_id = auth.uid() or public.admin_mi());

-- --- Javoblar sonini avtomatik yangilash ----------------------

create or replace function public.javoblar_sonini_yangila()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.munozaralar
      set javoblar_soni = javoblar_soni + 1
      where id = new.munozara_id;
  elsif tg_op = 'DELETE' then
    update public.munozaralar
      set javoblar_soni = greatest(javoblar_soni - 1, 0)
      where id = old.munozara_id;
  end if;
  return null;
end;
$$;

create trigger javoblar_soni_yangilansin
  after insert or delete on public.javoblar
  for each row execute function public.javoblar_sonini_yangila();

-- --- Yo‘nalishlar boshlang‘ich ma’lumoti ----------------------

insert into public.yonalishlar (slug, nom, tavsif, tartib) values
  ('frontend', 'Frontend Development', 'HTML, CSS, JavaScript va React bilan zamonaviy interfeys qurish.', 1),
  ('backend', 'Backend Development', 'Server, API va ma''lumotlar bazasi — ilovaning ichki qismi.', 2),
  ('data-science', 'Data Science', 'Ma''lumotlarni tahlil qilish, vizualizatsiya va mashinaviy o''qitish.', 3),
  ('ui-ux', 'UI/UX Design', 'Foydalanuvchi tajribasi, interfeys dizayni va prototiplash.', 4);
