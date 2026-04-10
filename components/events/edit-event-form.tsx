"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { updateEvent } from "@/lib/actions/events";
import { toast } from "sonner";

type Props = {
  eventId: string;
  communitySlug: string;
  initialValues: {
    title: string;
    description: string;
    location: string;
    virtual_url: string;
    starts_at: string;
    ends_at: string;
    image_url: string | null;
  };
};

export function EditEventForm({ eventId, communitySlug, initialValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(initialValues.image_url);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (imageUrl !== null) fd.set("image_url", imageUrl);
    startTransition(async () => {
      try {
        await updateEvent(eventId, fd);
        toast.success("Event updated");
        router.push(`/community/${communitySlug}/events/${eventId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update event");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Event title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={initialValues.title}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={initialValues.description}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Event image</Label>
        <ImageUpload
          value={imageUrl}
          onChange={(url: string) => setImageUrl(url || null)}
          label="Upload event photo"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={initialValues.location}
            placeholder="Muir Woods Visitor Center"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="virtual_url">Virtual link</Label>
          <Input
            id="virtual_url"
            name="virtual_url"
            type="url"
            defaultValue={initialValues.virtual_url}
            placeholder="https://meet.google.com/..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="starts_at">Start</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={initialValues.starts_at}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ends_at">End</Label>
          <Input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={initialValues.ends_at}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/community/${communitySlug}/events/${eventId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
