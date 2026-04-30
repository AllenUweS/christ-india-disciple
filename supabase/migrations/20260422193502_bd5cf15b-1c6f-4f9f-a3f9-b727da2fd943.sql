-- Create tutor_assignments table to map candidates to their assigned tutor
CREATE TABLE public.tutor_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL UNIQUE,
  tutor_id UUID NOT NULL,
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_tutor_assignments_tutor ON public.tutor_assignments(tutor_id);
CREATE INDEX idx_tutor_assignments_candidate ON public.tutor_assignments(candidate_id);

ALTER TABLE public.tutor_assignments ENABLE ROW LEVEL SECURITY;

-- Helper functions (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_assigned_tutor(_candidate_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tutor_id FROM public.tutor_assignments WHERE candidate_id = _candidate_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_pair(_tutor_id UUID, _candidate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tutor_assignments
    WHERE tutor_id = _tutor_id AND candidate_id = _candidate_id
  )
$$;

CREATE OR REPLACE FUNCTION public.can_communicate(_user_a UUID, _user_b UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Admins can communicate with anyone
    public.has_role(_user_a, 'admin') OR public.has_role(_user_b, 'admin')
    -- Or they are an assigned tutor-candidate pair
    OR EXISTS (
      SELECT 1 FROM public.tutor_assignments
      WHERE (tutor_id = _user_a AND candidate_id = _user_b)
         OR (tutor_id = _user_b AND candidate_id = _user_a)
    )
$$;

-- RLS for tutor_assignments
CREATE POLICY "Admins manage assignments"
ON public.tutor_assignments FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors view own assignments"
ON public.tutor_assignments FOR SELECT
USING (auth.uid() = tutor_id);

CREATE POLICY "Candidates view own assignment"
ON public.tutor_assignments FOR SELECT
USING (auth.uid() = candidate_id);

CREATE TRIGGER update_tutor_assignments_updated_at
BEFORE UPDATE ON public.tutor_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tighten messages: only allow inserts between assigned pairs (or admin)
DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages to allowed users"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND public.can_communicate(sender_id, recipient_id)
);

-- Restrict viewing profiles: candidates only see their assigned tutor + admins;
-- tutors only see their assigned candidates + other tutors/admins; admins see all
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

CREATE POLICY "Profiles visibility based on assignments"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- Self
  auth.uid() = user_id
  -- Admins see all
  OR public.has_role(auth.uid(), 'admin')
  -- Tutors see admins, other tutors, and their assigned candidates
  OR (
    public.has_role(auth.uid(), 'tutor')
    AND (
      public.has_role(user_id, 'admin')
      OR public.has_role(user_id, 'tutor')
      OR public.is_assigned_pair(auth.uid(), user_id)
    )
  )
  -- Candidates see admins and their assigned tutor only
  OR (
    public.has_role(auth.uid(), 'candidate')
    AND (
      public.has_role(user_id, 'admin')
      OR public.get_assigned_tutor(auth.uid()) = user_id
    )
  )
);

-- Restrict user_roles visibility similarly
DROP POLICY IF EXISTS "Candidates view tutor and admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Tutors view candidate roles" ON public.user_roles;

CREATE POLICY "Candidates view assigned tutor and admin roles"
ON public.user_roles FOR SELECT
USING (
  public.has_role(auth.uid(), 'candidate')
  AND (
    role = 'admin'
    OR (role = 'tutor' AND public.get_assigned_tutor(auth.uid()) = user_id)
  )
);

CREATE POLICY "Tutors view assigned candidate roles"
ON public.user_roles FOR SELECT
USING (
  public.has_role(auth.uid(), 'tutor')
  AND (
    role IN ('admin', 'tutor')
    OR (role = 'candidate' AND public.is_assigned_pair(auth.uid(), user_id))
  )
);