import React, { useEffect, useState } from "react";

export default function TwitterEmbed({ url }: { url: string }) {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const oembedEndpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=1`;
        const proxy = `/api/oembed?url=${encodeURIComponent(oembedEndpoint)}`;
        const res = await fetch(proxy, { credentials: "include" });
        if (!res.ok) throw new Error(`oEmbed ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.html) {
          const html = String(data.html || "");
          // If proxy returned full page HTML, try extract og:image
          const isFullPage = /<html[\s>]/i.test(html);
          if (isFullPage) {
            const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
            if (m && m[1]) {
              setEmbedHtml(`<img src="${m[1]}" alt="Tweet image" />`);
              return;
            }
            setEmbedHtml(html);
            return;
          }
          setEmbedHtml(html);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load Twitter embed");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    if (!embedHtml) return;
    const scriptId = "twitter-widgets-js";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://platform.twitter.com/widgets.js";
      s.async = true;
      document.body.appendChild(s);
      s.onload = () => {
        // @ts-ignore
        if (window.twttr && window.twttr.widgets && window.twttr.widgets.load) {
          try { window.twttr.widgets.load(); } catch (e) { /* ignore */ }
        }
      };
    } else {
      // @ts-ignore
      if (window.twttr && window.twttr.widgets && window.twttr.widgets.load) {
        try { window.twttr.widgets.load(); } catch (e) { /* ignore */ }
      }
    }
  }, [embedHtml]);

  if (embedHtml) {
    return <div className="media-embed mb-3" dangerouslySetInnerHTML={{ __html: embedHtml }} />;
  }

  if (error) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-accent text-xs hover:underline block mb-3">
        {url.length > 60 ? url.substring(0, 60) + "..." : url} →
      </a>
    );
  }

  return null;
}
