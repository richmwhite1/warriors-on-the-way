"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    google?: typeof google;
    _googleMapsCallback?: () => void;
  }
}

type Props = {
  name: string;
  id?: string;
  defaultValue?: string;
  defaultUrl?: string;
  placeholder?: string;
  className?: string;
};

let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;
  if (window.google?.maps?.places) return Promise.resolve();

  scriptLoadPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=_googleMapsCallback`;
    script.async = true;
    script.defer = true;
    window._googleMapsCallback = () => {
      delete window._googleMapsCallback;
      resolve();
    };
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function PlacesAutocomplete({
  name,
  id,
  defaultValue = "",
  defaultUrl = "",
  placeholder,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [value, setValue] = useState(defaultValue);
  const [mapsUrl, setMapsUrl] = useState(defaultUrl);
  const [loaded, setLoaded] = useState(false);

  // Google's documented cross-platform URL: it opens the Maps app on iOS and
  // Android rather than bouncing through a web redirect. Pairing the query text
  // with query_place_id pins the exact place instead of a fuzzy search, which is
  // what makes lakes, trailheads and other non-street locations resolve at all.
  const updateMapsUrl = useCallback((place?: google.maps.places.PlaceResult) => {
    const query = place?.formatted_address || place?.name;
    if (query) {
      const params = new URLSearchParams({ api: "1", query });
      if (place?.place_id) params.set("query_place_id", place.place_id);
      setMapsUrl(`https://www.google.com/maps/search/?${params.toString()}`);
    } else if (place?.url) {
      setMapsUrl(place.url);
    }
  }, []);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setLoaded(true))
      .catch(() => {
        // Silently degrade — input still works as plain text
      });
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "name", "url", "place_id", "geometry"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place?.name) {
        const display = place.formatted_address
          ? `${place.name}, ${place.formatted_address}`
          : place.name;
        setValue(display);
        updateMapsUrl(place);
      }
    });

    autocompleteRef.current = ac;
  }, [loaded, updateMapsUrl]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        name={name}
        id={id}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setMapsUrl("");
        }}
        placeholder={placeholder}
        className={
          className ??
          "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        }
        autoComplete="off"
      />
      {/* Hidden field to pass the Google Maps URL alongside the location text */}
      <input type="hidden" name="location_url" value={mapsUrl} />
    </div>
  );
}
