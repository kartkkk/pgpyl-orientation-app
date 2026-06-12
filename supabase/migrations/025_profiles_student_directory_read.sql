-- Allow students to browse fellow students in the directory while
-- keeping admin profiles hidden from student accounts.

create or replace function public.is_student()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'student' and is_active = true
  );
$$;

drop policy if exists "profiles: read self or admin reads all"
  on public.profiles;

drop policy if exists "profiles: read self, admin all, students see students"
  on public.profiles;

create policy "profiles: read self, admin all, students see students"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    or (role = 'student' and is_active = true and public.is_student())
  );