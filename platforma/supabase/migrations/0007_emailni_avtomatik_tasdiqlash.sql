-- Ro'yxatdan o'tgan foydalanuvchi emailini avtomatik tasdiqlangan qiladi,
-- shunda pochtadagi havolani bosish shart bo'lmaydi va GoTrue tasdiqlash
-- xatini umuman jo'natmaydi (bepul tarifdagi xat limitiga ham tushmaydi).
create or replace function public.emailni_avtomatik_tasdiqla()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

revoke execute on function public.emailni_avtomatik_tasdiqla() from anon, authenticated;

drop trigger if exists emailni_avtomatik_tasdiqla on auth.users;

create trigger emailni_avtomatik_tasdiqla
  before insert on auth.users
  for each row
  execute function public.emailni_avtomatik_tasdiqla();
