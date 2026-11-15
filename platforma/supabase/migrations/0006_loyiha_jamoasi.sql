-- ============================================================
-- Loyiha jamoasi va qo'shilish so'rovlari
-- ============================================================
-- Eslatma: enum qiymatlari alohida migratsiyada qo'shiladi, chunki
-- PostgreSQL yangi qiymatni qo'shilgan tranzaksiyaning o'zida ishlatishga
-- ruxsat bermaydi.
--   alter type public.bildirishnoma_turi add value if not exists 'loyiha_sorovi';
--   alter type public.bildirishnoma_turi add value if not exists 'loyiha_qabul';

create or replace function public.loyiha_egasi(p_loyiha uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.loyihalar
    where id = p_loyiha and muallif_id = auth.uid()
  );
$$;

create table public.loyiha_azolari (
  loyiha_id uuid not null references public.loyihalar (id) on delete cascade,
  foydalanuvchi_id uuid not null references public.profillar (id) on delete cascade,
  rol text not null default 'a''zo',
  yaratilgan timestamptz not null default now(),
  primary key (loyiha_id, foydalanuvchi_id)
);

create index loyiha_azolari_foydalanuvchi_idx
  on public.loyiha_azolari (foydalanuvchi_id);

alter table public.loyiha_azolari enable row level security;

create policy "azo_select" on public.loyiha_azolari for select using (true);
create policy "azo_insert" on public.loyiha_azolari for insert
  with check (public.loyiha_egasi(loyiha_id));
create policy "azo_delete" on public.loyiha_azolari for delete
  using (public.loyiha_egasi(loyiha_id) or foydalanuvchi_id = auth.uid());

create or replace function public.loyiha_muallifini_qosh()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.loyiha_azolari (loyiha_id, foydalanuvchi_id, rol)
  values (new.id, new.muallif_id, 'muallif')
  on conflict do nothing;
  return null;
end;
$$;

create trigger loyiha_muallifi_qoshilsin
  after insert on public.loyihalar
  for each row execute function public.loyiha_muallifini_qosh();

insert into public.loyiha_azolari (loyiha_id, foydalanuvchi_id, rol)
select id, muallif_id, 'muallif' from public.loyihalar
on conflict do nothing;

create table public.loyiha_sorovlari (
  id uuid primary key default gen_random_uuid(),
  loyiha_id uuid not null references public.loyihalar (id) on delete cascade,
  foydalanuvchi_id uuid not null references public.profillar (id) on delete cascade,
  xabar text not null default '',
  holat public.sorov_holati not null default 'kutilmoqda',
  yaratilgan timestamptz not null default now(),
  unique (loyiha_id, foydalanuvchi_id)
);

create index loyiha_sorovlari_loyiha_idx
  on public.loyiha_sorovlari (loyiha_id, holat);

alter table public.loyiha_sorovlari enable row level security;

create policy "loyiha_sorov_select" on public.loyiha_sorovlari for select
  using (foydalanuvchi_id = auth.uid() or public.loyiha_egasi(loyiha_id));
create policy "loyiha_sorov_insert" on public.loyiha_sorovlari for insert
  with check (foydalanuvchi_id = auth.uid() and not public.loyiha_egasi(loyiha_id));
create policy "loyiha_sorov_update" on public.loyiha_sorovlari for update
  using (public.loyiha_egasi(loyiha_id))
  with check (public.loyiha_egasi(loyiha_id));
create policy "loyiha_sorov_delete" on public.loyiha_sorovlari for delete
  using (foydalanuvchi_id = auth.uid() or public.loyiha_egasi(loyiha_id));

create or replace function public.loyiha_sorov_bildirishnomasi()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_ega uuid;
  v_nom text;
begin
  select muallif_id, nom into v_ega, v_nom
  from public.loyihalar where id = new.loyiha_id;

  if tg_op = 'INSERT' then
    perform public.bildirishnoma_qosh(
      v_ega, new.foydalanuvchi_id, 'loyiha_sorovi',
      public.ism_olish(new.foydalanuvchi_id) || ' "' || v_nom ||
        '" loyihasiga qo''shilmoqchi',
      '/panel/loyihalarim');

  elsif tg_op = 'UPDATE' and new.holat = 'qabul'
        and old.holat is distinct from 'qabul' then
    insert into public.loyiha_azolari (loyiha_id, foydalanuvchi_id)
    values (new.loyiha_id, new.foydalanuvchi_id)
    on conflict do nothing;

    perform public.bildirishnoma_qosh(
      new.foydalanuvchi_id, v_ega, 'loyiha_qabul',
      'Siz "' || v_nom || '" loyihasi jamoasiga qabul qilindingiz',
      '/hamjamiyat/loyihalar/' || new.loyiha_id::text);
  end if;

  return null;
end;
$$;

create trigger loyiha_sorovi_bildirsin
  after insert or update on public.loyiha_sorovlari
  for each row execute function public.loyiha_sorov_bildirishnomasi();

revoke execute on function public.loyiha_muallifini_qosh() from anon, authenticated;
revoke execute on function public.loyiha_sorov_bildirishnomasi() from anon, authenticated;
