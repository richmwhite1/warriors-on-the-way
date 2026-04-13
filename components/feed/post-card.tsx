"use client";

import { useState, useTransition, useOptimistic } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { deletePost, reportPost, pinPost, updatePost, repostPost } from "@/lib/actions/posts";
import { toggleReaction } from "@/lib/actions/reactions";
import { createComment, deleteComment } from "@/lib/actions/comments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/queries/posts";
import type { Comment } from "@/lib/queries/comments";

type ReactionKey = "like" | "heart" | "fire";
const REACTIONS: { key: ReactionKey; emoji: string }[] = [
  { key: "like", emoji: "👍" },
  { key: "heart", emoji: "❤️" },
  { key: "fire", emoji: "🔥" },
];

const TYPE_LABELS: Record<string, string> = {
  discussion: "Discussion",
  event: "Event",
  video: "Video",
  music: "Music",
};

type UserCommunity = { id: string; name: string; slug: string };

type Props = {
  post: Post;
  comments: Comment[];
  communitySlug: string;
  currentUserId: string;
  isAdmin: boolean;
  isMember: boolean;
  isViewer?: boolean;
  isPinned?: boolean;
  userCommunities?: UserCommunity[];
};

export function PostCard({
  post, comments, communitySlug, currentUserId, isAdmin, isMember, isPinned, userCommunities,
}: Props) {
  const [showComments, setShowComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title ?? "");
  const [editBody, setEditBody] = useState(post.body ?? "");
  const [showRepost, setShowRepost] = useState(false);

  const isOwn = post.author_id === currentUserId;
  const canDelete = isOwn || isAdmin;
  const pinned = isPinned ?? post.is_pinned;

  const authorName = (post.author as { display_name?: string })?.display_name ?? "Unknown";
  const authorAvatar = (post.author as { avatar_url?: string | null })?.avatar_url ?? null;

  // Reaction counts + current user's reactions
  const reactionCounts = { like: 0, heart: 0, fire: 0 };
  const myReactions = { like: false, heart: false, fire: false };
  for (const r of post.reactions ?? []) {
    const k = r.type as ReactionKey;
    if (k in reactionCounts) {
      reactionCounts[k]++;
      if (r.user_id === currentUserId) myReactions[k] = true;
    }
  }

  // Optimistic reaction state
  const [optimisticReactions, setOptimisticReactions] = useOptimistic(
    { counts: reactionCounts, mine: myReactions },
    (state, { key }: { key: ReactionKey }) => {
      const wasMine = state.mine[key];
      return {
        counts: { ...state.counts, [key]: state.counts[key] + (wasMine ? -1 : 1) },
        mine: { ...state.mine, [key]: !wasMine },
      };
    }
  );

  const commentCount = Array.isArray(post.comment_count)
    ? (post.comment_count as unknown as { count: number }[])[0]?.count ?? 0
    : post.comment_count ?? 0;

  function handleDelete() {
    if (!confirm("Delete this post?")) return;
    startTransition(async () => {
      try {
        await deletePost(post.id, communitySlug);
        toast.success("Post deleted");
      } catch { toast.error("Failed to delete post"); }
    });
  }

  function handlePin() {
    startTransition(async () => {
      try {
        await pinPost(post.id, post.community_id, communitySlug);
        toast.success(pinned ? "Post unpinned" : "Post pinned");
      } catch { toast.error("Failed to pin post"); }
    });
  }

  function handleReaction(key: ReactionKey) {
    if (!currentUserId) { toast.error("Sign in to react"); return; }
    startTransition(async () => {
      setOptimisticReactions({ key });
      try {
        await toggleReaction(post.id, key, communitySlug);
      } catch { toast.error("Failed to save reaction"); }
    });
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    startTransition(async () => {
      try {
        await createComment(post.id, commentText, communitySlug);
        setCommentText("");
        setShowComments(true);
        toast.success("Comment added");
      } catch { toast.error("Failed to add comment"); }
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updatePost(post.id, communitySlug, { title: editTitle || null, body: editBody || null });
        setEditing(false);
        toast.success("Post updated");
      } catch { toast.error("Failed to update post"); }
    });
  }

  function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportReason.trim()) return;
    startTransition(async () => {
      try {
        await reportPost(post.id, reportReason);
        setShowReport(false);
        toast.success("Report submitted");
      } catch { toast.error("Failed to submit report"); }
    });
  }

  function handleRepost(target: UserCommunity) {
    startTransition(async () => {
      try {
        await repostPost(post.id, target.id, target.slug);
        setShowRepost(false);
        toast.success(`Reposted to ${target.name}`);
      } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to repost"); }
    });
  }

  // Communities the user can repost to (all except the current one)
  const repostTargets = (userCommunities ?? []).filter((c) => c.id !== post.community_id);

  return (
    <article
      id={`post-${post.id}`}
      className={cn(
        "rounded-2xl border bg-card p-5 space-y-4",
        pinned && "border-primary/30 bg-primary/5"
      )}
    >
      {/* Pinned indicator */}
      {pinned && (
        <div className="flex items-center gap-1.5 -mt-1 text-xs text-primary font-medium">
          <svg viewBox="0 0 24 24" className="size-3 fill-current"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
          Pinned
        </div>
      )}

      {/* Parent push banner */}
      {post.push_to_all && (
        <div className="-mt-1 -mx-1">
          <Badge variant="secondary" className="text-xs">From Warriors on the Way</Badge>
        </div>
      )}

      {/* Author row */}
      <div className="flex items-start justify-between gap-3">
        <a href={`/profile/${post.author_id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Avatar className="size-8">
            <AvatarImage src={authorAvatar ?? undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{authorName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric",
                hour: "numeric", minute: "2-digit",
              })}
            </p>
          </div>
        </a>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {TYPE_LABELS[post.post_type] ?? post.post_type}
          </Badge>
          <div className="flex items-center gap-0.5">
            {isAdmin && (
              <button
                onClick={handlePin}
                disabled={isPending}
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded transition-colors",
                  pinned
                    ? "text-primary hover:text-muted-foreground"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {pinned ? "Unpin" : "Pin"}
              </button>
            )}
            {isOwn && (post.post_type === "discussion" || post.post_type === "event") && (
              <button
                onClick={() => setEditing(!editing)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                {editing ? "Cancel" : "Edit"}
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-1"
              >
                Delete
              </button>
            )}
            {isMember && repostTargets.length > 0 && (
              <button
                onClick={() => setShowRepost(!showRepost)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                Repost
              </button>
            )}
            {!isOwn && isMember && (
              <button
                onClick={() => setShowReport(!showReport)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <p className="font-heading font-semibold text-base leading-snug">{post.title}</p>
      )}

      {/* Body */}
      {post.body && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>
      )}

      {/* Embed — new unified format (Spotify or YouTube iframe) */}
      {post.embed_url && (
        <EmbedBlock embedUrl={post.embed_url} title={post.title ?? undefined} />
      )}

      {/* Legacy YouTube (existing posts without embed_url) */}
      {!post.embed_url && post.youtube_oembed && (
        <YouTubeEmbed
          videoId={post.youtube_oembed.video_id}
          title={post.youtube_oembed.title}
          thumbnailUrl={post.youtube_oembed.thumbnail_url}
        />
      )}

      {/* Inline edit form */}
      {editing && (
        <form onSubmit={handleEdit} className="space-y-2 pt-1">
          {post.title !== null && (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            placeholder="Post body…"
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>Save</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Repost picker */}
      {showRepost && repostTargets.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Share to another group:</p>
          <div className="flex flex-wrap gap-2">
            {repostTargets.map((target) => (
              <button
                key={target.id}
                onClick={() => handleRepost(target)}
                disabled={isPending}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
              >
                {target.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report form */}
      {showReport && (
        <form onSubmit={handleReport} className="space-y-2 pt-1">
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Why are you reporting this post?"
            rows={2}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending || !reportReason.trim()}>Submit report</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowReport(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <Separator />

      {/* Reactions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {REACTIONS.map(({ key, emoji }) => {
            const count = optimisticReactions.counts[key];
            const mine = optimisticReactions.mine[key];
            return (
              <button
                key={key}
                onClick={() => handleReaction(key)}
                disabled={isPending}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-colors",
                  mine
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="text-xs font-medium">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showComments ? "Hide" : "Show"} comments ({commentCount})
        </button>
      </div>

      {/* Comments */}
      {showComments && comments.length > 0 && (
        <div className="space-y-3 pl-3 border-l-2 border-muted">
          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              communitySlug={communitySlug}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Comment input — always visible for members */}
      {isMember && (
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm" disabled={isPending || !commentText.trim()}>Post</Button>
        </form>
      )}
    </article>
  );
}

// Unified embed renderer (YouTube click-to-play + Spotify click-to-load)
function EmbedBlock({ embedUrl, title }: { embedUrl: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  const isSpotify = embedUrl.includes("spotify.com");

  if (isSpotify) {
    // Direct Spotify URL for "Open in Spotify" link (strips /embed/ and query params)
    const spotifyDirectUrl = embedUrl
      .replace("open.spotify.com/embed/", "open.spotify.com/")
      .split("?")[0];

    if (!playing) {
      return (
        <div className="rounded-xl border bg-card overflow-hidden">
          <button
            onClick={() => setPlaying(true)}
            className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/40 transition-colors"
          >
            <div className="size-11 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="size-6 fill-white">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{title ?? "Spotify"}</p>
              <p className="text-xs text-muted-foreground">Tap to load inline player</p>
            </div>
            <svg viewBox="0 0 24 24" className="size-5 fill-current text-muted-foreground shrink-0"><path d="M8 5v14l11-7z" /></svg>
          </button>
          <div className="border-t px-4 py-2">
            <a
              href={spotifyDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#1DB954] hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Open in Spotify ↗
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border overflow-hidden">
        <iframe
          src={embedUrl}
          height="352"
          width="100%"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; storage-access"
          allowFullScreen
          className="block"
        />
        <div className="border-t px-4 py-2">
          <a
            href={spotifyDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#1DB954] hover:underline font-medium"
          >
            Open in Spotify ↗
          </a>
        </div>
      </div>
    );
  }

  // YouTube — use nocookie domain to avoid sign-in prompts on mobile
  const noCookieUrl = embedUrl.replace("youtube.com/embed/", "youtube-nocookie.com/embed/");
  const ytMatch = embedUrl.match(/embed\/([^?&/]+)/);
  const videoId = ytMatch?.[1];
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  if (playing || !thumbUrl) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`${noCookieUrl}${noCookieUrl.includes("?") ? "&" : "?"}rel=0&autoplay=1&modestbranding=1`}
          title={title ?? "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbUrl} alt={title ?? "Video"} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-16 rounded-full bg-black/70 flex items-center justify-center group-hover:bg-black/90 transition-colors">
          <svg viewBox="0 0 24 24" className="size-7 fill-white ml-1"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      {title && (
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-left">
          <p className="text-white text-xs font-medium line-clamp-1">{title}</p>
        </div>
      )}
    </button>
  );
}

// Legacy YouTube click-to-play (for existing posts that have youtube_oembed but no embed_url)
function YouTubeEmbed({ videoId, title, thumbnailUrl }: {
  videoId: string; title: string; thumbnailUrl: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black group"
    >
      <Image src={thumbnailUrl} alt={title} fill className="object-cover group-hover:opacity-80 transition-opacity" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-14 rounded-full bg-black/70 flex items-center justify-center group-hover:bg-black/90 transition-colors">
          <svg viewBox="0 0 24 24" className="size-6 fill-white ml-1"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-left">
        <p className="text-white text-xs font-medium line-clamp-1">{title}</p>
      </div>
    </button>
  );
}

function CommentRow({ comment, communitySlug, currentUserId, isAdmin }: {
  comment: Comment; communitySlug: string; currentUserId: string; isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const author = comment.author as { display_name: string; avatar_url?: string | null };
  const canDelete = comment.author_id === currentUserId || isAdmin;

  function handleDelete() {
    startTransition(async () => {
      try { await deleteComment(comment.id, communitySlug); }
      catch { toast.error("Failed to delete comment"); }
    });
  }

  return (
    <div className="flex items-start gap-2 group">
      <Avatar className="size-6 mt-0.5 shrink-0">
        <AvatarImage src={author.avatar_url ?? undefined} />
        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
          {author.display_name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium">{author.display_name} </span>
        <span className="text-xs text-foreground">{comment.body}</span>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {new Date(comment.created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
          })}
        </p>
      </div>
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          ×
        </button>
      )}
    </div>
  );
}
