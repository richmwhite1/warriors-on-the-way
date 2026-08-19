"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    _gmapsReadyCallback?: () => void;
  }
}

export type MapCommunity = {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  memberCount?: number;
};

let mapsPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("Maps key missing"));
      return;
    }
    // Reuse the loader already used by Places autocomplete (same library set) so the
    // script is only ever injected once per session.
    if (window.google?.maps) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>("script[data-gmaps]");
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(check);
          resolve();
        }
      }, 120);
      setTimeout(() => {
        clearInterval(check);
        window.google?.maps ? resolve() : reject(new Error("Maps load timeout"));
      }, 8000);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=_gmapsReadyCallback`;
    script.async = true;
    script.defer = true;
    script.dataset.gmaps = "true";
    window._gmapsReadyCallback = () => {
      delete window._gmapsReadyCallback;
      resolve();
    };
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
  return mapsPromise;
}

export function CommunitiesMap({ communities }: { communities: MapCommunity[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const mapped = communities.filter(
    (c) => typeof c.latitude === "number" && typeof c.longitude === "number",
  );

  useEffect(() => {
    let cancelled = false;
    if (mapped.length === 0) return;

    loadMaps()
      .then(() => {
        if (cancelled || !ref.current || !window.google?.maps) return;
        const g = window.google.maps;
        const map = new g.Map(ref.current, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        });
        const bounds = new g.LatLngBounds();
        const info = new g.InfoWindow();

        for (const c of mapped) {
          const pos = { lat: c.latitude, lng: c.longitude };
          const marker = new g.Marker({ position: pos, map, title: c.name });
          bounds.extend(pos);
          marker.addListener("click", () => {
            const members =
              c.memberCount != null ? `<div style="color:#6b7280;font-size:12px;margin-top:2px">${c.memberCount} members</div>` : "";
            info.setContent(
              `<div style="font-family:sans-serif;padding:2px 4px;max-width:200px">
                 <div style="font-weight:700;font-size:14px;color:#1a1610">${c.name}</div>
                 ${members}
                 <a href="/community/${c.slug}" style="display:inline-block;margin-top:6px;color:#3f6f4b;font-size:13px;font-weight:600;text-decoration:none">View community →</a>
               </div>`,
            );
            info.open(map, marker);
          });
        }

        map.fitBounds(bounds);
        // Don't zoom in absurdly close when there's a single marker.
        const listener = g.event.addListenerOnce(map, "idle", () => {
          if (map.getZoom() && map.getZoom()! > 13) map.setZoom(13);
        });
        void listener;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [mapped]);

  if (mapped.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No communities have a mapped location yet. Add a location when you create one and it&apos;ll show up here.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Couldn&apos;t load the map. Switch back to the list to browse communities.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={ref}
        className="w-full rounded-2xl border overflow-hidden"
        style={{ height: 380 }}
        aria-label="Map of communities"
      />
      <p className="text-xs text-muted-foreground text-center">
        Showing {mapped.length} {mapped.length === 1 ? "community" : "communities"} with a location · tap a pin for details
      </p>
    </div>
  );
}
