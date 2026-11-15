-- ============================================================
-- Birinchi administratorni belgilash imkoniyati
-- ============================================================
-- Rol qo'riqchisi auth.uid() bo'sh bo'lgan holatda (SQL muharriri yoki
-- service_role) tekshiruvni o'tkazib yuboradi — birinchi adminni shu yo'l
-- bilan belgilaymiz. Brauzerdan kelgan har qanday so'rovda auth.uid()
-- mavjud, shuning uchun foydalanuvchi o'z rolini o'zi oshira olmaydi.

create or replace function public.rol_ozgarishini_tekshir()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.rol is distinct from old.rol
     and auth.uid() is not null
     and not public.admin_mi() then
    raise exception 'Rolni faqat administrator ozgartira oladi';
  end if;
  return new;
end;
$$;

-- Birinchi adminni belgilash (emailni o'zingiznikiga almashtiring):
-- update public.profillar set rol = 'admin'
-- where id = (select id from auth.users where email = 'sizning@email.uz');
