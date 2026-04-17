"use client";

import { useRef, useState, useEffect } from "react";

type Props = {
  src: string;
  label?: string;
};

function formatTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, label }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => { setLoading(false); setFailed(false); };
    const onError = () => { setLoading(false); setPlaying(false); setFailed(true); };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
    };
  }, []);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      await audio.play();
      setPlaying(true);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const val = parseFloat(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (failed) {
    return (
      <div className="rounded-2xl border bg-card p-5 space-y-2">
        {label && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
        )}
        <p className="text-sm text-muted-foreground">Audio unavailable. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      {label && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      )}

      {/* Waveform-style decoration */}
      <div className="flex items-center gap-[3px] h-8 opacity-40" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => {
          const h = [40, 55, 70, 90, 75, 60, 85, 95, 65, 50,
                     80, 70, 55, 90, 100, 75, 60, 85, 70, 55,
                     90, 80, 65, 75, 85, 70, 60, 95, 80, 65,
                     55, 75, 90, 70, 60, 85, 75, 65, 55, 45][i];
          const filled = (i / 40) * 100 <= progress;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-colors ${
                filled ? "bg-primary" : "bg-muted-foreground"
              }`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Play/pause button */}
        <button
          onClick={togglePlay}
          className="shrink-0 size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label={playing ? "Pause" : "Play"}
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          ) : playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Seek slider + times */}
        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 appearance-none rounded-full bg-muted cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
