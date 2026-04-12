"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEventExpense,
  deleteEventExpense,
  markSplitPaid,
  confirmSplitReceived,
} from "@/lib/actions/event-modules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EventExpense } from "@/lib/queries/event-modules";

type Member = { id: string; display_name: string; venmo_handle: string | null };

type Props = {
  eventId: string;
  communitySlug: string;
  expenses: EventExpense[];
  members: Member[];
  currentUserId: string;
};

export function EventExpensesPanel({ eventId, communitySlug, expenses, members, currentUserId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const totalOwed = expenses.reduce((sum, exp) => {
    const mySplit = exp.splits.find((s) => s.user_id === currentUserId);
    if (mySplit && !mySplit.confirmed) return sum + mySplit.amount;
    return sum;
  }, 0);

  const totalPaid = expenses.reduce((sum, exp) => {
    if (exp.paid_by === currentUserId) {
      const unconfirmed = exp.splits.filter((s) => !s.confirmed).reduce((a, s) => a + s.amount, 0);
      return sum + unconfirmed;
    }
    return sum;
  }, 0);

  function toggleMember(id: string) {
    setSplitWith((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) return;
    startTransition(async () => {
      try {
        await createEventExpense(eventId, description, amt, [currentUserId, ...splitWith], communitySlug);
        setDescription("");
        setAmount("");
        setSplitWith([]);
        setShowForm(false);
        toast.success("Expense added");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add expense");
      }
    });
  }

  function handleMarkPaid(splitId: string) {
    startTransition(async () => {
      try {
        await markSplitPaid(splitId, communitySlug, eventId);
        toast.success("Marked as paid — waiting for confirmation");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to mark paid");
      }
    });
  }

  function handleConfirm(splitId: string) {
    startTransition(async () => {
      try {
        await confirmSplitReceived(splitId, communitySlug, eventId);
        toast.success("Payment confirmed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to confirm");
      }
    });
  }

  function handleDelete(expenseId: string) {
    startTransition(async () => {
      try {
        await deleteEventExpense(expenseId, communitySlug, eventId);
        toast.success("Expense removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {(totalOwed > 0 || totalPaid > 0) && (
        <div className="flex gap-4 text-sm">
          {totalOwed > 0 && (
            <span className="text-destructive font-medium">You owe ${totalOwed.toFixed(2)}</span>
          )}
          {totalPaid > 0 && (
            <span className="text-muted-foreground">Awaiting ${totalPaid.toFixed(2)} from others</span>
          )}
        </div>
      )}

      {expenses.length === 0 && (
        <p className="text-sm text-muted-foreground">No expenses yet.</p>
      )}

      {/* Expense list */}
      <div className="space-y-3">
        {expenses.map((exp) => (
          <ExpenseRow
            key={exp.id}
            expense={exp}
            currentUserId={currentUserId}
            members={members}
            onMarkPaid={handleMarkPaid}
            onConfirm={handleConfirm}
            onDelete={() => handleDelete(exp.id)}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Add expense</p>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Venue deposit" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label>Amount ($)</Label>
            <Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label>Split with</Label>
            <div className="flex flex-wrap gap-2">
              {members.filter((m) => m.id !== currentUserId).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border transition-colors",
                    splitWith.includes(m.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-foreground"
                  )}
                >
                  {m.display_name}
                </button>
              ))}
            </div>
            {splitWith.length > 0 && amount && (
              <p className="text-xs text-muted-foreground">
                ${(parseFloat(amount) / (splitWith.length + 1)).toFixed(2)} each ({splitWith.length + 1} people)
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending || !description.trim() || !amount}>Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="text-sm text-primary hover:underline">
          + Add expense
        </button>
      )}
    </div>
  );
}

function ExpenseRow({
  expense, currentUserId, members, onMarkPaid, onConfirm, onDelete, isPending,
}: {
  expense: EventExpense;
  currentUserId: string;
  members: Member[];
  onMarkPaid: (splitId: string) => void;
  onConfirm: (splitId: string) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const mySplit = expense.splits.find((s) => s.user_id === currentUserId);
  const isPayer = expense.paid_by === currentUserId;
  const canDelete = expense.created_by === currentUserId;
  const payerVenmo = expense.payer.venmo_handle;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{expense.description}</p>
          <p className="text-xs text-muted-foreground">
            ${expense.amount.toFixed(2)} · paid by {isPayer ? "you" : expense.payer.display_name}
            {!isPayer && payerVenmo && (
              <a
                href={`https://venmo.com/${payerVenmo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                @{payerVenmo}
              </a>
            )}
          </p>
        </div>
        {canDelete && (
          <button onClick={onDelete} disabled={isPending} className="text-xs text-muted-foreground hover:text-destructive shrink-0">
            Remove
          </button>
        )}
      </div>

      {/* My split */}
      {mySplit && !isPayer && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <div>
            <p className="text-xs font-medium">You owe ${mySplit.amount.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">
              {mySplit.confirmed ? "✓ Confirmed received" : mySplit.paid ? "Sent — awaiting confirmation" : "Not yet paid"}
            </p>
          </div>
          {!mySplit.paid && !mySplit.confirmed && (
            <div className="flex gap-2 items-center">
              {payerVenmo && (
                <a
                  href={`https://venmo.com/${payerVenmo}?txn=pay&amount=${mySplit.amount}&note=${encodeURIComponent(expense.description)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-[#3d95ce] text-white px-3 py-1.5 rounded-full font-medium hover:bg-[#2e7aaa] transition-colors"
                >
                  Pay on Venmo
                </a>
              )}
              <button
                onClick={() => onMarkPaid(mySplit.id)}
                disabled={isPending}
                className="text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-full hover:border-foreground transition-colors"
              >
                Mark sent
              </button>
            </div>
          )}
        </div>
      )}

      {/* Splits I'm owed (payer view) */}
      {isPayer && expense.splits.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Splits</p>
          {expense.splits.map((split) => {
            const memberVenmo = members.find((m) => m.id === split.user_id)?.venmo_handle;
            return (
              <div key={split.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  {split.member.display_name}
                  {memberVenmo && (
                    <a href={`https://venmo.com/${memberVenmo}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">
                      @{memberVenmo}
                    </a>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span>${split.amount.toFixed(2)}</span>
                  {split.confirmed ? (
                    <span className="text-green-600 font-medium">✓ Received</span>
                  ) : split.paid ? (
                    <button
                      onClick={() => onConfirm(split.id)}
                      disabled={isPending}
                      className="text-primary hover:underline font-medium"
                    >
                      Confirm received
                    </button>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
