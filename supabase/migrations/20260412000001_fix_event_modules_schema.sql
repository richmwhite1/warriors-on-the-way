-- Fix: align remote DB schema with application code expectations
-- The remote DB was set up with a different schema; this migration reconciles it.

-- ── 1. events: add missing module flags ──────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS tasks_enabled   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expenses_enabled boolean NOT NULL DEFAULT false;

-- ── 2. event_tasks: add missing columns ──────────────────────────────────────
ALTER TABLE public.event_tasks
  ADD COLUMN IF NOT EXISTS assigned_to   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at  timestamptz;

-- ── 3. event_expenses: add missing created_by column ─────────────────────────
ALTER TABLE public.event_expenses
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- ── 4. expense_splits: rename event_expense_splits and reconcile schema ───────
-- Rename the table to match application code
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_expense_splits'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'expense_splits'
  ) THEN
    ALTER TABLE public.event_expense_splits RENAME TO expense_splits;
  END IF;
END $$;

-- Create expense_splits if neither table existed
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id   uuid NOT NULL REFERENCES public.event_expenses(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount       numeric(10,2) NOT NULL,
  paid         boolean NOT NULL DEFAULT false,
  paid_at      timestamptz,
  confirmed    boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  UNIQUE (expense_id, user_id)
);

-- Rename amount_owed → amount if it exists (from old event_expense_splits schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expense_splits' AND column_name = 'amount_owed'
  ) THEN
    ALTER TABLE public.expense_splits RENAME COLUMN amount_owed TO amount;
  END IF;
END $$;

-- Add missing columns to expense_splits
ALTER TABLE public.expense_splits
  ADD COLUMN IF NOT EXISTS paid         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- ── 5. notification_type enum: add missing values ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.notification_type'::regtype
      AND enumlabel = 'rsvp_created'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'rsvp_created';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.notification_type'::regtype
      AND enumlabel = 'expense_paid'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'expense_paid';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.notification_type'::regtype
      AND enumlabel = 'expense_confirmed'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'expense_confirmed';
  END IF;
END $$;

-- ── 6. RLS for expense_splits ─────────────────────────────────────────────────
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expense_splits_select" ON public.expense_splits;
CREATE POLICY "expense_splits_select" ON public.expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_expenses ee
      JOIN public.events e ON e.id = ee.event_id
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE ee.id = expense_splits.expense_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "expense_splits_insert" ON public.expense_splits;
CREATE POLICY "expense_splits_insert" ON public.expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_expenses ee
      WHERE ee.id = expense_splits.expense_id
        AND ee.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "expense_splits_update" ON public.expense_splits;
CREATE POLICY "expense_splits_update" ON public.expense_splits
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.event_expenses ee
      WHERE ee.id = expense_splits.expense_id AND ee.paid_by = auth.uid()
    )
  );
