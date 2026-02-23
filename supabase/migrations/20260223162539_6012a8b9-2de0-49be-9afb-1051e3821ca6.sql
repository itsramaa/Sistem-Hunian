-- SR-903: Make audit_logs immutable - prevent DELETE and UPDATE by authenticated users
-- Only service_role (used by edge functions) can INSERT

CREATE POLICY "audit_logs_no_delete" ON public.audit_logs
  FOR DELETE TO authenticated USING (false);

CREATE POLICY "audit_logs_no_update" ON public.audit_logs
  FOR UPDATE TO authenticated USING (false);
