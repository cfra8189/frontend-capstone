import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EmbedData {
    thumbnail_url?: string;
    title?: string;
    author_name?: string;
    provider_name?: string;
    html?: string;
    type?: string;
    video_url?: string;
}

interface PremiumEmbedProps {
    url: string;
}

export default function PremiumEmbed({ url }: PremiumEmbedProps) {
    const [data, setData] = useState<EmbedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const isPinterest = url.includes("pin.it") || url.includes("pinterest");
    const isTwitter = url.includes("twitter.com") || url.includes("x.com");
    const isDirectMedia = /\.(jpg|jpeg|png|gif|webp|mp4|webm)(\?.*)?$/i.test(url);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(false);

            // For direct media links (images/gifs/videos), skip the oembed fetch entirely
            if (isDirectMedia) {
                const isVideo = /\.(mp4|webm)(\?.*)?$/i.test(url);
                if (!cancelled) {
                    setData({
                        thumbnail_url: isVideo ? undefined : url,
                        html: isVideo ? `<video src="${url}" controls autoplay loop muted playsinline class="w-full rounded-lg"></video>` : undefined,
                        type: isVideo ? "video" : "image",
                        provider_name: "Direct Media",
                    });
                    setLoading(false);
                }
                return;
            }

            try {
                const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
                if (!res.ok) throw new Error("Failed to load");
                const json = await res.json();
                if (!cancelled) {
                    setData(json);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(true);
                    setLoading(false);
                }
            }
        }
        load();
        return () => { cancelled = true; };
    }, [url]);

    useEffect(() => {
        if (!loading && data?.html && !isPinterest) {
            // Twitter re-parsing
            if (isTwitter) {
                if ((window as any).twttr && (window as any).twttr.widgets) {
                    (window as any).twttr.widgets.load();
                } else if (!document.querySelector('script[src*="twitter.com/widgets.js"]')) {
                    const script = document.createElement("script");
                    script.src = "https://platform.twitter.com/widgets.js";
                    script.async = true;
                    document.body.appendChild(script);
                }
            }
        }
    }, [loading, data, isPinterest, isTwitter]);

    if (loading) {
        return (
            <div className="relative overflow-hidden rounded-xl bg-theme-tertiary/20 aspect-video mb-4 border border-white/5 backdrop-blur-sm">
                <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                    <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-white/10 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block p-4 rounded-xl bg-theme-tertiary/20 border border-white/5 hover:border-accent/30 transition-colors mb-4 group"
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs text-theme-muted truncate mr-2">{url}</span>
                    <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
                </div>
            </a>
        );
    }

    // Pinterest: ALWAYS show thumbnail image, never the widget HTML (pinit.js is CSP-blocked)
    // Direct media: show the image or video directly
    const forceThumbnail = isPinterest || isDirectMedia;
    const hasThumbnail = !!data.thumbnail_url;
    const isVideo = !forceThumbnail && (data.type === "video" || !!data.html);
    const isImage = forceThumbnail ? hasThumbnail : (data.type === "image" || (!data.html && hasThumbnail));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative overflow-hidden rounded-xl bg-theme-tertiary/20 border border-white/5 hover:border-accent/30 transition-all duration-500 mb-4 shadow-2xl will-change-transform ${isPinterest ? 'max-w-md mx-auto' : ''}`}
        >
            {/* Media Content */}
            <div className={`relative overflow-hidden ${isVideo && !isTwitter ? 'aspect-video' : 'aspect-auto min-h-[100px]'}`}>
                {/* Direct video or Pinterest Video */}
                {(isVideo || (isPinterest && data.video_url)) && !isTwitter ? (
                    <video
                        src={data.video_url || url}
                        poster={data.thumbnail_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls={false}
                        className="w-full h-full object-cover pointer-events-none"
                    />
                ) : isImage && data.thumbnail_url ? (
                    <a href={url} target="_blank" rel="noreferrer">
                        <img
                            src={data.thumbnail_url}
                            alt={data.title || "Image content"}
                            className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                        />
                    </a>
                ) : data.html && !forceThumbnail ? (
                    <div
                        className={`w-full preview-html [&>iframe]:w-full [&>iframe]:aspect-video`}
                        dangerouslySetInnerHTML={{ __html: data.html }}
                    />
                ) : (
                    <div className="p-8 text-center text-theme-muted text-xs italic">
                        Visual content not available
                    </div>
                )}

                {/* Gradient overlay on hover */}
                {isImage && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                )}
            </div>

            {/* Info Bar */}
            <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/5">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate mb-0.5">
                            {data.title || (isPinterest ? "Pinterest Content" : isTwitter ? "Post" : "Shared Link")}
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-accent uppercase tracking-wider font-semibold">
                                {data.provider_name || (isPinterest ? "Pinterest" : isTwitter ? "Twitter" : "Social")}
                            </span>
                            {data.author_name && (
                                <span className="text-[10px] text-theme-muted truncate">
                                    by {data.author_name}
                                </span>
                            )}
                        </div>
                    </div>
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-black transition-all duration-300"
                    >
                        <span className="text-sm">→</span>
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
