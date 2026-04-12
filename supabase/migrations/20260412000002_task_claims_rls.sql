-- RLS for event_task_claims + re-apply event_tasks/event_expenses policies
-- (20260411000001 added these but they may not have been applied to remote)

-- ── event_task_claims ─────────────────────────────────────────────────────────
ALTER TABLE public.event_task_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_task_claims_select" ON public.event_task_claims;
CREATE POLICY "event_task_claims_select" ON public.event_task_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_tasks t
      JOIN public.events e ON e.id = t.event_id
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE t.id = event_task_claims.task_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_task_claims_insert" ON public.event_task_claims;
CREATE POLICY "event_task_claims_insert" ON public.event_task_claims
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.event_tasks t
      JOIN public.events e ON e.id = t.event_id
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE t.id = event_task_claims.task_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_task_claims_delete" ON public.event_task_claims;
CREATE POLICY "event_task_claims_delete" ON public.event_task_claims
  FOR DELETE USING (auth.uid() = user_id);

-- ── event_tasks (re-apply in case 20260411000001 didn't apply) ────────────────
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_tasks_select" ON public.event_tasks;
CREATE POLICY "event_tasks_select" ON public.event_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_tasks.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_tasks_insert" ON public.event_tasks;
CREATE POLICY "event_tasks_insert" ON public.event_tasks
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_tasks.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_tasks_update" ON public.event_tasks;
CREATE POLICY "event_tasks_update" ON public.event_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_tasks.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_tasks_delete" ON public.event_tasks;
CREATE POLICY "event_tasks_delete" ON public.event_tasks
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_tasks.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('admin', 'organizer')
    )
  );

-- ── event_expenses (re-apply) ─────────────────────────────────────────────────
ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_expenses_select" ON public.event_expenses;
CREATE POLICY "event_expenses_select" ON public.event_expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_expenses.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_expenses_insert" ON public.event_expenses;
CREATE POLICY "event_expenses_insert" ON public.event_expenses
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_expenses.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_expenses_delete" ON public.event_expenses;
CREATE POLICY "event_expenses_delete" ON public.event_expenses
  FOR DELETE USING (auth.uid() = created_by);
