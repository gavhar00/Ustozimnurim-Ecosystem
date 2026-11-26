-- Duel taklifi uchun bildirishnoma turi (alohida migratsiya: enum qiymatini shu tranzaksiyada ishlatib bo‘lmaydi).
alter type public.bildirishnoma_turi add value if not exists 'duel_taklifi';
