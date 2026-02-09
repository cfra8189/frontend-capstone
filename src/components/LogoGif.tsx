import React, { useEffect, useState } from "react";

const gifs = [
  "/background_gif/Box1.gif",
  "/background_gif/Box2.gif",
  "/background_gif/Box3.gif",
  "/background_gif/Box4.gif",
  "/background_gif/Box5.gif",
];

export default function LogoGif({ className = "", alt = "BOX logo" }: { className?: string; alt?: string }) {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!gifs.length) return;
    const lastRaw = sessionStorage.getItem("bg_logo_last");
    const last = lastRaw ? parseInt(lastRaw, 10) : -1;
    let next = 0;
    if (gifs.length === 1) next = 0;
    else {
      const candidates = gifs.map((_, i) => i).filter((i) => i !== last);
      next = candidates[Math.floor(Math.random() * candidates.length)];
    }
    setIndex(next);
    sessionStorage.setItem("bg_logo_last", String(next));
  }, []);

  if (index === null) return <img src="/box-logo.png" alt={alt} className={className} />;

  return <img src={gifs[index]} alt={alt} className={className} />;
}
