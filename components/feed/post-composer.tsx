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

function ProviderBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}

function YouTubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#FF0000" />
      <path d="M9.5 8.5l6 3.5-6 3.5V8.5z" fill="white" />
    </svg>
  );
}

function VimeoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#1AB7EA" />
      <path d="M19.5 8.3c-.1 2.1-1.6 5-4.4 8.7C12.3 20.9 10 23 8 23c-1.2 0-2.3-1.1-3.1-3.4L3.4 14c-.5-1.8-1-2.7-1.6-2.7-.1 0-.6.3-1.3.9L0 11.2c.8-.7 1.6-1.4 2.4-2.1 1.1-1 1.9-1.5 2.5-1.5 1.3-.1 2.1.7 2.4 2.5.3 1.9.5 3.1.7 3.6.4 1.8.8 2.7 1.2 2.7.3 0 .9-.5 1.6-1.6.7-1 1.1-1.8 1.1-2.4.1-1-.4-1.4-1.1-1.4-.4 0-.8.1-1.2.2.8-2.5 2.3-3.7 4.5-3.6 1.6.1 2.4 1.1 2.4 2.7z" fill="white" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path d="M17 16.3c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 4-.9 7.5-.5 10.3 1.2.3.2.4.6.2.9zm1.2-2.7c-.3.4-.8.5-1.1.2-2.8-1.8-7.1-2.3-10.4-1.3-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.8-1.1 8.4-.6 11.7 1.5.4.2.5.7.3 1.1zm.1-2.8c-3.4-2-9-2.2-12.2-1.2-.5.2-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 3.7-1.1 9.9-.9 13.7 1.4.4.2.6.8.3 1.2-.2.4-.8.6-1.2.4z" fill="white" />
    </svg>
  );
}

function SoundCloudIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#FF5500" />
      <path d="M4 13.5c0-.7.5-1.3 1.2-1.3.1 0 .2 0 .3.1V11c0-.6.5-1 1-1s1 .4 1 1v.3c.2-.1.5-.2.7-.2.8 0 1.5.7 1.5 1.5v.1c.2-.1.4-.1.6-.1.9 0 1.7.8 1.7 1.7v.7H4.5c-.3 0-.5-.3-.5-.5v-1.7zm9.5 1.5h3.8c.4 0 .7-.3.7-.7V13c0-1.1-.9-2-2-2-.5 0-1 .2-1.3.5V11c0-.6-.5-1-1-1s-1 .4-1 1v4z" fill="white" />
    </svg>
  );
}

function ApplePodcastsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#9333EA" />
      <circle cx="12" cy="9" r="2.5" fill="white" />
      <path d="M12 13c-2.2 0-4 1.4-4 3.2 0 .5.4.8.8.8h6.4c.4 0 .8-.3.8-.8C16 14.4 14.2 13 12 13z" fill="white" />
      <path d="M8.5 9c0-1.9 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5c0 .6-.2 1.2-.5 1.7" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M7 9c0-2.8 2.2-5 5-5s5 2.2 5 5c0 .9-.2 1.7-.6 2.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

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
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
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
        className="w-full rounded-lg border bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      )}

      {/* URL input (video + music) */}
      {isMedia && (
        <div className="space-y-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste a link to embed…"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          {!embedPreview && (
            <div className="flex items-center gap-3 px-1">
              <span className="text-xs text-muted-foreground">Accepts:</span>
              {postType === "video" ? (
                <>
                  <ProviderBadge icon={<YouTubeIcon />} label="YouTube" />
                  <ProviderBadge icon={<VimeoIcon />} label="Vimeo" />
                </>
              ) : (
                <>
                  <ProviderBadge icon={<SpotifyIcon />} label="Spotify" />
                  <ProviderBadge icon={<SoundCloudIcon />} label="SoundCloud" />
                  <ProviderBadge icon={<ApplePodcastsIcon />} label="Apple Podcasts" />
                </>
              )}
            </div>
          )}

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
