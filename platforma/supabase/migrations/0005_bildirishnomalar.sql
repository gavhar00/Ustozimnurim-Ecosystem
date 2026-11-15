-- ============================================================
-- Bildirishnomalar: jadval va avtomatik triggerlar
-- ============================================================
-- Yozish faqat triggerlar orqali bo'ladi: insert siyosati ataylab yo'q,
-- shuning uchun foydalanuvchi o'zi uchun soxta bildirishnoma yarata olmaydi.

create type public.bildirishnoma_turi as enum (
  'boglanish_sorovi', 'sorov_qabul', 'yangi_kuzatuvchi',
  'post_yoqtirildi', 'javob_yozildi'
);

create table public.bildirishnomalar (
  id uuid primary key default gen_random_uuid(),
  qabul_qiluvchi_id uuid not null references public.profillar (id) on delete cascade,
  yuboruvchi_id uuid references public.profillar (id) on delete set null,
  turi public.bildirishnoma_turi not null,
  matn text not null,
  havola text,
  oqilgan boolean not null default false,
  yaratilgan timestamptz not null default now()
);

create index bildirishnomalar_qabul_idx
  on public.bildirishnomalar (qabul_qiluvchi_id, oqilgan, yaratilgan desc);

alter table public.bildirishnomalar enable row level security;

create policy "bildirishnoma_select" on public.bildirishnomalar for select
  using (qabul_qiluvchi_id = auth.uid());
create policy "bildirishnoma_update" on public.bildirishnomalar for update
  using (qabul_qiluvchi_id = auth.uid())
  with check (qabul_qiluvchi_id = auth.uid());
create policy "bildirishnoma_delete" on public.bildirishnomalar for delete
  using (qabul_qiluvchi_id = auth.uid());

create or replace function public.bildirishnoma_qosh(
  p_qabul uuid, p_yuboruvchi uuid, p_turi public.bildirishnoma_turi,
  p_matn text, p_havola text
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_qabul is null or p_qabul = p_yuboruvchi then
    return;
  end if;
  insert into public.bildirishnomalar
    (qabul_qiluvchi_id, yuboruvchi_id, turi, matn, havola)
  values (p_qabul, p_yuboruvchi, p_turi, p_matn, p_havola);
end;
$$;

create or replace function public.ism_olish(p_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(btrim(toliq_ism), ''), 'Foydalanuvchi')
  from public.profillar where id = p_id;
$$;

create or replace function public.boglanish_bildirishnomasi()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.bildirishnoma_qosh(
      new.qabul_qiluvchi_id, new.yuboruvchi_id, 'boglanish_sorovi',
      public.ism_olish(new.yuboruvchi_id) || ' sizga bog''lanish so''rovi yubordi',
      '/panel/boglanishlar');
  elsif tg_op = 'UPDATE' and new.holat = 'qabul' and old.holat is distinct from 'qabul' then
    perform public.bildirishnoma_qosh(
      new.yuboruvchi_id, new.qabul_qiluvchi_id, 'sorov_qabul',
      public.ism_olish(new.qabul_qiluvchi_id) || ' so''rovingizni qabul qildi',
      '/panel/boglanishlar');
  end if;
  return null;
end;
$$;

create trigger boglanish_bildirsin
  after insert or update on public.boglanishlar
  for each row execute function public.boglanish_bildirishnomasi();

create or replace function public.obuna_bildirishnomasi()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.bildirishnoma_qosh(
    new.kuzatilgan_id, new.kuzatuvchi_id, 'yangi_kuzatuvchi',
    public.ism_olish(new.kuzatuvchi_id) || ' sizni kuzata boshladi',
    '/panel/boglanishlar');
  return null;
end;
$$;

create trigger obuna_bildirsin
  after insert on public.obunalar
  for each row execute function public.obuna_bildirishnomasi();

create or replace function public.yoqtirish_bildirishnomasi()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_muallif uuid;
  v_username text;
begin
  select muallif_id into v_muallif from public.postlar where id = new.post_id;
  select username into v_username from public.profillar where id = v_muallif;

  perform public.bildirishnoma_qosh(
    v_muallif, new.foydalanuvchi_id, 'post_yoqtirildi',
    public.ism_olish(new.foydalanuvchi_id) || ' postingizni yoqtirdi',
    case when v_username is null then null
         else '/profil/' || v_username || '?bolim=postlar' end);
  return null;
end;
$$;

create trigger yoqtirish_bildirsin
  after insert on public.post_yoqtirishlari
  for each row execute function public.yoqtirish_bildirishnomasi();

create or replace function public.javob_bildirishnomasi()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_muallif uuid;
begin
  select muallif_id into v_muallif from public.munozaralar where id = new.munozara_id;

  perform public.bildirishnoma_qosh(
    v_muallif, new.muallif_id, 'javob_yozildi',
    public.ism_olish(new.muallif_id) || ' munozarangizga javob yozdi',
    '/hamjamiyat/' || new.munozara_id::text);
  return null;
end;
$$;

create trigger javob_bildirsin
  after insert on public.javoblar
  for each row execute function public.javob_bildirishnomasi();

-- Yordamchi funksiyalarni API dan yopamiz
revoke execute on function public.bildirishnoma_qosh(uuid, uuid, public.bildirishnoma_turi, text, text)
  from anon, authenticated;
revoke execute on function public.ism_olish(uuid) from anon, authenticated;
revoke execute on function public.boglanish_bildirishnomasi() from anon, authenticated;
revoke execute on function public.obuna_bildirishnomasi() from anon, authenticated;
revoke execute on function public.yoqtirish_bildirishnomasi() from anon, authenticated;
revoke execute on function public.javob_bildirishnomasi() from anon, authenticated;
