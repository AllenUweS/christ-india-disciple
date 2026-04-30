CREATE POLICY "Tutors view candidate roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'tutor'::app_role));