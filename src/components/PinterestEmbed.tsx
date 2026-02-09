import React, { useEffect, useState } from "react";

function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

export default function PinterestEmbed({ url }: { url: string }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const proxy = `/api/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxy, { credentials: "include" });
        if (!res.ok) throw new Error(`oEmbed ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.thumbnail_url) {
          setThumbnail(data.thumbnail_url);
          return;
        }
        if (data.html) {
          const html = String(data.html || "");
          const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/i);
          if (m && m[1]) { setThumbnail(m[1]); return; }
          const imgTag = html.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgTag && imgTag[1]) { setThumbnail(imgTag[1]); return; }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [url]);

  if (thumbnail) {
    return (
      <div className="media-embed mb-3">
        <img src={thumbnail} alt="Pinterest" loading="lazy" />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-accent text-xs hover:underline block mb-3">
      {url.length > 60 ? url.substring(0, 60) + "..." : url} →
    </a>
  );
}
