-- Onboarding: o'quvchining tajriba darajasi, maqsad turi va tanlagan yo'nalishi.
-- Hammasi ixtiyoriy (null bo'lishi mumkin) — mavjud profillar buzilmaydi.

alter table public.profillar
  add column if not exists tajriba_darajasi text
    check (tajriba_darajasi in ('boshlangich', 'orta', 'yuqori')),
  add column if not exists maqsad_turi text
    check (maqsad_turi in ('ish', 'frilans', 'loyiha', 'oqish', 'qiziqish')),
  add column if not exists tanlangan_yonalish text
    references public.yonalishlar (slug) on delete set null on update cascade;
