-- ============================================================================
-- Inside The Atrium — Row Level Security Policies
-- ============================================================================

-- ─── Enable RLS on all tables ───────────────────────────────────────────────

alter table public.sections                 enable row level security;
alter table public.profiles                 enable row level security;
alter table public.events                   enable row level security;
alter table public.event_assignments        enable row level security;
alter table public.attendance_sessions      enable row level security;
alter table public.qr_tokens                enable row level security;
alter table public.attendance_records       enable row level security;
alter table public.documents                enable row level security;
alter table public.document_assignments     enable row level security;
alter table public.notifications            enable row level security;
alter table public.notification_assignments enable row level security;
alter table public.notification_deliveries  enable row level security;

-- ─── Helper Functions ───────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create or replace function public.my_section_id()
returns uuid
language sql stable security definer
as $$
  select section_id from public.profiles where id = auth.uid();
$$;

-- ─── sections ───────────────────────────────────────────────────────────────

create policy "sections: all authenticated read"
  on public.sections for select
  using (auth.role() = 'authenticated');

create policy "sections: admin write"
  on public.sections for insert
  with check (public.is_admin());

create policy "sections: admin update"
  on public.sections for update
  using (public.is_admin());

-- ─── profiles ───────────────────────────────────────────────────────────────

create policy "profiles: read self or admin reads all"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: self insert on signup"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: self update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin update any"
  on public.profiles for update
  using (public.is_admin());

-- ─── events ─────────────────────────────────────────────────────────────────

create policy "events: admin full access"
  on public.events for all
  using (public.is_admin());

create policy "events: student reads visible"
  on public.events for select
  using (
    is_cancelled = false and (
      visibility = 'all'
      or (visibility = 'section' and exists (
        select 1 from public.event_assignments ea
        where ea.event_id = id and ea.section_id = public.my_section_id()
      ))
      or (visibility = 'individual' and exists (
        select 1 from public.event_assignments ea
        where ea.event_id = id and ea.profile_id = auth.uid()
      ))
    )
  );

-- ─── event_assignments ──────────────────────────────────────────────────────

create policy "event_assignments: admin full"
  on public.event_assignments for all
  using (public.is_admin());

create policy "event_assignments: student reads own"
  on public.event_assignments for select
  using (
    section_id = public.my_section_id()
    or profile_id = auth.uid()
  );

-- ─── attendance_sessions ────────────────────────────────────────────────────

create policy "attendance_sessions: admin manage"
  on public.attendance_sessions for all
  using (public.is_admin());

create policy "attendance_sessions: student reads for assigned events"
  on public.attendance_sessions for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and (
        e.visibility = 'all'
        or exists (select 1 from public.event_assignments ea where ea.event_id = e.id and ea.section_id = public.my_section_id())
        or exists (select 1 from public.event_assignments ea where ea.event_id = e.id and ea.profile_id = auth.uid())
      )
    )
  );

-- ─── qr_tokens ──────────────────────────────────────────────────────────────
-- Students receive tokens via Realtime broadcast; no direct SELECT needed.

create policy "qr_tokens: admin read"
  on public.qr_tokens for select
  using (public.is_admin());

-- Service role (Edge Functions) bypasses RLS.

-- ─── attendance_records ─────────────────────────────────────────────────────

create policy "attendance_records: student insert own"
  on public.attendance_records for insert
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.qr_tokens qt
      where qt.id = qr_token_id and qt.valid_until > now()
    )
    and exists (
      select 1 from public.attendance_sessions s
      where s.id = session_id and s.is_open = true
    )
  );

create policy "attendance_records: read own or admin"
  on public.attendance_records for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "attendance_records: admin all"
  on public.attendance_records for all
  using (public.is_admin());

-- ─── documents ──────────────────────────────────────────────────────────────

create policy "documents: admin full"
  on public.documents for all
  using (public.is_admin());

create policy "documents: student reads visible"
  on public.documents for select
  using (
    visibility = 'all'
    or (visibility = 'section' and exists (
      select 1 from public.document_assignments da
      where da.document_id = id and da.section_id = public.my_section_id()
    ))
    or (visibility = 'individual' and exists (
      select 1 from public.document_assignments da
      where da.document_id = id and da.profile_id = auth.uid()
    ))
  );

-- ─── document_assignments ───────────────────────────────────────────────────

create policy "document_assignments: admin full"
  on public.document_assignments for all
  using (public.is_admin());

create policy "document_assignments: student reads own"
  on public.document_assignments for select
  using (section_id = public.my_section_id() or profile_id = auth.uid());

-- ─── notifications ──────────────────────────────────────────────────────────

create policy "notifications: admin full"
  on public.notifications for all
  using (public.is_admin());

create policy "notifications: student reads sent"
  on public.notifications for select
  using (
    status = 'sent' and (
      visibility = 'all'
      or (visibility = 'section' and exists (
        select 1 from public.notification_assignments na
        where na.notification_id = id and na.section_id = public.my_section_id()
      ))
      or (visibility = 'individual' and exists (
        select 1 from public.notification_assignments na
        where na.notification_id = id and na.profile_id = auth.uid()
      ))
    )
  );

-- ─── notification_assignments ───────────────────────────────────────────────

create policy "notification_assignments: admin full"
  on public.notification_assignments for all
  using (public.is_admin());

-- ─── notification_deliveries ────────────────────────────────────────────────

create policy "notification_deliveries: read own or admin"
  on public.notification_deliveries for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "notification_deliveries: mark read"
  on public.notification_deliveries for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "notification_deliveries: admin full"
  on public.notification_deliveries for all
  using (public.is_admin());
