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
  eventStartsAt?: string | null;
};

export function EventExpensesPanel({ eventId, communitySlug, expenses, members, currentUserId, eventStartsAt }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Locked once the event has started
  const isLocked = !!eventStartsAt && new Date(eventStartsAt) < new Date();

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
        toast.success("Marked as payment sent");
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
      {expenses.length === 0 && (
        <p className="text-sm text-muted-foreground">No expenses yet.</p>
      )}

      <div className="space-y-4">
        {expenses.map((exp) => (
          <ExpenseLedger
            key={exp.id}
            expense={exp}
            currentUserId={currentUserId}
            members={members}
            onMarkPaid={handleMarkPaid}
            onConfirm={handleConfirm}
            onDelete={isLocked ? undefined : () => handleDelete(exp.id)}
            isPending={isPending}
          />
        ))}
      </div>

      {!isLocked && (
        showForm ? (
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
        )
      )}

      {isLocked && (
        <p className="text-xs text-muted-foreground">Expenses are locked after the event starts.</p>
      )}
    </div>
  );
}

function statusLabel(paid: boolean, confirmed: boolean) {
  if (confirmed) return { text: "Confirmed", className: "text-green-600 font-medium" };
  if (paid) return { text: "Payment sent", className: "text-amber-600 font-medium" };
  return { text: "Waiting", className: "text-muted-foreground" };
}

function ExpenseLedger({
  expense, currentUserId, members, onMarkPaid, onConfirm, onDelete, isPending,
}: {
  expense: EventExpense;
  currentUserId: string;
  members: Member[];
  onMarkPaid: (splitId: string) => void;
  onConfirm: (splitId: string) => void;
  onDelete?: () => void;
  isPending: boolean;
}) {
  const isPayer = expense.paid_by === currentUserId;
  const isCreator = expense.created_by === currentUserId;
  const payerVenmo = expense.payer.venmo_handle;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-2 border-b bg-muted/20">
        <div>
          <p className="text-sm font-medium">{expense.description}</p>
          <p className="text-xs text-muted-foreground">
            ${expense.amount.toFixed(2)} total · paid by{" "}
            {isPayer ? "you" : (
              <>
                {expense.payer.display_name}
                {payerVenmo && (
                  <a
                    href={`https://venmo.com/${payerVenmo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-primary hover:underline"
                  >
                    @{payerVenmo}
                  </a>
                )}
              </>
            )}
          </p>
        </div>
        {isCreator && onDelete && (
          <button onClick={onDelete} disabled={isPending} className="text-xs text-muted-foreground hover:text-destructive shrink-0">
            Remove
          </button>
        )}
      </div>

      {/* Ledger table */}
      {expense.splits.length > 0 && (
        <div className="divide-y">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            <span>Attendee</span>
            <span className="text-right">Share</span>
            <span className="text-right w-28">Status</span>
          </div>

          {expense.splits.map((split) => {
            const isMe = split.user_id === currentUserId;
            const memberVenmo = split.member.venmo_handle;
            const { text, className } = statusLabel(split.paid, split.confirmed);

            return (
              <div key={split.id} className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2.5 items-center text-sm">
                {/* Attendee */}
                <div className="min-w-0">
                  <span className={cn("truncate", isMe && "font-medium")}>
                    {isMe ? "You" : split.member.display_name}
                  </span>
                  {memberVenmo && (
                    <a
                      href={`https://venmo.com/${memberVenmo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1.5 text-xs text-primary hover:underline"
                    >
                      @{memberVenmo}
                    </a>
                  )}
                </div>

                {/* Share */}
                <span className="text-right tabular-nums">${split.amount.toFixed(2)}</span>

                {/* Status + actions */}
                <div className="w-28 text-right">
                  {split.confirmed ? (
                    <span className={className}>{text}</span>
                  ) : split.paid ? (
                    isPayer ? (
                      <button
                        onClick={() => onConfirm(split.id)}
                        disabled={isPending}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Confirm received
                      </button>
                    ) : (
                      <span className={className}>{text}</span>
                    )
                  ) : isMe && !isPayer ? (
                    <div className="flex items-center justify-end gap-1.5">
                      {payerVenmo && (
                        <a
                          href={`https://venmo.com/${payerVenmo}?txn=pay&amount=${split.amount}&note=${encodeURIComponent(expense.description)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-[#3d95ce] text-white px-2 py-0.5 rounded-full font-medium hover:bg-[#2e7aaa] transition-colors"
                        >
                          Pay
                        </a>
                      )}
                      <button
                        onClick={() => onMarkPaid(split.id)}
                        disabled={isPending}
                        className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-full hover:border-foreground transition-colors"
                      >
                        Sent
                      </button>
                    </div>
                  ) : (
                    <span className={className}>{text}</span>
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
