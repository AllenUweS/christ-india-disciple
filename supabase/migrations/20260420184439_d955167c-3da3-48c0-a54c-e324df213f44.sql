CREATE POLICY "Candidates view tutor and admin roles"
ON public.user_roles
FOR SELECT
USING (role IN ('tutor'::app_role, 'admin'::app_role));