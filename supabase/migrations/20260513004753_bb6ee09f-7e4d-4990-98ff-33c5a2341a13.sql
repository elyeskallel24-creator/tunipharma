
-- Lock down admin tables explicitly (deny all public access)
CREATE POLICY "Deny all on admin_pin" ON public.admin_pin
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny all on admin_sessions" ON public.admin_sessions
  FOR ALL USING (false) WITH CHECK (false);

-- Fix function search_path
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.set_order_number() SET search_path = public;

-- Remove broad list policy on storage; public bucket still serves via CDN URLs
DROP POLICY IF EXISTS "Public read public-assets" ON storage.objects;
