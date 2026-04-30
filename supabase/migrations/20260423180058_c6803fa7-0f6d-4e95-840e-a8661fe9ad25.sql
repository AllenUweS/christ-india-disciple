-- Override scope: whole level, specific course, or specific lesson
CREATE TYPE public.override_scope AS ENUM ('level', 'course', 'lesson');

CREATE TABLE public.content_access_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  scope public.override_scope NOT NULL,
  level public.course_level,           -- required when scope = 'level'
  course_id UUID,                       -- required when scope = 'course'
  lesson_id UUID,                       -- required when scope = 'lesson'
  granted_by UUID,                      -- admin user_id
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlock_until TIMESTAMPTZ NOT NULL,    -- access expires at
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (scope = 'level' AND level IS NOT NULL AND course_id IS NULL AND lesson_id IS NULL) OR
    (scope = 'course' AND course_id IS NOT NULL AND level IS NULL AND lesson_id IS NULL) OR
    (scope = 'lesson' AND lesson_id IS NOT NULL AND level IS NULL AND course_id IS NULL)
  )
);

CREATE INDEX idx_overrides_candidate ON public.content_access_overrides(candidate_id);
CREATE INDEX idx_overrides_unlock_until ON public.content_access_overrides(unlock_until);

ALTER TABLE public.content_access_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates view own overrides"
ON public.content_access_overrides FOR SELECT
USING (auth.uid() = candidate_id);

CREATE POLICY "Admins manage overrides"
ON public.content_access_overrides FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_overrides_updated_at
BEFORE UPDATE ON public.content_access_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Has a non-expired admin override for this lesson (lesson, parent course, or parent level)
CREATE OR REPLACE FUNCTION public.has_override_for_lesson(_user_id uuid, _lesson_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.content_access_overrides o
    LEFT JOIN public.lessons l ON l.id = _lesson_id
    LEFT JOIN public.courses c ON c.id = l.course_id
    WHERE o.candidate_id = _user_id
      AND o.unlock_until > now()
      AND (
        (o.scope = 'lesson' AND o.lesson_id = _lesson_id) OR
        (o.scope = 'course' AND o.course_id = l.course_id) OR
        (o.scope = 'level'  AND o.level     = c.level)
      )
  )
$$;

-- Has a non-expired admin override for this course
CREATE OR REPLACE FUNCTION public.has_override_for_course(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.content_access_overrides o
    LEFT JOIN public.courses c ON c.id = _course_id
    WHERE o.candidate_id = _user_id
      AND o.unlock_until > now()
      AND (
        (o.scope = 'course' AND o.course_id = _course_id) OR
        (o.scope = 'level'  AND o.level     = c.level)
      )
  )
$$;

-- Has a non-expired admin override for this level
CREATE OR REPLACE FUNCTION public.has_override_for_level(_user_id uuid, _level course_level)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.content_access_overrides
    WHERE candidate_id = _user_id
      AND scope = 'level'
      AND level = _level
      AND unlock_until > now()
  )
$$;

-- Combined access check: paid subscription OR admin override
CREATE OR REPLACE FUNCTION public.can_access_level(_user_id uuid, _level course_level)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_active_plan(_user_id, _level)
      OR public.has_override_for_level(_user_id, _level)
$$;

CREATE OR REPLACE FUNCTION public.can_access_course(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = _course_id
      AND (public.has_active_plan(_user_id, c.level) OR public.has_override_for_course(_user_id, _course_id))
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_lesson(_user_id uuid, _lesson_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = _lesson_id
      AND (public.has_active_plan(_user_id, c.level) OR public.has_override_for_lesson(_user_id, _lesson_id))
  )
$$;