"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { createEvent } from "@/lib/actions/events";
import { toast } from "sonner";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
];

type Props = { communityId: string; communitySlug: string };

function SectionHeader({ step, title, hint }: { step: string; title: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-3">
        <span
          className="text-[10px] uppercase tracking-[0.3em] text-[#a07828]"
          style={{ fontFamily: "var(--font-brand)" }}
        >
          {step}
        </span>
        <h3
          className="text-lg"
          style={{
            fontFamily: "var(--font-brand)",
            fontWeight: 600,
            color: "#1a1610",
            letterSpacing: "0.02em",
          }}
        >
          {title}
        </h3>
      </div>
      {hint ? (
        <p className="italic text-sm text-[#6b6456]" style={{ fontFamily: "var(--font-body)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="h-px flex-1 bg-[#ede9e1]" />
      <span className="px-4 text-[#c4a050] text-xs" style={{ fontFamily: "var(--font-brand)" }}>
        ✦
      </span>
      <span className="h-px flex-1 bg-[#ede9e1]" />
    </div>
  );
}

export function CreateEventForm({ communityId, communitySlug }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"confirmed" | "voting">("confirmed");
  const [dateOptions, setDateOptions] = useState([{ starts_at: "", ends_at: "" }]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [tasksEnabled, setTasksEnabled] = useState(false);
  const [expensesEnabled, setExpensesEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("community_id", communityId);
    fd.set("community_slug", communitySlug);
    fd.set("mode", mode);
    fd.set("tasks_enabled", String(tasksEnabled));
    fd.set("expenses_enabled", String(expensesEnabled));
    if (imageUrl) fd.set("image_url", imageUrl);
    startTransition(async () => {
      try {
        const { eventId, communitySlug: slug } = await createEvent(fd);
        router.push(`/community/${slug}/events/${eventId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create event");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* ── 1. The Essence ─────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeader
          step="I"
          title="The essence"
          hint="What are we calling the warriors to?"
        />
        <div className="space-y-2">
          <Label htmlFor="title" className="text-[#4a4438]">Title</Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            placeholder="Full moon fire circle at the mesa"
            className="h-12 text-base bg-white/70"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="text-[#4a4438]">
            An invitation <span className="text-[#a07828] italic font-normal normal-case">· optional</span>
          </Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={1000}
            placeholder="Speak to the heart. What will unfold? What should they bring? What will they leave with?"
            className="w-full rounded-none border border-[#ede9e1] bg-white/70 px-4 py-3 text-[15px] leading-relaxed placeholder:text-[#c8c2b4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a07828] resize-none"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#4a4438]">
            A photograph <span className="text-[#a07828] italic font-normal normal-case">· optional</span>
          </Label>
          <ImageUpload
            value={imageUrl}
            onChange={(url: string) => setImageUrl(url || null)}
            label="Add an image to set the tone"
          />
        </div>
      </section>

      <Divider />

      {/* ── 2. The Where ──────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeader step="II" title="The where" hint="In person, online, or both — all are welcome." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location" className="text-[#4a4438]">Place</Label>
            <Input
              id="location"
              name="location"
              placeholder="Muir Woods visitor center"
              className="h-12 bg-white/70"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="virtual_url" className="text-[#4a4438]">Virtual link</Label>
            <Input
              id="virtual_url"
              name="virtual_url"
              type="url"
              placeholder="https://meet.google.com/…"
              className="h-12 bg-white/70"
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── 3. The When ───────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeader
          step="III"
          title="The when"
          hint={mode === "confirmed" ? "Set an hour that feels right." : "Let the circle choose together."}
        />

        <div className="grid grid-cols-2 gap-2 p-1 bg-[#f8f7f4] border border-[#ede9e1]">
          <button
            type="button"
            onClick={() => setMode("confirmed")}
            className="text-sm py-2.5 transition-all"
            style={{
              fontFamily: "var(--font-brand)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontSize: "11px",
              fontWeight: 600,
              background: mode === "confirmed" ? "#ffffff" : "transparent",
              color: mode === "confirmed" ? "#1a1610" : "#6b6456",
              boxShadow: mode === "confirmed" ? "0 1px 2px rgba(26,22,16,0.06)" : "none",
            }}
          >
            Set a date
          </button>
          <button
            type="button"
            onClick={() => setMode("voting")}
            className="text-sm py-2.5 transition-all"
            style={{
              fontFamily: "var(--font-brand)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontSize: "11px",
              fontWeight: 600,
              background: mode === "voting" ? "#ffffff" : "transparent",
              color: mode === "voting" ? "#1a1610" : "#6b6456",
              boxShadow: mode === "voting" ? "0 1px 2px rgba(26,22,16,0.06)" : "none",
            }}
          >
            Vote on a date
          </button>
        </div>

        {mode === "confirmed" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_at" className="text-[#4a4438]">Begins</Label>
              <Input id="starts_at" name="starts_at" type="datetime-local" className="h-12 bg-white/70" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at" className="text-[#4a4438]">Ends</Label>
              <Input id="ends_at" name="ends_at" type="datetime-local" className="h-12 bg-white/70" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {dateOptions.map((opt, i) => (
              <div key={i} className="space-y-2 p-4 border border-[#ede9e1] bg-white/50">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-[#a07828]" style={{ fontFamily: "var(--font-brand)" }}>
                  Option {i + 1}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="datetime-local"
                    name="option_starts_at"
                    value={opt.starts_at}
                    onChange={(e) => {
                      const next = [...dateOptions];
                      next[i].starts_at = e.target.value;
                      setDateOptions(next);
                    }}
                    className="h-11 bg-white/80"
                  />
                  <Input
                    type="datetime-local"
                    name="option_ends_at"
                    placeholder="End (optional)"
                    value={opt.ends_at}
                    onChange={(e) => {
                      const next = [...dateOptions];
                      next[i].ends_at = e.target.value;
                      setDateOptions(next);
                    }}
                    className="h-11 bg-white/80"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDateOptions([...dateOptions, { starts_at: "", ends_at: "" }])}
              className="text-xs uppercase tracking-[0.2em] text-[#a07828] hover:text-[#1a1610] transition-colors"
              style={{ fontFamily: "var(--font-brand)" }}
            >
              + Offer another option
            </button>
            <div className="space-y-2 pt-2">
              <Label htmlFor="vote_threshold" className="text-[#4a4438]">Auto-confirm threshold</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="vote_threshold"
                  name="vote_threshold"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={75}
                  className="w-24 h-11 bg-white/70"
                />
                <span className="text-sm text-[#6b6456] italic" style={{ fontFamily: "var(--font-body)" }}>
                  % of members — the date locks when the circle reaches consensus.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-[#4a4438]">Timezone</Label>
          <select
            id="timezone"
            name="timezone"
            defaultValue="America/Los_Angeles"
            className="w-full h-12 rounded-none border border-[#ede9e1] bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a07828]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </section>

      <Divider />

      {/* ── 4. The Offering ────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeader
          step="IV"
          title="The offering"
          hint="Leave blank if this gathering is a gift."
        />
        <div className="space-y-2">
          <Label htmlFor="registration_fee" className="text-[#4a4438]">Registration fee</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6456]">$</span>
            <Input
              id="registration_fee"
              name="registration_fee"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="h-12 pl-8 bg-white/70"
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── 5. Deeper Threads ──────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          step="V"
          title="Deeper threads"
          hint="Weave these in if you need them. They can always be added later."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className="relative flex items-start gap-3 p-4 cursor-pointer transition-all"
            style={{
              background: tasksEnabled ? "rgba(196,160,80,0.08)" : "rgba(255,255,255,0.5)",
              border: tasksEnabled ? "1px solid #a07828" : "1px solid #ede9e1",
            }}
          >
            <input
              type="checkbox"
              className="mt-1 accent-[#a07828]"
              checked={tasksEnabled}
              onChange={(e) => setTasksEnabled(e.target.checked)}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#1a1610]" style={{ fontFamily: "var(--font-brand)", letterSpacing: "0.02em" }}>
                Shared tasks
              </p>
              <p className="text-xs text-[#6b6456] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                Ask warriors to bring offerings, hold roles, or tend the space.
              </p>
            </div>
          </label>

          <label
            className="relative flex items-start gap-3 p-4 cursor-pointer transition-all"
            style={{
              background: expensesEnabled ? "rgba(196,160,80,0.08)" : "rgba(255,255,255,0.5)",
              border: expensesEnabled ? "1px solid #a07828" : "1px solid #ede9e1",
            }}
          >
            <input
              type="checkbox"
              className="mt-1 accent-[#a07828]"
              checked={expensesEnabled}
              onChange={(e) => setExpensesEnabled(e.target.checked)}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#1a1610]" style={{ fontFamily: "var(--font-brand)", letterSpacing: "0.02em" }}>
                Shared expenses
              </p>
              <p className="text-xs text-[#6b6456] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                Split costs gracefully with Venmo links.
              </p>
            </div>
          </label>
        </div>
      </section>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-14 text-sm"
          style={{
            fontFamily: "var(--font-brand)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 600,
            background: "#1a1610",
            color: "#f8f7f4",
          }}
        >
          {isPending ? "Calling the circle…" : "Send the invitation ✦"}
        </Button>
        <p className="text-center text-xs italic text-[#6b6456] mt-3" style={{ fontFamily: "var(--font-body)" }}>
          You can edit everything after it's created.
        </p>
      </div>
    </form>
  );
}
