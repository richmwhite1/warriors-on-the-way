-- Venmo handle on user profiles
ALTER TABLE users ADD COLUMN IF NOT EXISTS venmo_handle text;

-- Event module flags (creator activates tasks/expenses per-event)
ALTER TABLE events ADD COLUMN IF NOT EXISTS tasks_enabled boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS expenses_enabled boolean DEFAULT false;

-- Event tasks
CREATE TABLE IF NOT EXISTS event_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Event expenses
CREATE TABLE IF NOT EXISTS event_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  paid_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Expense splits — who owes what to whom
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES event_expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  confirmed boolean DEFAULT false,
  confirmed_at timestamptz,
  UNIQUE (expense_id, user_id)
);

-- RLS
ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- event_tasks: community members can read; community members can insert/update/delete their own
CREATE POLICY "event_tasks_select" ON event_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_tasks.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "event_tasks_insert" ON event_tasks
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM events e
      JOIN community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_tasks.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "event_tasks_update" ON event_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_tasks.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "event_tasks_delete" ON event_tasks
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM events e
      JOIN community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_tasks.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('admin', 'organizer')
    )
  );

-- event_expenses: same pattern
CREATE POLICY "event_expenses_select" ON event_expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_expenses.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "event_expenses_insert" ON event_expenses
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM events e
      JOIN community_members cm ON cm.community_id = e.community_id
      WHERE e.id = event_expenses.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "event_expenses_update" ON event_expenses
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "event_expenses_delete" ON event_expenses
  FOR DELETE USING (auth.uid() = created_by);

-- expense_splits: members can read; only the ower can mark paid; payer can confirm
CREATE POLICY "expense_splits_select" ON expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_expenses ee
      JOIN events e ON e.id = ee.event_id
      JOIN community_members cm ON cm.community_id = e.community_id
      WHERE ee.id = expense_splits.expense_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "expense_splits_update" ON expense_splits
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM event_expenses ee WHERE ee.id = expense_splits.expense_id AND ee.paid_by = auth.uid()
    )
  );

CREATE POLICY "expense_splits_insert" ON expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_expenses ee WHERE ee.id = expense_splits.expense_id AND ee.created_by = auth.uid()
    )
  );
