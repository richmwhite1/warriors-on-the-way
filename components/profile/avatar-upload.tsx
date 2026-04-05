"use client";

import { useRef, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/lib/actions/profile";
import { toast } from "sonner";

type Props = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export function AvatarUpload({ userId, displayName, avatarUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop();
        const path = `${userId}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });

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
        {isPending ? "Uploading…" : "Click avatar to change · Max 2 MB"}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
