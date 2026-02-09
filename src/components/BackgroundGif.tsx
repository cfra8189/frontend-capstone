import React, { useEffect } from "react";

// Public assets are served from the root. Use a static list of filenames
// located in `public/background_gif` so Vite serves them unchanged.
const gifs = [
  "/background_gif/Box1.gif",
  "/background_gif/Box2.gif",
  "/background_gif/Box3.gif",
  "/background_gif/Box4.gif",
  "/background_gif/Box5.gif",
];

function pickRandom(list: string[]) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export default function BackgroundGif({ opacity = 0.08 }: { opacity?: number }) {
  const src = pickRandom(gifs);
  if (!src) return null;

  useEffect(() => {
    document.body.classList.add("has-bg-gif");
    return () => {
      document.body.classList.remove("has-bg-gif");
    };
  }, []);

  return (
    <div className="background-gif-container" aria-hidden="true">
      <img src={src} alt="" className="background-gif" style={{ opacity }} />
    </div>
  );
}
