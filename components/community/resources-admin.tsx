"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createResource, updateResource, deleteResource } from "@/lib/actions/resources";
import { CATEGORY_LABELS, CATEGORY_ORDER, type Resource, type ResourceCategory } from "@/lib/types/resources";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  communityId: string;
  communitySlug: string;
  initialResources: Resource[];
};

type FormState = {
  category: ResourceCategory;
  title: string;
  description: string;
  url: string;
  author: string;
  sort_order: string;
};

const DEFAULT_FORM: FormState = {
  category: "book",
  title: "",
  description: "",
  url: "",
  author: "",
  sort_order: "0",
};

function resourceToForm(r: Resource): FormState {
  return {
    category: r.category,
    title: r.title,
    description: r.description ?? "",
    url: r.url ?? "",
    author: r.author ?? "",
    sort_order: String(r.sort_order),
  };
}

function ResourceForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: FormState;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial ?? DEFAULT_FORM);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    onSave(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Category */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label htmlFor="res-category">Type</Label>
          <select
            id="res-category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        {/* Sort order */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label htmlFor="res-sort">Order</Label>
          <Input
            id="res-sort"
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => set("sort_order", e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="res-title">Title *</Label>
        <Input
          id="res-title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Book title, article name, website…"
          required
          maxLength={200}
        />
      </div>

      {/* Author (books + articles) */}
      {(form.category === "book" || form.category === "article") && (
        <div className="space-y-1.5">
          <Label htmlFor="res-author">Author</Label>
          <Input
            id="res-author"
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="Author name"
            maxLength={200}
          />
        </div>
      )}

      {/* URL */}
      <div className="space-y-1.5">
        <Label htmlFor="res-url">URL</Label>
        <Input
          id="res-url"
          type="url"
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://…"
          maxLength={1000}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="res-desc">Description</Label>
        <textarea
          id="res-desc"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Why this is worth checking out…"
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !form.title.trim()}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ResourceRow({
  resource,
  onEdit,
  onDelete,
  isPending,
}: {
  resource: Resource;
  onEdit: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 flex items-start justify-between gap-3">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
            "bg-muted text-muted-foreground"
          )}>
            {CATEGORY_LABELS[resource.category]}
          </span>
          <p className="text-sm font-medium truncate">{resource.title}</p>
        </div>
        {resource.author && (
          <p className="text-xs text-muted-foreground">by {resource.author}</p>
        )}
        {resource.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{resource.description}</p>
        )}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function ResourcesAdmin({ communityId, communitySlug, initialResources }: Props) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      try {
        await createResource(communityId, communitySlug, formData);
        // Optimistic: add a placeholder; the page revalidation will give the real row
        setResources((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            community_id: communityId,
            category: formData.get("category") as ResourceCategory,
            title: formData.get("title") as string,
            description: (formData.get("description") as string) || null,
            url: (formData.get("url") as string) || null,
            author: (formData.get("author") as string) || null,
            sort_order: parseInt(formData.get("sort_order") as string) || 0,
            created_at: new Date().toISOString(),
          },
        ]);
        setShowAdd(false);
        toast.success("Resource added");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add");
      }
    });
  }

  function handleUpdate(resourceId: string, formData: FormData) {
    startTransition(async () => {
      try {
        await updateResource(resourceId, communityId, communitySlug, formData);
        setResources((prev) =>
          prev.map((r) =>
            r.id === resourceId
              ? {
                  ...r,
                  category: formData.get("category") as ResourceCategory,
                  title: formData.get("title") as string,
                  description: (formData.get("description") as string) || null,
                  url: (formData.get("url") as string) || null,
                  author: (formData.get("author") as string) || null,
                  sort_order: parseInt(formData.get("sort_order") as string) || 0,
                }
              : r
          )
        );
        setEditing(null);
        toast.success("Resource updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  function handleDelete(resourceId: string) {
    if (!confirm("Remove this resource?")) return;
    startTransition(async () => {
      try {
        await deleteResource(resourceId, communityId, communitySlug);
        setResources((prev) => prev.filter((r) => r.id !== resourceId));
        toast.success("Resource removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Resources</h2>
        {!showAdd && (
          <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            + Add resource
          </Button>
        )}
      </div>

      {showAdd && (
        <ResourceForm
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          isPending={isPending}
        />
      )}

      {resources.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground">No resources yet. Add books, links, and more.</p>
      )}

      <div className="space-y-2">
        {resources.map((r) =>
          editing === r.id ? (
            <ResourceForm
              key={r.id}
              initial={resourceToForm(r)}
              onSave={(fd) => handleUpdate(r.id, fd)}
              onCancel={() => setEditing(null)}
              isPending={isPending}
            />
          ) : (
            <ResourceRow
              key={r.id}
              resource={r}
              onEdit={() => setEditing(r.id)}
              onDelete={() => handleDelete(r.id)}
              isPending={isPending}
            />
          )
        )}
      </div>
    </div>
  );
}
