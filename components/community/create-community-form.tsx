"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCommunity } from "@/lib/actions/communities";
import { toast } from "sonner";

export function CreateCommunityForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createCommunity(formData);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create community");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Community name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder="e.g. Bay Area Seekers"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={400}
          placeholder="What is this community about?"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">
          URL slug{" "}
          <span className="text-muted-foreground font-normal text-xs">
            (optional — auto-generated from name)
          </span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">/community/</span>
          <Input
            id="slug"
            name="slug"
            maxLength={60}
            placeholder="bay-area-seekers"
            pattern="[a-z0-9][-a-z0-9]*"
            title="Lowercase letters, numbers, and hyphens only"
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Settings</legend>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_private" value="true" className="rounded" />
          <span className="text-sm">
            Private community{" "}
            <span className="text-muted-foreground">— members must request to join</span>
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="members_can_create_events"
            value="true"
            defaultChecked
            className="rounded"
          />
          <span className="text-sm">
            Members can create events{" "}
            <span className="text-muted-foreground">— not just admins</span>
          </span>
        </label>
      </fieldset>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating…" : "Create community"}
      </Button>
    </form>
  );
}
