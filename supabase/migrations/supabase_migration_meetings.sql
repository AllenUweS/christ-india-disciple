-- ============================================================
-- Google Meet Integration — Supabase Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  meet_link     TEXT NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_role  TEXT NOT NULL CHECK (creator_role IN ('admin', 'tutor')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create meeting_participants join table
CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_created_by        ON public.meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at      ON public.meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user  ON public.meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meet  ON public.meeting_participants(meeting_id);

-- 4. Enable RLS
ALTER TABLE public.meetings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for meetings
-- Admin: full access
CREATE POLICY "admin_all_meetings" ON public.meetings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tutor: can create meetings; can see meetings they created
CREATE POLICY "tutor_insert_meetings" ON public.meetings
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'tutor')
    AND created_by = auth.uid()
  );

CREATE POLICY "tutor_select_own_meetings" ON public.meetings
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'tutor')
    AND created_by = auth.uid()
  );

-- Candidate: can see meetings where they are a participant
CREATE POLICY "candidate_select_meetings" ON public.meetings
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'candidate')
    AND id IN (
      SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid()
    )
  );

-- 6. RLS Policies for meeting_participants
-- Admin: full access
CREATE POLICY "admin_all_participants" ON public.meeting_participants
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tutor: can manage participants for their own meetings only
CREATE POLICY "tutor_manage_participants" ON public.meeting_participants
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'tutor')
    AND meeting_id IN (SELECT id FROM public.meetings WHERE created_by = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'tutor')
    AND meeting_id IN (SELECT id FROM public.meetings WHERE created_by = auth.uid())
  );

-- Candidate: can see their own participant rows
CREATE POLICY "candidate_select_participants" ON public.meeting_participants
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'candidate')
    AND user_id = auth.uid()
  );

-- 7. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_meetings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_meetings_updated_at ON public.meetings;
CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_meetings_updated_at();
