"use client";

import { useRef, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/lib/actions/profile";
import { toast } from "sonner";
import {
  ACCEPT_IMAGES,
  formatMb,
  isHeic,
  looksLikeImage,
  prepareImage,
} from "@/lib/image-file";

type Props = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

const MAX_BYTES = 2 * 1024 * 1024;

export function AvatarUpload({ userId, displayName, avatarUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!looksLikeImage(file)) {
      toast.error("That file isn't an image. Pick a photo instead.");
      return;
    }

    startTransition(async () => {
      try {
        // An avatar renders at 64px, so a straight iPhone photo is orders of
        // magnitude bigger than it needs to be. Re-encode instead of rejecting
        // — and always transcode HEIC, because Supabase storage serves the
        // bytes back verbatim and only Safari can render a .heic.
        const toSend = await prepareImage(file, {
          maxBytes: MAX_BYTES,
          maxEdge: 512,
          transcodeHeic: true,
        });

        if (isHeic(toSend)) {
          toast.error("This browser can't read iPhone HEIC photos — upload from your phone, or save the photo as JPEG first.");
          return;
        }
        if (toSend.size > MAX_BYTES) {
          toast.error(`That image is ${formatMb(toSend.size)} and the limit is 2 MB`);
          return;
        }

        const supabase = createClient();
        const ext = toSend.name.split(".").pop();
        const path = `${userId}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, toSend, { upsert: true, contentType: toSend.type });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        // Bust cache with timestamp
        const url = `${data.publicUrl}?t=${Date.now()}`;
        await updateAvatarUrl(url);
        toast.success("Avatar updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="relative group"
        title="Change avatar"
      >
        <Avatar className="size-16">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-xs">Edit</span>
        </div>
      </button>

      <div className="text-sm text-muted-foreground">
        {isPending ? "Uploading…" : "Click avatar to change · any photo, iPhone HEIC included"}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_IMAGES}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
