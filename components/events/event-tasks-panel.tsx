"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEventTask, toggleEventTask, deleteEventTask } from "@/lib/actions/event-modules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EventTask } from "@/lib/queries/event-modules";

type Member = { id: string; display_name: string };

type Props = {
  eventId: string;
  communitySlug: string;
  tasks: EventTask[];
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
};

export function EventTasksPanel({ eventId, communitySlug, tasks, members, currentUserId, isAdmin }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    startTransition(async () => {
      try {
        await createEventTask(eventId, newTitle, assignTo || null, communitySlug);
        setNewTitle("");
        setAssignTo("");
        setShowForm(false);
        toast.success("Task added");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add task");
      }
    });
  }

  function handleToggle(task: EventTask) {
    startTransition(async () => {
      try {
        await toggleEventTask(task.id, !task.completed, communitySlug, eventId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update task");
      }
    });
  }

  function handleDelete(taskId: string) {
    startTransition(async () => {
      try {
        await deleteEventTask(taskId, communitySlug, eventId);
        toast.success("Task removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete task");
      }
    });
  }

  const done = tasks.filter((t) => t.completed);
  const todo = tasks.filter((t) => !t.completed);

  return (
    <div className="space-y-3">
      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">No tasks yet. Add one below.</p>
      )}

      {/* To-do */}
      {todo.length > 0 && (
        <div className="space-y-2">
          {todo.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onToggle={() => handleToggle(task)}
              onDelete={() => handleDelete(task.id)}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div className="space-y-2 opacity-60">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Done ({done.length})</p>
          {done.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onToggle={() => handleToggle(task)}
              onDelete={() => handleDelete(task.id)}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="space-y-2 pt-1">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task description…"
            maxLength={200}
            autoFocus
          />
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending || !newTitle.trim()}>Add task</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-primary hover:underline"
        >
          + Add task
        </button>
      )}
    </div>
  );
}

function TaskRow({
  task, currentUserId, isAdmin, onToggle, onDelete, isPending,
}: {
  task: EventTask;
  currentUserId: string;
  isAdmin: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const canDelete = task.created_by === currentUserId || isAdmin;

  return (
    <div className="flex items-center gap-3 group">
      <button
        onClick={onToggle}
        disabled={isPending}
        className={cn(
          "size-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
          task.completed
            ? "bg-primary border-primary text-primary-foreground"
            : "border-muted-foreground hover:border-primary"
        )}
      >
        {task.completed && (
          <svg viewBox="0 0 24 24" className="size-3 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span className={cn("text-sm", task.completed && "line-through text-muted-foreground")}>
          {task.title}
        </span>
        {task.assignee && (
          <span className="text-xs text-muted-foreground ml-1.5">
            → {task.assignee.display_name}
          </span>
        )}
      </div>

      {canDelete && (
        <button
          onClick={onDelete}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          ×
        </button>
      )}
    </div>
  );
}
