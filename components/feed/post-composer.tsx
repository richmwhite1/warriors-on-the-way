"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createPost } from "@/lib/actions/posts";
import { toast } from "sonner";

type Props = {
  communityId: string;
  isParentAdmin: boolean;
};

export function PostComposer({ communityId, isParentAdmin }: Props) {
  const [body, setBody] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pushToAll, setPushToAll] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    const formData = new FormData();
    formData.set("community_id", communityId);
    formData.set("body", body);
    formData.set("youtube_url", youtubeUrl);
    formData.set("push_to_all", pushToAll ? "true" : "false");

    startTransition(async () => {
      try {
        await createPost(formData);
        setBody("");
        setYoutubeUrl("");
        setPushToAll(false);
        setShowYoutube(false);
        toast.success("Post shared");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to post");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-4 space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share something with the community…"
        rows={3}
        maxLength={2000}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      />

      {showYoutube && (
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}

      {isParentAdmin && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={pushToAll}
            onChange={(e) => setPushToAll(e.target.checked)}
            className="rounded"
          />
          <span>
            Push to all community walls{" "}
            <span className="text-muted-foreground text-xs">— clearly labeled</span>
          </span>
        </label>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowYoutube(!showYoutube)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <svg viewBox="0 0 24 24" className="size-3.5 fill-current">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          {showYoutube ? "Remove video" : "Add YouTube video"}
        </button>

        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          {isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
