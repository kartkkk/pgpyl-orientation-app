-- ============================================================================
-- Inside The Atrium — RLS Policies for Groups
-- ============================================================================

ALTER TABLE public.groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- ─── groups ────────────────────────────────────────────────────────────────

-- Admin: full access to all groups
CREATE POLICY "groups: admin full"
  ON public.groups FOR ALL
  USING (public.is_admin());

-- Student: can read groups they are a member of or invited to
CREATE POLICY "groups: student reads own"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = id
        AND gm.profile_id = auth.uid()
        AND gm.status IN ('active', 'invited')
    )
  );

-- Student: can create groups
CREATE POLICY "groups: student insert"
  ON public.groups FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND NOT public.is_admin()
  );

-- Student: can update groups they created (rename)
CREATE POLICY "groups: student update own"
  ON public.groups FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ─── group_members ─────────────────────────────────────────────────────────

-- Admin: full access
CREATE POLICY "group_members: admin full"
  ON public.group_members FOR ALL
  USING (public.is_admin());

-- Student: can read members of groups they belong to
CREATE POLICY "group_members: student reads own groups"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members my_membership
      WHERE my_membership.group_id = group_id
        AND my_membership.profile_id = auth.uid()
        AND my_membership.status IN ('active', 'invited')
    )
  );

-- Student group creator: can invite (insert) members to their groups
CREATE POLICY "group_members: creator invites"
  ON public.group_members FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND g.created_by = auth.uid()
    )
  );

-- Student: can update own membership (accept/decline invite)
CREATE POLICY "group_members: student updates own status"
  ON public.group_members FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Student: can delete own membership (leave group)
CREATE POLICY "group_members: student leaves"
  ON public.group_members FOR DELETE
  USING (profile_id = auth.uid());
