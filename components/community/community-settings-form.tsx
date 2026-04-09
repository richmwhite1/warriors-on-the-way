"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  updateCommunitySettings,
  connectTelegramChannel,
  disconnectTelegramChannel,
  setupTelegramWebhook,
  checkTelegramConnected,
} from "@/lib/actions/communities";
import { toast } from "sonner";
import type { Community } from "@/lib/queries/communities";

// Set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME in your .env.local
// e.g. NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=WoWAssistantBot
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "WoWAssistantBot";

// Poll every 3 seconds for up to 2 minutes after clicking the deep link
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_COUNT = 40; // 40 × 3s = 2 min

export function CommunitySettingsForm({ community }: { community: Community }) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(community.banner_url);
  const [isPending, startTransition] = useTransition();
  // "idle" | "enabling" (registering webhook) | "waiting" (polling for connection)
  const [botStep, setBotStep] = useState<"idle" | "enabling" | "waiting">("idle");
  const [botConnected, setBotConnected] = useState(!!community.telegram_chat_id);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const hasTelegramLink = !!(community.telegram_invite_link ?? "").trim();

  // Clean up poll on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling() {
    if (pollRef.current) return; // already polling
    setPolling(true);
    pollCountRef.current = 0;

    pollRef.current = setInterval(async () => {
      pollCountRef.current++;
      try {
        const chatId = await checkTelegramConnected(community.id);
        if (chatId) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setPolling(false);
          setBotConnected(true);
          setBotStep("idle");
          toast.success("Connected! Posts and events will auto-appear in your Telegram group.");
          return;
        }
      } catch {
        // ignore transient errors
      }

      if (pollCountRef.current >= POLL_MAX_COUNT) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setPolling(false);
        toast.error(
          "Connection timed out. Make sure you added the bot to your group, then click 'Check connection'."
        );
      }
    }, POLL_INTERVAL_MS);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (bannerUrl !== community.banner_url) {
      fd.set("banner_url", bannerUrl ?? "");
    }
    startTransition(async () => {
      try {
        await updateCommunitySettings(community.id, fd);
        toast.success("Settings saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function handleEnableBot() {
    setBotStep("enabling");
    startTransition(async () => {
      try {
        // Register the webhook so Telegram can auto-notify us when the bot is added
        await setupTelegramWebhook(community.id);
      } catch (err) {
        // Webhook registration failure isn't fatal — the manual check still works
        console.warn("Webhook registration failed:", err);
      }
      setBotStep("waiting");
    });
  }

  function handleCheckConnection() {
    startTransition(async () => {
      try {
        await connectTelegramChannel(community.id, community.slug);
        setBotConnected(true);
        setBotStep("idle");
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setPolling(false);
        }
        toast.success("Connected! Posts and events will auto-appear in your Telegram group.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Not connected yet — make sure you added the bot.");
      }
    });
  }

  function handleDisconnectBot() {
    if (!confirm("Stop automatic posts to this Telegram group?")) return;
    startTransition(async () => {
      try {
        await disconnectTelegramChannel(community.id, community.slug);
        setBotConnected(false);
        toast.success("Automatic posts disconnected");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to disconnect");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Telegram — always first ─────────────────────────────────────────── */}
      <div className={`rounded-2xl border-2 p-5 space-y-5 ${
        hasTelegramLink
          ? "border-[#229ED9]/30 bg-[#229ED9]/5"
          : "border-amber-400/60 bg-amber-50/60 dark:bg-amber-950/20"
      }`}>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`shrink-0 size-10 rounded-full flex items-center justify-center ${hasTelegramLink ? "bg-[#229ED9]" : "bg-amber-400"}`}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            {hasTelegramLink ? (
              <p className="font-medium text-[#229ED9]">Telegram group linked</p>
            ) : (
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Set up your Telegram group — highly recommended
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasTelegramLink
                ? "Members see a \"Join on Telegram\" button on the community wall and discovery cards."
                : "Telegram is how members stay connected between gatherings. Without it, posts only live inside this app."}
            </p>
          </div>
        </div>

        {/* Step-by-step guide (shown only when no link yet) */}
        {!hasTelegramLink && (
          <div className="rounded-xl bg-background border px-4 py-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              How to create a Telegram group &amp; get your invite link
            </p>
            <ol className="space-y-3 text-sm">
              {[
                <>Open <strong>Telegram</strong> on your phone. Download it free from the App Store or Google Play if you don&apos;t have it.</>,
                <>Tap the <strong>pencil / compose</strong> icon → <strong>New Group</strong>.</>,
                <>Add at least one contact (you can remove them later), name the group after your community, tap <strong>Create</strong>.</>,
                <>Tap the <strong>group name</strong> at the top → <strong>Invite via link</strong> → <strong>Copy Link</strong>.</>,
                <>Paste the link below. It will look like <code className="text-xs bg-muted px-1 py-0.5 rounded">https://t.me/+xxxxxxxxxxxxxxxx</code></>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 size-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Invite link input */}
        <div className="space-y-1.5">
          <Label htmlFor="telegram_invite_link" className={hasTelegramLink ? "" : "font-semibold"}>
            {hasTelegramLink ? "Telegram invite link" : "Paste your invite link here"}
          </Label>
          <Input
            id="telegram_invite_link"
            name="telegram_invite_link"
            type="url"
            defaultValue={community.telegram_invite_link ?? ""}
            placeholder="https://t.me/+xxxxxxxxxxxxxxxx"
            className={hasTelegramLink ? "" : "border-amber-400 focus-visible:ring-amber-400"}
          />
          {hasTelegramLink && (
            <p className="text-xs text-muted-foreground">
              Update this if you create a new group or the link changes. Save settings after editing.
              To control who can join, open your Telegram group → Settings → enable <strong>Approve New Members</strong>.
            </p>
          )}
        </div>

        {/* ── Auto-post section (shown after invite link is saved) ────────── */}
        {hasTelegramLink && (
          <div className="border-t pt-5 space-y-4">
            {botConnected ? (
              /* Connected state */
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Bot connected — posts auto-share to Telegram</p>
                    <p className="text-xs text-muted-foreground">
                      New posts and events are automatically shared to your Telegram group.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectBot}
                  disabled={isPending}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  Disconnect
                </button>
              </div>
            ) : botStep === "idle" ? (
              /* Prompt to enable */
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-medium">Enable automatic posts to Telegram</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Every new post and event will be shared to your group automatically — no manual sharing needed.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-[#229ED9] text-[#229ED9] hover:bg-[#229ED9]/10"
                  onClick={handleEnableBot}
                  disabled={isPending}
                >
                  {isPending ? "Setting up…" : "Push all content to channel →"}
                </Button>
              </div>
            ) : botStep === "enabling" ? (
              /* Registering webhook */
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Setting up connection…
              </div>
            ) : (
              /* Waiting / polling state */
              <div className="rounded-xl bg-background border p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Add the bot to your Telegram group</p>
                  <p className="text-xs text-muted-foreground">
                    Tap below to open Telegram — select your community group when prompted.
                    The connection happens automatically once the bot is added.
                  </p>
                </div>

                {/* Primary deep link — opens native Telegram */}
                <div className="space-y-2">
                  <a
                    href={`tg://resolve?domain=${BOT_USERNAME}&startgroup=${community.id}`}
                    onClick={startPolling}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#229ED9] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                    </svg>
                    Add @{BOT_USERNAME} to Telegram
                  </a>
                  <p className="text-xs text-muted-foreground">
                    If Telegram doesn&apos;t open,{" "}
                    <a
                      href={`https://t.me/${BOT_USERNAME}?startgroup=${community.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      use this browser link instead
                    </a>
                    .
                  </p>
                </div>

                {/* Connection status */}
                {polling ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    Waiting for connection… (checking every few seconds)
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCheckConnection}
                      disabled={isPending}
                      className="text-xs text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                      {isPending ? "Checking…" : "Already added? Check connection"}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setBotStep("idle");
                    if (pollRef.current) {
                      clearInterval(pollRef.current);
                      pollRef.current = null;
                      setPolling(false);
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Banner ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Community image</h2>
        <div className="space-y-1.5">
          <Label>Banner photo</Label>
          <ImageUpload value={bannerUrl} onChange={setBannerUrl} label="Upload banner photo" />
          <p className="text-xs text-muted-foreground">Shown at the top of your community card. Recommended: 1200×400px.</p>
        </div>
      </div>

      {/* ── Basic info ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Community info</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required maxLength={80} defaultValue={community.name} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description" name="description" rows={3} maxLength={500}
            defaultValue={community.description ?? ""}
            placeholder="What this community is about…"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mission">Mission statement</Label>
          <textarea
            id="mission" name="mission" rows={4} maxLength={1000}
            defaultValue={community.mission ?? ""}
            placeholder="What is the purpose and vision of this community…"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <p className="text-xs text-muted-foreground">Shown on the community wall below the description.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rules_md">Community standards / axioms</Label>
          <textarea
            id="rules_md" name="rules_md" rows={6} maxLength={3000}
            defaultValue={community.rules_md ?? ""}
            placeholder={"1. First principle\n2. Second principle\n…"}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Plain text. Shown as &ldquo;Community Standards&rdquo; on this community&apos;s wall.
            {!community.is_parent && " The parent community's standards are also shown to members."}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location" name="location" maxLength={100}
            defaultValue={community.location ?? ""}
            placeholder="e.g. San Francisco, CA · Austin, TX · London, UK"
          />
          <p className="text-xs text-muted-foreground">Helps people find your community nearby</p>
        </div>
      </div>

      {/* ── Access ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Access</h2>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="is_private" value="true"
            defaultChecked={community.is_private} className="mt-0.5 rounded" />
          <div>
            <p className="text-sm font-medium">Private community</p>
            <p className="text-xs text-muted-foreground">New members require admin approval to join</p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="members_can_create_events" value="true"
            defaultChecked={community.members_can_create_events} className="mt-0.5 rounded" />
          <div>
            <p className="text-sm font-medium">Members can create events</p>
            <p className="text-xs text-muted-foreground">If off, only admins and organizers can create events</p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="allow_guest_rsvp"
            value="true"
            defaultChecked={community.allow_guest_rsvp !== false}
            className="mt-0.5 rounded"
          />
          <div>
            <p className="text-sm font-medium">Allow guest event access</p>
            <p className="text-xs text-muted-foreground">
              Guests can view events and RSVP without signing in — great for sharing with friends.
              Turn off to require sign-in for all event access.
            </p>
          </div>
        </label>
      </div>

      {/* ── Size ────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Size</h2>
        <div className="space-y-1.5">
          <Label htmlFor="member_cap">Member cap</Label>
          <Input id="member_cap" name="member_cap" type="number" min={1} max={150}
            defaultValue={community.member_cap} className="w-24" />
          <p className="text-xs text-muted-foreground">Max 150. New joiners go to waitlist when full.</p>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
