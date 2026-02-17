import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/use-auth";
import { useNotifications } from "../components/Notifications";
import { X, Save, Download, Play, Pause, Plus, Trash2, Mic2, Music, Loader2 } from "lucide-react";

interface StructureMarker {
    timestamp: number;
    label: string;
    lyrics: string;
}

interface Comment {
    id: string;
    timestamp: number;
    text: string;
    createdAt: string;
}

interface TrackReviewData {
    reviewId?: string;
    trackName: string;
    key: string;
    bpm: number | string;
    audioUrl: string;
    lyrics: string;
    structureMarkers: StructureMarker[];
    comments: Comment[];
    folderId: string;
    updatedAt?: string;
}

interface TrackReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reviewId?: string | null;
    initialFolderId?: string;
}

export default function TrackReviewModal({ isOpen, onClose, reviewId, initialFolderId }: TrackReviewModalProps) {
    const { user } = useAuth();
    const { success, error: notifyError } = useNotifications();

    const audioRef = useRef<HTMLAudioElement>(null);

    const [trackName, setTrackName] = useState("");
    const [key, setKey] = useState("");
    const [bpm, setBpm] = useState<number | string>("");
    const [audioUrl, setAudioUrl] = useState("");
    const [lyrics, setLyrics] = useState("");
    const [structureMarkers, setStructureMarkers] = useState<StructureMarker[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [selectedFolder, setSelectedFolder] = useState(initialFolderId || "");
    const [folders, setFolders] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [saving, setSaving] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);

    const [currentReviewId, setCurrentReviewId] = useState<string | null>(reviewId || null);

    useEffect(() => {
        if (isOpen) {
            loadFolders();
            if (reviewId) {
                loadReview(reviewId);
            } else {
                resetForm();
                if (initialFolderId) setSelectedFolder(initialFolderId);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, [isOpen, reviewId, initialFolderId]);

    function resetForm() {
        setTrackName("");
        setKey("");
        setBpm("");
        setAudioUrl("");
        setLyrics("");
        setStructureMarkers([]);
        setComments([]);
        setCommentInput("");
        setCurrentReviewId(null);
        if (!initialFolderId) setSelectedFolder("");
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setAudioLoading(false);
        if (audioRef.current) {
            audioRef.current.src = "";
        }
    }

    async function loadFolders() {
        try {
            const res = await fetch("/api/folders");
            if (res.ok) {
                const data = await res.json();
                setFolders(data.folders || []);
            }
        } catch (error) {
            console.error("Failed to load folders:", error);
        }
    }

    async function loadReview(id: string) {
        try {
            const res = await fetch(`/api/track-review/${id}`);
            if (res.ok) {
                const data: TrackReviewData = await res.json();
                setTrackName(data.trackName || "");
                setKey(data.key || "");
                setBpm(data.bpm || "");
                setAudioUrl(data.audioUrl || "");
                setLyrics(data.lyrics || "");
                setStructureMarkers(data.structureMarkers || []);
                setComments(data.comments || []);
                setSelectedFolder(data.folderId || "");
                setCurrentReviewId(id);
                if (data.audioUrl) {
                    setTimeout(() => loadAudio(data.audioUrl), 500);
                }
            }
        } catch (error) {
            console.error("Failed to load review:", error);
            notifyError("Failed to load review data");
        }
    }

    function resolveAudioSrc(url: string): string {
        // Route Google Drive links through our backend proxy to avoid CORS
        if (url.includes("drive.google.com")) {
            return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
        }
        return url;
    }

    function loadAudio(urlOverride?: string) {
        const srcToLoad = urlOverride || audioUrl;
        if (audioRef.current && srcToLoad) {
            setAudioLoading(true);
            const resolvedSrc = resolveAudioSrc(srcToLoad);
            audioRef.current.src = resolvedSrc;
            audioRef.current.load();
        }
    }

    function togglePlay() {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }

    function handleTimeUpdate() {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }

    function handleLoadedMetadata() {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setAudioLoading(false);
        }
    }

    function seekTo(time: number) {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }

    function markStructure(label: string) {
        const timestamp = audioRef.current?.currentTime || 0;
        setStructureMarkers([...structureMarkers, { timestamp, label, lyrics: "" }]);
    }

    function removeStructureMarker(index: number) {
        setStructureMarkers(structureMarkers.filter((_, i) => i !== index));
    }

    function updateSectionLyrics(index: number, lyrics: string) {
        const updated = [...structureMarkers];
        updated[index].lyrics = lyrics;
        setStructureMarkers(updated);
    }

    function addComment() {
        if (!commentInput.trim()) return;
        const timestamp = audioRef.current?.currentTime || 0;
        const newComment: Comment = {
            id: crypto.randomUUID(),
            timestamp,
            text: commentInput,
            createdAt: new Date().toISOString(),
        };
        setComments([...comments, newComment]);
        setCommentInput("");
    }

    function removeComment(id: string) {
        setComments(comments.filter(c => c.id !== id));
    }

    async function saveReview() {
        if (!trackName.trim()) {
            notifyError("Please enter a track name");
            return;
        }
        if (!selectedFolder) {
            notifyError("Please select a folder");
            return;
        }

        setSaving(true);
        try {
            const reviewData: TrackReviewData = {
                reviewId: currentReviewId || undefined,
                trackName,
                key,
                bpm,
                audioUrl,
                lyrics,
                structureMarkers,
                comments,
                folderId: selectedFolder,
            };

            const res = await fetch("/api/track-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reviewData),
            });

            if (res.ok) {
                const data = await res.json();
                success("Track review saved successfully!");
                if (!currentReviewId && data.reviewId) {
                    setCurrentReviewId(data.reviewId);
                }
            } else {
                notifyError("Failed to save track review");
            }
        } catch (error) {
            console.error("Failed to save review:", error);
            notifyError("Failed to save track review");
        } finally {
            setSaving(false);
        }
    }

    async function exportReview() {
        if (!currentReviewId) {
            notifyError("Please save the review first");
            return;
        }

        try {
            const res = await fetch(`/api/track-review/${currentReviewId}/export`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${trackName || "track-review"}.txt`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Failed to export review:", error);
            notifyError("Failed to export review");
        }
    }

    if (!isOpen) return null;

    const sectionLabels = ["Intro", "Verse", "Pre-Chorus", "Hook", "Chorus", "Bridge", "Outro"];

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-start justify-center overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-theme-secondary border border-theme w-full max-w-4xl my-6 mx-4 flex flex-col shadow-2xl rounded-sm relative"
                onClick={(e) => e.stopPropagation()}
                style={{ minHeight: "min(85vh, 700px)" }}
            >

                {/* ═══ Header ═══ */}
                <div className="flex items-center justify-between p-4 border-b border-theme/30 bg-theme-primary/20 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-theme-primary/40 border border-theme/20 flex items-center justify-center">
                            <Mic2 className="text-theme-primary" size={16} />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-theme-primary">Track Review</h1>
                            <p className="text-[10px] text-theme-muted uppercase tracking-widest">Audio Analysis & Notes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportReview}
                            disabled={!currentReviewId}
                            className="flex items-center gap-1.5 bg-theme-primary/10 text-theme-secondary border border-theme/20 text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest hover:bg-theme-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Download size={11} />
                            Export
                        </button>
                        <button
                            onClick={saveReview}
                            disabled={saving}
                            className="flex items-center gap-1.5 bg-theme-primary text-theme-secondary text-[10px] font-bold px-4 py-1.5 rounded-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            <Save size={11} />
                            {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={onClose}
                            className="ml-1 w-7 h-7 flex items-center justify-center rounded-sm text-theme-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ═══ Scrollable Content ═══ */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ maxHeight: "calc(90vh - 72px)" }}>

                    {/* ── Track Info & Location Row ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Track Info */}
                        <div className="bg-theme-primary/20 border border-theme/15 p-4 rounded-sm">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-3 flex items-center gap-2">
                                <Music size={10} /> Track Info
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[9px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Track Name *</label>
                                    <input
                                        type="text"
                                        value={trackName}
                                        onChange={(e) => setTrackName(e.target.value)}
                                        className="placeholder-dark w-full bg-theme-secondary border border-theme/30 p-2.5 text-sm font-mono text-theme-primary outline-none focus:border-theme-primary transition-all rounded-sm"
                                        placeholder="Enter track name..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Key</label>
                                        <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => setKey(e.target.value)}
                                            className="placeholder-dark w-full bg-theme-secondary border border-theme/30 p-2.5 text-sm font-mono text-theme-primary outline-none focus:border-theme-primary transition-all rounded-sm"
                                            placeholder="C# Min"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-theme-muted mb-1 uppercase tracking-widest">BPM</label>
                                        <input
                                            type="number"
                                            value={bpm}
                                            onChange={(e) => setBpm(e.target.value)}
                                            className="placeholder-dark w-full bg-theme-secondary border border-theme/30 p-2.5 text-sm font-mono text-theme-primary outline-none focus:border-theme-primary transition-all rounded-sm"
                                            placeholder="140"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Location */}
                        <div className="bg-theme-primary/20 border border-theme/15 p-4 rounded-sm flex flex-col">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-3 flex items-center gap-2">
                                <Music size={10} /> Save Location
                            </h2>
                            <div className="flex-1 flex flex-col justify-center">
                                <label className="block text-[9px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Select Folder *</label>
                                <select
                                    value={selectedFolder}
                                    onChange={(e) => setSelectedFolder(e.target.value)}
                                    className="placeholder-dark w-full bg-theme-secondary border border-theme/30 p-2.5 text-sm font-mono text-theme-primary outline-none focus:border-theme-primary transition-all rounded-sm appearance-none cursor-pointer"
                                >
                                    <option value="">-- Select Folder --</option>
                                    {folders.map((folder) => (
                                        <option key={folder.id} value={folder.id}>
                                            {folder.path || folder.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Audio Player ── */}
                    <div className="bg-theme-primary/20 border border-theme/15 p-4 rounded-sm">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-3 flex items-center gap-2">
                            <Music size={10} /> Audio Source
                        </h2>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={audioUrl}
                                    onChange={(e) => setAudioUrl(e.target.value)}
                                    className="placeholder-dark flex-1 bg-theme-secondary border border-theme/30 p-2.5 text-sm font-mono text-theme-primary outline-none focus:border-theme-primary transition-all rounded-sm"
                                    placeholder="Paste audio URL or Google Drive link..."
                                />
                                <button
                                    onClick={() => loadAudio()}
                                    disabled={!audioUrl || audioLoading}
                                    className="bg-theme-primary text-theme-secondary text-[10px] font-bold px-4 py-2 rounded-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                                >
                                    {audioLoading ? <Loader2 size={11} className="animate-spin" /> : null}
                                    Load
                                </button>
                            </div>

                            <audio
                                ref={audioRef}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onError={() => {
                                    setAudioLoading(false);
                                    notifyError("Failed to load audio. Check the URL or try a direct link.");
                                }}
                                onCanPlay={() => setAudioLoading(false)}
                                className="hidden"
                                crossOrigin="anonymous"
                            />

                            {/* Player Controls */}
                            <div className="bg-theme-primary/30 p-3 rounded-sm border border-theme/10">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={togglePlay}
                                        disabled={!audioUrl || audioLoading}
                                        className="w-9 h-9 rounded-full bg-theme-primary/20 border border-theme/20 flex items-center justify-center hover:bg-theme-primary/40 transition-all disabled:opacity-30 flex-shrink-0 text-theme-primary"
                                    >
                                        {audioLoading ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : isPlaying ? (
                                            <Pause size={14} />
                                        ) : (
                                            <Play size={14} className="ml-0.5" />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 0}
                                            value={currentTime}
                                            onChange={(e) => seekTo(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-theme-secondary rounded-lg appearance-none cursor-pointer accent-[var(--text-primary)]"
                                        />
                                        <div className="flex justify-between text-[9px] text-theme-muted font-mono mt-1">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Structure & Lyrics ── */}
                    <div className="bg-theme-primary/20 border border-theme/15 p-4 rounded-sm">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-3 flex items-center gap-2">
                            <Music size={10} /> Structure & Lyrics
                        </h2>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {sectionLabels.map((label) => (
                                <button
                                    key={label}
                                    onClick={() => markStructure(label)}
                                    className="flex items-center gap-1 bg-theme-secondary border border-theme/20 text-theme-primary text-[9px] font-bold px-2.5 py-1.5 rounded-sm uppercase tracking-widest hover:border-theme-primary/40 hover:bg-theme-primary/10 transition-all"
                                >
                                    <Plus size={9} /> {label}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {structureMarkers.length === 0 ? (
                                <div className="text-center py-10 text-theme-muted border border-dashed border-theme/20 rounded-sm">
                                    <p className="uppercase tracking-widest text-xs mb-1">No Structure Markers</p>
                                    <p className="text-[10px] opacity-50">Click tags above to mark sections at the current timestamp</p>
                                </div>
                            ) : (
                                structureMarkers.sort((a, b) => a.timestamp - b.timestamp).map((marker, index) => (
                                    <div key={index} className="bg-theme-primary/30 p-3 rounded-sm border border-theme/10 group hover:border-theme/25 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => seekTo(marker.timestamp)}
                                                    className="text-[10px] font-mono text-theme-secondary hover:text-theme-primary flex items-center gap-1 transition-colors"
                                                >
                                                    <Play size={8} /> {formatTime(marker.timestamp)}
                                                </button>
                                                <span className="text-[10px] text-theme-primary font-bold uppercase tracking-wide bg-theme-secondary/60 px-2 py-0.5 rounded-sm">{marker.label}</span>
                                            </div>
                                            <button
                                                onClick={() => removeStructureMarker(index)}
                                                className="text-theme-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <textarea
                                            value={marker.lyrics}
                                            onChange={(e) => updateSectionLyrics(index, e.target.value)}
                                            rows={3}
                                            className="placeholder-dark w-full bg-theme-secondary/40 border border-theme/15 p-2.5 text-xs font-mono text-theme-primary outline-none focus:border-theme-primary/40 transition-all resize-none rounded-sm"
                                            placeholder={`Write lyrics for ${marker.label}...`}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Time-synced Notes ── */}
                    <div className="bg-theme-primary/20 border border-theme/15 p-4 rounded-sm">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-3 flex items-center gap-2">
                            <Music size={10} /> Time-synced Notes
                        </h2>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addComment()}
                                className="placeholder-dark flex-1 bg-theme-secondary border border-theme/30 p-2.5 text-sm font-mono text-theme-primary outline-none focus:border-theme-primary transition-all rounded-sm"
                                placeholder="Add note at current timestamp..."
                            />
                            <button
                                onClick={addComment}
                                disabled={!commentInput.trim()}
                                className="bg-theme-primary text-theme-secondary text-[10px] font-bold px-4 py-2 rounded-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {comments.length === 0 ? (
                                <div className="text-center py-6 text-theme-muted border border-dashed border-theme/20 rounded-sm">
                                    <p className="text-[10px] opacity-50">No notes yet — type above and press Enter to add a note</p>
                                </div>
                            ) : (
                                comments.sort((a, b) => a.timestamp - b.timestamp).map((comment) => (
                                    <div key={comment.id} className="flex items-start justify-between bg-theme-primary/30 p-2.5 rounded-sm border border-theme/10 group hover:border-theme/25 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <button
                                                    onClick={() => seekTo(comment.timestamp)}
                                                    className="text-[10px] font-mono text-theme-secondary hover:text-theme-primary transition-colors"
                                                >
                                                    {formatTime(comment.timestamp)}
                                                </button>
                                                <span className="text-[9px] text-theme-muted opacity-50">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-theme-primary">{comment.text}</p>
                                        </div>
                                        <button
                                            onClick={() => removeComment(comment.id)}
                                            className="text-theme-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2 flex-shrink-0"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
