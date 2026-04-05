"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { deletePost, reportPost } from "@/lib/actions/posts";
import { createComment, deleteComment } from "@/lib/actions/comments";
import { toast } from "sonner";
import type { Post } from "@/lib/queries/posts";
import type { Comment } from "@/lib/queries/comments";

type Props = {
  post: Post;
  comments: Comment[];
  communitySlug: string;
  currentUserId: string;
  isAdmin: boolean;
  isMember: boolean;
};

export function PostCard({ post, comments, communitySlug, currentUserId, isAdmin, isMember }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const isOwn = post.author_id === currentUserId;
  const canDelete = isOwn || isAdmin;

  const authorName = (post.author as unknown as { display_name: string })?.display_name
    ?? (post.author as { display_name?: string })?.display_name
    ?? "Unknown";
  const authorAvatar = (post.author as { avatar_url?: string | null })?.avatar_url ?? null;

  function handleDelete() {
    if (!confirm("Delete this post?")) return;
    startTransition(async () => {
      try {
        await deletePost(post.id, communitySlug);
        toast.success("Post deleted");
      } catch { toast.error("Failed to delete post"); }
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

  const commentCount = Array.isArray(post.comment_count)
    ? (post.comment_count as unknown as { count: number }[])[0]?.count ?? 0
    : post.comment_count ?? 0;

  return (
    <article className="rounded-2xl border bg-card p-5 space-y-4">
      {/* Parent push banner */}
      {post.push_to_all && (
        <div className="flex items-center gap-2 -mt-1 -mx-1">
          <Badge variant="secondary" className="text-xs">
            From Warriors on the Way
          </Badge>
        </div>
      )}

      {/* Author row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
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
        </div>

        <div className="flex items-center gap-1">
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors px-1"
            >
              Delete
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

      {/* Body */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>

      {/* YouTube embed */}
      {post.youtube_oembed && (
        <YouTubeEmbed
          videoId={post.youtube_oembed.video_id}
          title={post.youtube_oembed.title}
          thumbnailUrl={post.youtube_oembed.thumbnail_url}
        />
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
            <Button type="submit" size="sm" disabled={isPending || !reportReason.trim()}>
              Submit report
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowReport(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <Separator />

      {/* Comments toggle */}
      <div className="space-y-3">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showComments ? "Hide" : "Show"} comments ({commentCount})
        </button>

        {showComments && (
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

            {isMember && (
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  maxLength={500}
                  className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="submit" size="sm" disabled={isPending || !commentText.trim()}>
                  Post
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function CommentRow({
  comment, communitySlug, currentUserId, isAdmin,
}: {
  comment: Comment;
  communitySlug: string;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const author = comment.author as { display_name: string; avatar_url?: string | null };
  const canDelete = comment.author_id === currentUserId || isAdmin;

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteComment(comment.id, communitySlug);
      } catch { toast.error("Failed to delete comment"); }
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

function YouTubeEmbed({ videoId, title, thumbnailUrl }: {
  videoId: string; title: string; thumbnailUrl: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
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
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        className="object-cover group-hover:opacity-80 transition-opacity"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-14 rounded-full bg-black/70 flex items-center justify-center group-hover:bg-black/90 transition-colors">
          <svg viewBox="0 0 24 24" className="size-6 fill-white ml-1">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-left">
        <p className="text-white text-xs font-medium line-clamp-1">{title}</p>
      </div>
    </button>
  );
}
