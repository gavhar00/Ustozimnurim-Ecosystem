-- Yo'nalishlarni admin paneldan boshqarish: ikona va faollik ustunlari.

alter table public.yonalishlar
  add column if not exists ikona text not null default 'code',
  add column if not exists faol boolean not null default true;

update public.yonalishlar set ikona = 'code' where slug = 'frontend';
update public.yonalishlar set ikona = 'database' where slug = 'backend';
update public.yonalishlar set ikona = 'chart' where slug = 'data-science';
update public.yonalishlar set ikona = 'palette' where slug = 'ui-ux';

-- Qo'shimcha yo'nalishlar yashirin holatda yaratiladi: admin kurs qo'shib,
-- keyin yoqadi. Shunda saytda bo'sh yo'nalish ko'rinmaydi.
insert into public.yonalishlar (slug, nom, tavsif, tartib, ikona, faol) values
  ('mobil', 'Mobil dasturlash', 'Android va iOS uchun mobil ilovalar yaratish.', 5, 'smartphone', false),
  ('kiberxavfsizlik', 'Kiberxavfsizlik', 'Axborot xavfsizligi asoslari: tahdidlarni tushunish va tizimlarni himoya qilish.', 6, 'shield', false),
  ('devops', 'DevOps', 'Ilovalarni joylashtirish, avtomatlashtirish va barqaror ishlashini ta''minlash.', 7, 'server', false)
on conflict (slug) do nothing;
