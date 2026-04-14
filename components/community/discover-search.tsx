"use client";

import { useState } from "react";
import { CommunityCard } from "@/components/community/community-card";
import { toast } from "sonner";

type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  is_private: boolean;
  is_parent: boolean;
  member_cap: number;
  member_count: unknown;
  post_count: unknown;
  latitude: number | null;
  longitude: number | null;
};

type UserCoords = { latitude: number; longitude: number };

// Haversine distance in km
function haversineKm(a: UserCoords, b: { latitude: number; longitude: number }): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

export function DiscoverSearch({ communities }: { communities: Community[] }) {
  const [query, setQuery] = useState("");
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [locating, setLocating] = useState(false);

  function handleNearMe() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    if (userCoords) {
      // Toggle off
      setUserCoords(null);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        toast.error("Location access denied — check your browser settings");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  const textFiltered = query.trim()
    ? communities.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : communities;

  // Attach distances and sort if user location is known
  const withDistance = textFiltered.map((c) => ({
    ...c,
    distance:
      userCoords && c.latitude != null && c.longitude != null
        ? haversineKm(userCoords, { latitude: c.latitude, longitude: c.longitude })
        : undefined,
  }));

  const sorted = userCoords
    ? [...withDistance].sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      })
    : withDistance;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Search communities…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={handleNearMe}
          disabled={locating}
          title={userCoords ? "Turn off proximity sort" : "Sort by distance from your location"}
          className={`shrink-0 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
            userCoords
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          {locating ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
            </svg>
          )}
        </button>
      </div>

      {userCoords && (
        <p className="text-xs text-muted-foreground">
          Sorted by distance · communities without a location appear last
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No communities match &ldquo;{query}&rdquo;
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map((c) => {
            const count = (c.member_count as { count: number }[])?.[0]?.count ?? 0;
            const posts = (c.post_count as { count: number }[])?.[0]?.count ?? 0;
            return (
              <CommunityCard
                key={c.id}
                name={c.name}
                slug={c.slug}
                description={c.description}
                bannerUrl={c.banner_url}
                isPrivate={c.is_private}
                isParent={c.is_parent}
                memberCount={count}
                memberCap={c.member_cap}
                postCount={posts}
                distance={c.distance}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
