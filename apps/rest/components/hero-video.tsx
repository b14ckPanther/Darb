"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideo({
  label,
  pauseLabel,
  playLabel,
  src,
}: {
  label: string;
  pauseLabel: string;
  playLabel: string;
  src: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion) void video.play().catch(() => setPlaying(false));
  }, []);

  function togglePlayback(): void {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        aria-label={label}
        loop
        muted
        playsInline
        preload="metadata"
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <button type="button" className="hero-video-control" onClick={togglePlayback}>
        {playing ? pauseLabel : playLabel}
      </button>
    </>
  );
}
