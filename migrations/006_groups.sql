-- ============================================================================
-- Inside The Atrium — Groups & Group Members
-- ============================================================================

-- ─── Custom Type ───────────────────────────────────────────────────────────

CREATE TYPE public.group_member_status AS ENUM ('invited', 'active', 'declined');

-- ─── Groups ────────────────────────────────────────────────────────────────

CREATE TABLE public.groups (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  created_by       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  is_admin_created boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE INDEX idx_groups_created_by ON public.groups(created_by);

-- ─── Group Members ─────────────────────────────────────────────────────────

CREATE TABLE public.group_members (
  id         uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid                NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id uuid                NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     group_member_status NOT NULL DEFAULT 'invited',
  invited_by uuid                REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at  timestamptz,
  created_at timestamptz         NOT NULL DEFAULT now(),
  updated_at timestamptz         NOT NULL DEFAULT now(),

  UNIQUE (group_id, profile_id)
);

CREATE TRIGGER group_members_updated_at
  BEFORE UPDATE ON public.group_members
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE INDEX idx_group_members_group_id   ON public.group_members(group_id);
CREATE INDEX idx_group_members_profile_id ON public.group_members(profile_id);
CREATE INDEX idx_group_members_status     ON public.group_members(status);
