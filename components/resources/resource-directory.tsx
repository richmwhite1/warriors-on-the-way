"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, BadgeCheck } from "lucide-react";
import { createTopicResource, toggleVouch } from "@/lib/actions/topic-resources";
import type { TopicResource } from "@/lib/queries/topic-resources";
import { NeedsPicker } from "@/components/needs/needs-picker";
import type { Need } from "@/lib/queries/needs";

const CATEGORIES = ["practitioner", "farm", "school", "business", "organization", "place", "service", "other"] as const;

export function ResourceDirectory({
  topic,
  currentUserId,
  resources,
  activeCategory,
  needs,
}: {
  topic: { id: string; slug: string; name: string };
  currentUserId: string;
  resources: TopicResource[];
  activeCategory: string | null;
  needs: Need[];
}) {
  const router = useRouter();
  const [composing, setComposing] = useState(false);

  function setCategory(cat: string | null) {
    const url = cat ? `/topics/${topic.slug}/resources?category=${cat}` : `/topics/${topic.slug}/resources`;
    router.push(url);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
          People and places near you — sorted by proximity, then vouches.
        </p>
        <button onClick={() => setComposing((c) => !c)}
          style={{ padding: "8px 16px", borderRadius: 999, border: 0, background: "var(--primary)", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
          {composing ? "Close" : "+ Add"}
        </button>
      </div>

      {composing && <AddForm topic={topic} onDone={() => setComposing(false)} needs={needs} />}

      {/* Category filter chips */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }} className="no-scrollbar">
        <Chip label="All" active={!activeCategory} onClick={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} active={activeCategory === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      {resources.length === 0 ? (
        <p style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)", textAlign: "center", padding: "2rem 0" }}>
          No resources here yet. Add the first one you&apos;d vouch for.
        </p>
      ) : (
        resources.map((r) => (
          <ResourceRow key={r.id} resource={r} topicSlug={topic.slug} currentUserId={currentUserId} />
        ))
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 999, whiteSpace: "nowrap", textTransform: "capitalize",
      border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`, background: active ? "#fdf0e9" : "#fff",
      color: active ? "var(--primary)" : "var(--muted-foreground)", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
    }}>{label}</button>
  );
}

function AddForm({ topic, onDone, needs }: { topic: { id: string; slug: string }; onDone: () => void; needs: Need[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("topic_id", topic.id);
    fd.set("topic_slug", topic.slug);
    start(async () => { await createTopicResource(fd); router.refresh(); onDone(); });
  }
  return (
    <form onSubmit={submit} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 16, background: "#faf8f5" }}>
      <input name="title" required placeholder="Name (e.g. Wasatch Family Farm)"
        style={inp()} />
      <textarea name="description" rows={2} placeholder="What they offer…" style={{ ...inp(), resize: "vertical" }} />
      <select name="category" defaultValue="other" style={{ ...inp(), background: "#fff" }}>
        {CATEGORIES.map((c) => <option key={c} value={c} style={{ textTransform: "capitalize" }}>{c}</option>)}
      </select>
      <input name="address" placeholder="Location (city or address)" style={inp()} />
      <input name="url" type="url" placeholder="Website (optional)" style={inp()} />
      {/* Tagging doorways is what puts a practitioner in front of someone who needs
          them — without it the entry only ever surfaces under its mission. */}
      <div style={{ margin: "10px 0 14px" }}>
        <NeedsPicker needs={needs} />
      </div>
      <button type="submit" disabled={pending}
        style={{ width: "100%", padding: "10px 0", borderRadius: 999, border: 0, background: "var(--primary)", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
        {pending ? "Adding…" : "Add to directory"}
      </button>
    </form>
  );
}
function inp(): React.CSSProperties {
  return { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", fontFamily: "var(--font-body)", fontSize: 14, marginBottom: 8, outline: "none" };
}

function ResourceRow({ resource, topicSlug, currentUserId }: { resource: TopicResource; topicSlug: string; currentUserId: string }) {
  void currentUserId;
  const router = useRouter();
  const [, start] = useTransition();
  return (
    <article style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 15.5, color: "var(--foreground)" }}>{resource.title}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "#a39a8f", textTransform: "capitalize", marginTop: 2 }}>{resource.category}</div>
        </div>
        <button
          onClick={() => start(async () => { await toggleVouch(resource.id, topicSlug); router.refresh(); })}
          style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${resource.vouched_by_me ? "#2e7d5b" : "var(--border)"}`, background: resource.vouched_by_me ? "#e7f4ec" : "#fff", color: resource.vouched_by_me ? "#2e7d5b" : "var(--muted-foreground)", borderRadius: 999, padding: "5px 12px", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", height: "fit-content", whiteSpace: "nowrap" }}
        >
          <BadgeCheck size={14} /> {resource.vouch_count || "Vouch"}
        </button>
      </div>
      {resource.description && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "#4a4a45", margin: "8px 0 0", lineHeight: 1.5 }}>{resource.description}</p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        {resource.address && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--muted-foreground)" }}>
            <MapPin size={13} /> {resource.address}
            {resource.distance_km != null && <> · {resource.distance_km.toFixed(0)} km</>}
          </span>
        )}
        {resource.url && (
          <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--primary)" }}>
            Visit →
          </a>
        )}
      </div>
    </article>
  );
}
