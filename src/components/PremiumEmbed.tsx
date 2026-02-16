import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EmbedData {
    thumbnail_url?: string;
    title?: string;
    author_name?: string;
    provider_name?: string;
    html?: string;
    type?: string;
}

interface PremiumEmbedProps {
    url: string;
}

export default function PremiumEmbed({ url }: PremiumEmbedProps) {
    const [data, setData] = useState<EmbedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(false);
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

    const isVideo = data.type === "video" || !!data.html;
    const isPinterest = url.includes("pin.it") || url.includes("pinterest");
    const isTwitter = url.includes("twitter.com") || url.includes("x.com");

    useEffect(() => {
        if (!loading && data?.html) {
            // Pinterest re-parsing
            if (isPinterest && (window as any).PinUtils) {
                (window as any).PinUtils.build();
            }

            // Twitter re-parsing
            if (isTwitter) {
                if ((window as any).twttr && (window as any).twttr.widgets) {
                    (window as any).twttr.widgets.load();
                } else {
                    const script = document.createElement("script");
                    script.src = "https://platform.twitter.com/widgets.js";
                    script.async = true;
                    document.body.appendChild(script);
                }
            }
        }
    }, [loading, data, isPinterest, isTwitter]);

    // Load Pinterest SDK if needed
    useEffect(() => {
        if (isPinterest && !(window as any).PinUtils) {
            const script = document.createElement("script");
            script.src = "//assets.pinterest.com/js/pinit.js";
            script.async = true;
            script.setAttribute("data-pin-build", "PinUtils.build");
            document.body.appendChild(script);
        }
    }, [isPinterest]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative overflow-hidden rounded-xl bg-theme-tertiary/20 border border-white/5 hover:border-accent/30 transition-all duration-500 mb-4 backdrop-blur-md shadow-2xl ${isPinterest ? 'max-w-md mx-auto' : ''}`}
        >
            {/* Media Content */}
            <div className={`relative overflow-hidden ${isVideo && !isPinterest && !isTwitter ? 'aspect-video' : 'aspect-auto min-h-[100px]'}`}>
                {data.thumbnail_url && !data.html ? (
                    <img
                        src={data.thumbnail_url}
                        alt={data.title || "Social Media Content"}
                        className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                    />
                ) : data.html ? (
                    <div
                        className={`w-full preview-html [&>iframe]:w-full [&>iframe]:aspect-video ${isPinterest ? 'flex justify-center p-4' : ''}`}
                        dangerouslySetInnerHTML={{ __html: data.html }}
                    />
                ) : (
                    <div className="p-8 text-center text-theme-muted text-xs italic">
                        Visual content not available
                    </div>
                )}

                {/* Overlay for Pinterest/Images */}
                {(!isVideo || isPinterest) && !data.html && (
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
