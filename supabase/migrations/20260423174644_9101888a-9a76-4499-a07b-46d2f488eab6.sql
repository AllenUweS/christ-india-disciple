-- Enums
CREATE TYPE public.billing_type AS ENUM ('monthly', 'one_time');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Plan pricing (admin managed)
CREATE TABLE public.plan_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level public.course_level NOT NULL UNIQUE,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  billing_type public.billing_type NOT NULL DEFAULT 'one_time',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view active pricing"
  ON public.plan_pricing FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage pricing"
  ON public.plan_pricing FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER plan_pricing_updated_at
  BEFORE UPDATE ON public.plan_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Candidate subscriptions
CREATE TABLE public.candidate_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  level public.course_level NOT NULL,
  billing_type public.billing_type NOT NULL,
  price_paid numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status public.subscription_status NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidate_subs_candidate ON public.candidate_subscriptions(candidate_id);
CREATE INDEX idx_candidate_subs_level ON public.candidate_subscriptions(candidate_id, level);

ALTER TABLE public.candidate_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates view own subscriptions"
  ON public.candidate_subscriptions FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Admins view all subscriptions"
  ON public.candidate_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors view assigned candidates' subscriptions"
  ON public.candidate_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'tutor') AND public.is_assigned_pair(auth.uid(), candidate_id));

CREATE POLICY "Candidates create own subscriptions"
  ON public.candidate_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Admins manage all subscriptions"
  ON public.candidate_subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER candidate_subs_updated_at
  BEFORE UPDATE ON public.candidate_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: does user have an active plan for given level?
CREATE OR REPLACE FUNCTION public.has_active_plan(_user_id uuid, _level public.course_level)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidate_subscriptions
    WHERE candidate_id = _user_id
      AND level = _level
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Helper: any active plan
CREATE OR REPLACE FUNCTION public.has_any_active_plan(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidate_subscriptions
    WHERE candidate_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Seed default pricing
INSERT INTO public.plan_pricing (level, price, billing_type, features) VALUES
  ('basic', 0, 'one_time', '["Foundational lessons", "AI mentor (limited)", "Initial assessment", "Community fellowship"]'::jsonb),
  ('intermediate', 1499, 'one_time', '["All Basic features", "Full AI mentor access", "Live tutor sessions", "Progress analytics", "Certificate of growth"]'::jsonb),
  ('senior', 3999, 'one_time', '["All Intermediate features", "1-on-1 mentorship", "Advanced theological depth", "Teaching credentials", "Priority live communion"]'::jsonb);