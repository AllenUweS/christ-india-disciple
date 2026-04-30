
-- 1. Create lesson_resources table for multiple PDFs/PPTs/YouTube links per lesson
CREATE TYPE public.resource_kind AS ENUM ('pdf', 'ppt', 'youtube');

CREATE TABLE public.lesson_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  kind public.resource_kind NOT NULL,
  title TEXT,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_lesson_resources_lesson_id ON public.lesson_resources(lesson_id);

ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view lesson resources"
ON public.lesson_resources
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage lesson resources"
ON public.lesson_resources
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER lesson_resources_updated_at
BEFORE UPDATE ON public.lesson_resources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tighten content management policies so only admins can write

-- Courses: replace tutor write access
DROP POLICY IF EXISTS "Tutors and admins create courses" ON public.courses;
DROP POLICY IF EXISTS "Tutors and admins update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins delete courses" ON public.courses;

CREATE POLICY "Admins manage courses"
ON public.courses
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lessons
DROP POLICY IF EXISTS "Tutors and admins manage lessons" ON public.lessons;

CREATE POLICY "Admins manage lessons"
ON public.lessons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tests
DROP POLICY IF EXISTS "Tutors and admins manage tests" ON public.tests;

CREATE POLICY "Admins manage tests"
ON public.tests
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Questions
DROP POLICY IF EXISTS "Tutors and admins manage questions" ON public.questions;

CREATE POLICY "Admins manage questions"
ON public.questions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
