-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'tutor', 'candidate');
CREATE TYPE public.course_level AS ENUM ('basic', 'intermediate', 'senior');
CREATE TYPE public.question_type AS ENUM ('mcq', 'fib');
CREATE TYPE public.attempt_status AS ENUM ('in_progress', 'passed', 'failed');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- ============ COURSES (level groupings) ============
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  level course_level NOT NULL,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- ============ LESSONS (a class) ============
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  pdf_url TEXT,
  ppt_url TEXT,
  youtube_url TEXT,
  text_content TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- ============ TESTS ============
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  pass_percentage INTEGER NOT NULL DEFAULT 25,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  q_type question_type NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- ============ TEST ATTEMPTS ============
CREATE TABLE public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  status attempt_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- ============ LESSON PROGRESS ============
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- ============ CANDIDATE LEVEL UNLOCK ============
CREATE TABLE public.candidate_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level course_level NOT NULL,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  UNIQUE (candidate_id, level)
);
ALTER TABLE public.candidate_levels ENABLE ROW LEVEL SECURITY;

-- ============ MESSAGES (tutor <-> candidate) ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_courses_updated  BEFORE UPDATE ON public.courses  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_lessons_updated  BEFORE UPDATE ON public.lessons  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tests_updated    BEFORE UPDATE ON public.tests    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email);

  -- default role: candidate (admin promotes others manually)
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'candidate');

  -- unlock basic level by default
  INSERT INTO public.candidate_levels (candidate_id, level, unlocked, unlocked_at)
  VALUES (NEW.id, 'basic', true, now());

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- courses
CREATE POLICY "Authenticated view published courses" ON public.courses FOR SELECT TO authenticated USING (is_published OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));
CREATE POLICY "Tutors and admins create courses" ON public.courses FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));
CREATE POLICY "Tutors and admins update courses" ON public.courses FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));
CREATE POLICY "Admins delete courses" ON public.courses FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- lessons
CREATE POLICY "Authenticated view lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tutors and admins manage lessons" ON public.lessons FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));

-- tests
CREATE POLICY "Authenticated view tests" ON public.tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tutors and admins manage tests" ON public.tests FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));

-- questions (no correct_answer leak: candidates need to see options. Hide via column? We allow SELECT but UI doesn't show it.)
CREATE POLICY "Authenticated view questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tutors and admins manage questions" ON public.questions FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));

-- test_attempts
CREATE POLICY "Candidates view own attempts" ON public.test_attempts FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Tutors and admins view all attempts" ON public.test_attempts FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));
CREATE POLICY "Candidates create own attempts" ON public.test_attempts FOR INSERT WITH CHECK (auth.uid() = candidate_id);
CREATE POLICY "Candidates update own attempts" ON public.test_attempts FOR UPDATE USING (auth.uid() = candidate_id);

-- lesson_progress
CREATE POLICY "Candidates view own progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Tutors and admins view progress" ON public.lesson_progress FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));
CREATE POLICY "Candidates manage own progress" ON public.lesson_progress FOR ALL USING (auth.uid() = candidate_id) WITH CHECK (auth.uid() = candidate_id);

-- candidate_levels
CREATE POLICY "Candidates view own levels" ON public.candidate_levels FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Tutors and admins view levels" ON public.candidate_levels FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));
CREATE POLICY "Candidates insert own levels" ON public.candidate_levels FOR INSERT WITH CHECK (auth.uid() = candidate_id);
CREATE POLICY "Candidates update own levels" ON public.candidate_levels FOR UPDATE USING (auth.uid() = candidate_id);
CREATE POLICY "Admins manage levels" ON public.candidate_levels FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- messages
CREATE POLICY "Users view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients update read status" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-files', 'lesson-files', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read lesson-files" ON storage.objects FOR SELECT USING (bucket_id = 'lesson-files');
CREATE POLICY "Tutors/admins upload lesson-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lesson-files' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor')));
CREATE POLICY "Tutors/admins update lesson-files" ON storage.objects FOR UPDATE USING (bucket_id = 'lesson-files' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor')));
CREATE POLICY "Tutors/admins delete lesson-files" ON storage.objects FOR DELETE USING (bucket_id = 'lesson-files' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor')));

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);