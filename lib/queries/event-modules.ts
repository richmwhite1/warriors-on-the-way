import { createClient } from "@/lib/supabase/server";

export type TaskClaim = {
  id: string;
  user_id: string;
  user: { display_name: string };
};

export type EventTask = {
  id: string;
  event_id: string;
  created_by: string;
  title: string;
  assigned_to: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  assignee: { display_name: string } | null;
  creator: { display_name: string };
  claims: TaskClaim[];
};

export type EventExpense = {
  id: string;
  event_id: string;
  created_by: string;
  description: string;
  amount: number;
  paid_by: string;
  created_at: string;
  payer: { display_name: string; venmo_handle: string | null };
  splits: ExpenseSplit[];
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  confirmed: boolean;
  confirmed_at: string | null;
  member: { display_name: string; venmo_handle: string | null };
};

export async function getEventTasks(eventId: string): Promise<EventTask[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_tasks")
    .select(`
      id, event_id, created_by, title, assigned_to, completed, completed_at, created_at,
      assignee:users!event_tasks_assigned_to_fkey(display_name),
      creator:users!event_tasks_created_by_fkey(display_name),
      claims:event_task_claims(id, user_id, user:users(display_name))
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as EventTask[];
}

export async function getEventExpenses(eventId: string): Promise<EventExpense[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_expenses")
    .select(`
      id, event_id, created_by, description, amount, paid_by, created_at,
      payer:users!event_expenses_paid_by_fkey(display_name, venmo_handle),
      splits:expense_splits(
        id, expense_id, user_id, amount, paid, paid_at, confirmed, confirmed_at,
        member:users(display_name, venmo_handle)
      )
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as EventExpense[];
}
