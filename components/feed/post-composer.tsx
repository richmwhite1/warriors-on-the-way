"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createPost } from "@/lib/actions/posts";
import { getEmbedMeta } from "@/lib/embed";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PostType } from "@/lib/queries/posts";

type Props = {
  communityId: string;
  communitySlug: string;
  isParentAdmin: boolean;
};

const TYPE_LABELS: Record<PostType, string> = {
  discussion: "Discussion",
  event: "Event",
  video: "Video",
  music: "Music",
  reflection: "Daily Reflection",
  wisdom: "Wisdom Share",
  prayer: "Prayer & Support",
};

export function PostComposer({ communityId, communitySlug, isParentAdmin }: Props) {
  const router = useRouter();
  const [postType, setPostType] = useState<PostType>("discussion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [embedPreview, setEmbedPreview] = useState<{ type: "video" | "music"; embedUrl: string } | null>(null);
  const [pushToAll, setPushToAll] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMedia = postType === "video" || postType === "music";

  function handleTypeChange(t: PostType) {
    setPostType(t);
    setUrlInput("");
    setEmbedUrl("");
    setEmbedPreview(null);
  }

  function handleUrlChange(val: string) {
    setUrlInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setEmbedUrl("");
      setEmbedPreview(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const meta = getEmbedMeta(val.trim());
      if (!meta) {
        setEmbedUrl("");
        setEmbedPreview(null);
        return;
      }
      // Auto-switch type to match detected URL
      if (meta.type !== postType) setPostType(meta.type);
      setEmbedUrl(meta.embedUrl);
      setEmbedPreview({ type: meta.type, embedUrl: meta.embedUrl });
    }, 500);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set("community_id", communityId);
    formData.set("post_type", postType);
    formData.set("title", title);
    formData.set("body", body);
    formData.set("embed_url", embedUrl);
    formData.set("push_to_all", pushToAll ? "true" : "false");

    startTransition(async () => {
      try {
        await createPost(formData);
        setTitle("");
        setBody("");
        setUrlInput("");
        setEmbedUrl("");
        setEmbedPreview(null);
        setPushToAll(false);
        setPostType("discussion");
        toast.success("Posted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to post");
      }
    });
  }

  const canSubmit = isMedia ? !!embedUrl : !!(body.trim() || title.trim());

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-4 space-y-3">
      {/* Type selector */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(TYPE_LABELS) as PostType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => t === "event"
              ? router.push(`/community/${communitySlug}/events/new`)
              : handleTypeChange(t)
            }
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
              postType === t && t !== "event"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Optional title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isMedia ? "Title (optional)" : "Title (optional)"}
        maxLength={200}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Body (discussion + event) */}
      {!isMedia && (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            postType === "event"
              ? "Describe the event — include date, time, and location…"
              : postType === "reflection"
              ? "What arose in your practice today…"
              : postType === "wisdom"
              ? "A truth worth sharing with the community…"
              : postType === "prayer"
              ? "Share your prayer, intention, or need for support…"
              : "Share something with the community…"
          }
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      )}

      {/* URL input (video + music) */}
      {isMedia && (
        <div className="space-y-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={
              postType === "video"
                ? "Paste a YouTube link…"
                : "Paste a Spotify link…"
            }
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          {embedPreview && (
            <div className="rounded-xl overflow-hidden border bg-background">
              {embedPreview.type === "music" ? (
                <iframe
                  src={embedPreview.embedUrl}
                  height="152"
                  width="100%"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="block"
                />
              ) : (
                <div className="relative w-full aspect-video">
                  <iframe
                    src={embedPreview.embedUrl}
                    title="Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Broadcast toggle (parent admins only) */}
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

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending || !canSubmit}>
          {isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
