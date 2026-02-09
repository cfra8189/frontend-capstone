import React, { useEffect, useState } from "react";

// Public assets are served from the root. Use a static list of filenames
// located in `public/background_gif` so Vite serves them unchanged.
const gifs = [
  "/background_gif/Box1.gif",
  "/background_gif/Box2.gif",
  "/background_gif/Box3.gif",
  "/background_gif/Box4.gif",
  "/background_gif/Box5.gif",
];

export default function BackgroundGif({ opacity = 0.08 }: { opacity?: number }) {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!gifs || gifs.length === 0) return;

    // Pick an index that's different from the last one in this browser session
    const lastRaw = sessionStorage.getItem("bg_gif_last");
    const last = lastRaw ? parseInt(lastRaw, 10) : -1;
    let next = 0;
    if (gifs.length === 1) {
      next = 0;
    } else {
      const candidates = gifs.map((_, i) => i).filter((i) => i !== last);
      next = candidates[Math.floor(Math.random() * candidates.length)];
    }

    setIndex(next);
    sessionStorage.setItem("bg_gif_last", String(next));

    document.body.classList.add("has-bg-gif");
    return () => {
      document.body.classList.remove("has-bg-gif");
    };
  }, []);

  if (index === null) return null;
  const src = gifs[index];

  return (
    <div className="background-gif-container" aria-hidden="true">
      <img src={src} alt="" className="background-gif" style={{ opacity }} />
    </div>
  );
}
