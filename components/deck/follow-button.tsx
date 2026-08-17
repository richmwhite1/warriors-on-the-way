"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { followTopic, unfollowTopic } from "@/lib/actions/topics";

// Follow/unfollow the active objective. Follows drive the deck's default landing
// objective (see the deck page) and the home "topics you follow" feed.
export function FollowButton({
  topicId, topicSlug, initialFollowing,
}: {
  topicId: string;
  topicSlug: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next); // optimistic
    start(async () => {
      try {
        if (next) await followTopic(topicId, topicSlug);
        else await unfollowTopic(topicId, topicSlug);
        router.refresh();
      } catch {
        setFollowing(!next); // revert on failure
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="press-scale"
      style={{
        flexShrink: 0,
        padding: "6px 14px",
        borderRadius: 9999,
        border: following ? "1px solid var(--border)" : "1px solid var(--primary)",
        background: following ? "var(--card)" : "var(--primary)",
        color: following ? "var(--muted-foreground)" : "var(--primary-foreground)",
        fontFamily: "var(--font-brand)",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
