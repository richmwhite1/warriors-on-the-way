"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCommunity } from "@/lib/actions/communities";
import { NeedsPicker } from "@/components/needs/needs-picker";
import type { Need } from "@/lib/queries/needs";
import { toast } from "sonner";

type TopicOpt = { id: string; name: string; slug: string };

export function CreateCommunityForm({
  topics = [],
  preselectTopicId,
  needs = [],
  preselectNeedIds = [],
}: {
  topics?: TopicOpt[];
  preselectTopicId?: string;
  needs?: Need[];
  preselectNeedIds?: string[];
}) {
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
          placeholder="e.g. Salt Lake Christ Consciousness"
        />
        <p className="text-xs text-muted-foreground">Place plus theme reads best — a name people recognize.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="purpose">Purpose <span className="text-muted-foreground font-normal text-xs">(one sentence, required)</span></Label>
        <Input
          id="purpose"
          name="purpose"
          required
          maxLength={140}
          placeholder="What this community is for, in a sentence."
        />
      </div>

      {/* Doorways first: this is how people actually find a circle. The missions below
          are the meaning underneath, which matters less at the moment of searching. */}
      {needs.length > 0 && (
        <NeedsPicker
          needs={needs}
          defaultSelected={preselectNeedIds}
          legend="Who is this circle for?"
          hint="Pick the doorways this circle answers \u2014 it\u2019s how someone searching by what they need will find you."
          emptyHint="Untagged, this circle won\u2019t appear on the menu \u2014 people can still reach it by invite link."
        />
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Topics this community serves <span className="text-muted-foreground font-normal text-xs">(pick at least one)</span></legend>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <label key={t.id} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 cursor-pointer text-sm">
              <input
                type="checkbox"
                name="topic_ids"
                value={t.id}
                defaultChecked={t.id === preselectTopicId}
                className="rounded"
              />
              {t.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={400}
          placeholder="More about this community…"
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

      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          maxLength={100}
          placeholder="e.g. San Francisco, CA"
        />
        <p className="text-xs text-muted-foreground">Helps people find your community nearby</p>
      </div>

      {/* Free-text location can't answer "can I actually get there" — an online circle
          read exactly like one meeting across the valley. This is what the doorway
          filters narrow on. */}
      <div className="space-y-1.5">
        <Label htmlFor="format">How does it meet?</Label>
        <select id="format" name="format" defaultValue="in_person" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="in_person">In person</option>
          <option value="online">Online</option>
          <option value="hybrid">Both — in person and online</option>
        </select>
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

      <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 border p-3">
        Your community stays invite-only until it reaches <strong>five members</strong> — share your
        invite link to recruit the first four. It becomes browsable at five. If it hasn&apos;t reached
        five within thirty days, the name is released.{" "}
        <a href="/why-150" className="underline hover:text-foreground">Why 150?</a>
      </p>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating…" : "Create community"}
      </Button>
    </form>
  );
}
