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
  sendExpenseReminders,
} from "@/lib/actions/event-modules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EventExpense } from "@/lib/queries/event-modules";

type Member = { id: string; display_name: string; venmo_handle: string | null };
type Attendee = { id: string; display_name: string };

type Props = {
  eventId: string;
  communitySlug: string;
  expenses: EventExpense[];
  members: Member[];
  attendees: Attendee[];
  currentUserId: string;
  eventStartsAt?: string | null;
};

export function EventExpensesPanel({
  eventId, communitySlug, expenses, members, attendees, currentUserId, eventStartsAt,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [isGroupSplit, setIsGroupSplit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isLocked = !!eventStartsAt && new Date(eventStartsAt) < new Date();
  const otherMembers = members.filter((m) => m.id !== currentUserId);
  const groupAttendees = attendees.filter((a) => a.id !== currentUserId);

  // Does the current user pay for anything (i.e., are they a payer on any expense)?
  const myExpenses = expenses.filter((e) => e.paid_by === currentUserId);
  const myUnpaidReminders = isLocked && myExpenses.some((e) =>
    e.splits.some((s) => !s.paid && !s.confirmed)
  );

  function toggleMember(id: string) {
    if (isGroupSplit) return;
    setSplitWith((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleGroupSplitToggle(on: boolean) {
    setIsGroupSplit(on);
    setSplitWith(on ? groupAttendees.map((a) => a.id) : []);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) return;
    startTransition(async () => {
      try {
        await createEventExpense(eventId, description, amt, [currentUserId, ...splitWith], communitySlug, isGroupSplit);
        setDescription(""); setAmount(""); setSplitWith([]); setIsGroupSplit(false); setShowForm(false);
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
        toast.success("Marked as sent");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function handleConfirm(splitId: string) {
    startTransition(async () => {
      try {
        await confirmSplitReceived(splitId, communitySlug, eventId);
        toast.success("Payment confirmed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function handleDelete(expenseId: string) {
    startTransition(async () => {
      try {
        await deleteEventExpense(expenseId, communitySlug, eventId);
        toast.success("Expense removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function handleSendReminders() {
    startTransition(async () => {
      try {
        const count = await sendExpenseReminders(eventId, communitySlug);
        toast.success(count > 0 ? `Reminders sent to ${count} people` : "No outstanding payments to remind");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send reminders");
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
            onMarkPaid={handleMarkPaid}
            onConfirm={handleConfirm}
            onDelete={isLocked ? undefined : () => handleDelete(exp.id)}
            isPending={isPending}
            isLocked={isLocked}
          />
        ))}
      </div>

      {/* Send reminders — only visible to payers after the event starts */}
      {myUnpaidReminders && (
        <button
          onClick={handleSendReminders}
          disabled={isPending}
          className="text-sm text-primary hover:underline"
        >
          Send payment reminders
        </button>
      )}

      {/* Add form */}
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

            <div className="space-y-2">
              <Label>Split with</Label>

              {/* All confirmed attendees toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isGroupSplit}
                  onChange={(e) => handleGroupSplitToggle(e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                <span className="text-sm font-medium">All confirmed attendees</span>
                {groupAttendees.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    ({groupAttendees.length + 1} people · auto-adjusts as more RSVP yes)
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">(no yes-RSVPs yet)</span>
                )}
              </label>

              {/* Individual picker — hidden when group split is on */}
              {!isGroupSplit && (
                <div className="flex flex-wrap gap-2">
                  {otherMembers.map((m) => (
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
              )}

              {splitWith.length > 0 && amount && (
                <p className="text-xs text-muted-foreground">
                  ${(parseFloat(amount) / (splitWith.length + 1)).toFixed(2)} each ({splitWith.length + 1} people)
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending || !description.trim() || !amount}>Add</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setIsGroupSplit(false); setSplitWith([]); }}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowForm(true)} className="text-sm text-primary hover:underline">
            + Add expense
          </button>
        )
      )}

      {isLocked && expenses.length > 0 && (
        <p className="text-xs text-muted-foreground">Expenses locked — event has started.</p>
      )}
    </div>
  );
}

function ExpenseLedger({
  expense, currentUserId, onMarkPaid, onConfirm, onDelete, isPending, isLocked,
}: {
  expense: EventExpense;
  currentUserId: string;
  onMarkPaid: (splitId: string) => void;
  onConfirm: (splitId: string) => void;
  onDelete?: () => void;
  isPending: boolean;
  isLocked: boolean;
}) {
  const isPayer = expense.paid_by === currentUserId;
  const isCreator = expense.created_by === currentUserId;
  const payerVenmo = expense.payer.venmo_handle;

  // Payer's own share = total minus what others owe
  const othersTotal = expense.splits.reduce((acc, s) => acc + s.amount, 0);
  const payerShare = expense.splits.length > 0
    ? Math.round((expense.amount - othersTotal) * 100) / 100
    : expense.amount;

  // Summary for payer after event starts
  const totalOutstanding = expense.splits
    .filter((s) => !s.confirmed)
    .reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/20 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{expense.description}</p>
            <p className="text-xs text-muted-foreground">
              ${expense.amount.toFixed(2)} total · paid by{" "}
              {isPayer ? "you" : (
                <>
                  {expense.payer.display_name}
                  {payerVenmo && (
                    <a href={`https://venmo.com/${payerVenmo}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">
                      @{payerVenmo}
                    </a>
                  )}
                </>
              )}
              {expense.is_group_split && (
                <span className="ml-1.5 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  Group split
                </span>
              )}
            </p>
          </div>
          {isCreator && onDelete && (
            <button onClick={onDelete} disabled={isPending} className="text-xs text-muted-foreground hover:text-destructive shrink-0">
              Remove
            </button>
          )}
        </div>

        {/* Post-event summary for payer */}
        {isPayer && isLocked && expense.splits.length > 0 && (
          <p className={cn("text-xs font-medium", totalOutstanding > 0 ? "text-amber-600" : "text-green-600")}>
            {totalOutstanding > 0
              ? `${expense.splits.filter((s) => !s.confirmed).length} people still owe a total of $${totalOutstanding.toFixed(2)}`
              : "All settled ✓"}
          </p>
        )}

        {/* Pre-event note for payer */}
        {isPayer && !isLocked && expense.splits.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Splits will be finalized when the event starts.
          </p>
        )}
      </div>

      {/* Ledger rows */}
      <div className="divide-y">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          <span>Person</span>
          <span className="text-right">Share</span>
          <span className="text-right w-32">Status</span>
        </div>

        {/* Payer's own row */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2.5 items-center text-sm bg-muted/10">
          <span className={cn("truncate font-medium", isPayer && "text-primary")}>
            {isPayer ? "You" : expense.payer.display_name}
          </span>
          <span className="text-right tabular-nums text-muted-foreground">${payerShare.toFixed(2)}</span>
          <span className="w-32 text-right text-xs text-green-600 font-medium">Covered</span>
        </div>

        {/* Split rows */}
        {expense.splits.map((split) => {
          const isMe = split.user_id === currentUserId;

          return (
            <div key={split.id} className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2.5 items-center text-sm">
              {/* Name */}
              <div className="min-w-0">
                <span className={cn("truncate", isMe && "font-medium")}>
                  {isMe ? "You" : split.member.display_name}
                </span>
                {split.member.venmo_handle && (
                  <a
                    href={`https://venmo.com/${split.member.venmo_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1.5 text-xs text-primary hover:underline"
                  >
                    @{split.member.venmo_handle}
                  </a>
                )}
              </div>

              {/* Share */}
              <span className="text-right tabular-nums">${split.amount.toFixed(2)}</span>

              {/* Status cell */}
              <div className="w-32 text-right">
                {split.confirmed ? (
                  <span className="text-xs text-green-600 font-medium">Settled ✓</span>

                ) : split.paid ? (
                  // Self-reported as sent
                  isPayer ? (
                    <button
                      onClick={() => onConfirm(split.id)}
                      disabled={isPending}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Confirm received
                    </button>
                  ) : (
                    <span className="text-xs text-blue-600 font-medium">Sent</span>
                  )

                ) : isMe && !isPayer ? (
                  // My row, I haven't paid yet
                  isLocked ? (
                    // Event started — now we show payment actions
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
                    // Pre-event — neutral, no debt framing
                    <span className="text-xs text-muted-foreground">Planned</span>
                  )

                ) : (
                  // Someone else's row (not me, not confirmed)
                  isLocked ? (
                    isPayer ? (
                      <span className="text-xs text-amber-600 font-medium">Owes you</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">Planned</span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
