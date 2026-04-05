"use client";

import { useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  approveMember,
  denyMember,
  promoteMember,
  removeMember,
} from "@/lib/actions/members";
import { toast } from "sonner";
import type { MemberWithProfile } from "@/lib/queries/members";

type Props = {
  members: MemberWithProfile[];
  pendingMembers: MemberWithProfile[];
  communitySlug: string;
  isAdmin: boolean;
  currentUserId: string;
};

export function MemberList({
  members,
  pendingMembers,
  communitySlug,
  isAdmin,
  currentUserId,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Pending approval */}
      {isAdmin && pendingMembers.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Pending approval ({pendingMembers.length})
          </h3>
          {pendingMembers.map((m) => (
            <PendingRow key={m.id} member={m} communitySlug={communitySlug} />
          ))}
        </section>
      )}

      {/* Active members */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Members ({members.length})
        </h3>
        {members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            communitySlug={communitySlug}
            isAdmin={isAdmin}
            isSelf={m.user.id === currentUserId}
          />
        ))}
      </section>
    </div>
  );
}

function MemberRow({
  member,
  communitySlug,
  isAdmin,
  isSelf,
}: {
  member: MemberWithProfile;
  communitySlug: string;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const canManage = isAdmin && !isSelf && member.role !== "organizer";

  function handlePromote(role: "member" | "admin") {
    startTransition(async () => {
      try {
        await promoteMember(member.id, role, communitySlug);
        toast.success(`${member.user.display_name} is now a${role === "admin" ? "n admin" : " member"}`);
      } catch {
        toast.error("Action failed");
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeMember(member.id, communitySlug);
        toast.success(`${member.user.display_name} removed`);
      } catch {
        toast.error("Action failed");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={member.user.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {member.user.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {member.user.display_name}
            {isSelf && <span className="text-muted-foreground"> (you)</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant={member.role === "organizer" ? "default" : member.role === "admin" ? "secondary" : "outline"}
          className="text-xs capitalize"
        >
          {member.role}
        </Badge>

        {canManage && (
          <div className="flex gap-1">
            {member.role === "member" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePromote("admin")}
                disabled={isPending}
              >
                Make admin
              </Button>
            )}
            {member.role === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePromote("member")}
                disabled={isPending}
              >
                Demote
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PendingRow({
  member,
  communitySlug,
}: {
  member: MemberWithProfile;
  communitySlug: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveMember(member.id, communitySlug);
        toast.success(`${member.user.display_name} approved`);
      } catch {
        toast.error("Action failed");
      }
    });
  }

  function handleDeny() {
    startTransition(async () => {
      try {
        await denyMember(member.id, communitySlug);
        toast.success(`${member.user.display_name} denied`);
      } catch {
        toast.error("Action failed");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarImage src={member.user.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {member.user.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium">{member.user.display_name}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7" onClick={handleApprove} disabled={isPending}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7"
          onClick={handleDeny}
          disabled={isPending}
        >
          Deny
        </Button>
      </div>
    </div>
  );
}
