import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";

interface StructureMarker {
    timestamp: number;
    label: string;
}

interface Comment {
    id: string;
    timestamp: number;
    text: string;
    createdAt: string;
}

interface TrackReviewData {
    trackName: string;
    key: string;
    bpm: number | string;
    audioUrl: string;
    lyrics: string;
    structureMarkers: StructureMarker[];
    comments: Comment[];
    folderId: string;
    lastModified: string;
}

export default function TrackReview() {
    const { user } = useAuth();
    const [location, setLocation] = useLocation();

    // Parse query params manually from URL
    const reviewId = new URLSearchParams(window.location.search).get("id");

    const audioRef = useRef<HTMLAudioElement>(null);

    const [trackName, setTrackName] = useState("");
    const [key, setKey] = useState("");
    const [bpm, setBpm] = useState<number | string>("");
    const [audioUrl, setAudioUrl] = useState("");
    const [lyrics, setLyrics] = useState("");
    const [structureMarkers, setStructureMarkers] = useState<StructureMarker[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [selectedFolder, setSelectedFolder] = useState("");
    const [folders, setFolders] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadFolders();
        if (reviewId) {
            loadReview(reviewId);
        }
    }, [reviewId]);

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
            }
        } catch (error) {
            console.error("Failed to load review:", error);
        }
    }

    function loadAudio() {
        if (audioRef.current && audioUrl) {
            audioRef.current.src = audioUrl;
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
        setStructureMarkers([...structureMarkers, { timestamp, label }]);
    }

    function removeStructureMarker(index: number) {
        setStructureMarkers(structureMarkers.filter((_, i) => i !== index));
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
            alert("Please enter a track name");
            return;
        }
        if (!selectedFolder) {
            alert("Please select a folder");
            return;
        }

        setSaving(true);
        try {
            const reviewData: TrackReviewData = {
                trackName,
                key,
                bpm,
                audioUrl,
                lyrics,
                structureMarkers,
                comments,
                folderId: selectedFolder,
                lastModified: new Date().toISOString(),
            };

            const res = await fetch("/api/track-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reviewData),
            });

            if (res.ok) {
                const data = await res.json();
                alert("Track review saved successfully!");
                if (!reviewId && data.reviewId) {
                    setLocation(`/track-review?id=${data.reviewId}`);
                }
            } else {
                alert("Failed to save track review");
            }
        } catch (error) {
            console.error("Failed to save review:", error);
            alert("Failed to save track review");
        } finally {
            setSaving(false);
        }
    }

    async function exportReview() {
        if (!reviewId) {
            alert("Please save the review first");
            return;
        }

        try {
            const res = await fetch(`/api/track-review/${reviewId}/export`);
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
            alert("Failed to export review");
        }
    }

    return (
        <div className="flex flex-col h-screen bg-theme-primary overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-theme/10 bg-theme-primary/5">
                <div>
                    <h1 className="text-sm font-bold uppercase tracking-[0.3em] text-theme-primary">Track Review</h1>
                    <p className="text-[9px] text-theme-muted uppercase tracking-widest opacity-60">Audio Analysis & Notes</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportReview}
                        disabled={!reviewId}
                        className="bg-theme-secondary/30 text-theme-primary border border-theme/20 text-[9px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest hover:bg-theme-secondary transition-all disabled:opacity-50"
                    >
                        Export
                    </button>
                    <button
                        onClick={saveReview}
                        disabled={saving}
                        className="bg-accent/10 text-accent border border-accent/20 text-[9px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest hover:bg-accent hover:text-theme-primary transition-all disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                        onClick={() => setLocation("/creative")}
                        className="bg-theme-secondary/30 text-theme-muted border border-theme/20 text-[9px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest hover:bg-theme-secondary hover:text-theme-primary transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Track Info */}
                    <div className="bg-theme-secondary/40 border border-theme p-4 rounded-sm">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3">Track Info</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Track Name *</label>
                                <input
                                    type="text"
                                    value={trackName}
                                    onChange={(e) => setTrackName(e.target.value)}
                                    className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors"
                                    placeholder="Enter track name..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Key</label>
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors"
                                    placeholder="e.g., C# Minor"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-widest">BPM</label>
                                <input
                                    type="number"
                                    value={bpm}
                                    onChange={(e) => setBpm(e.target.value)}
                                    className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors"
                                    placeholder="e.g., 140"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Audio Player */}
                    <div className="bg-theme-secondary/40 border border-theme p-4 rounded-sm">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3">Audio Player</h2>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={audioUrl}
                                    onChange={(e) => setAudioUrl(e.target.value)}
                                    className="flex-1 bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors"
                                    placeholder="Paste audio URL (Google Drive, Dropbox, SoundCloud, etc.)"
                                />
                                <button
                                    onClick={loadAudio}
                                    className="bg-accent/10 text-accent border border-accent/20 text-[9px] font-bold px-4 py-2 rounded-sm uppercase tracking-widest hover:bg-accent hover:text-theme-primary transition-all"
                                >
                                    Load
                                </button>
                            </div>
                            <audio
                                ref={audioRef}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="hidden"
                            />
                            <div className="bg-theme-primary/50 p-4 rounded-sm border border-theme/20">
                                <div className="flex items-center gap-4 mb-3">
                                    <button
                                        onClick={togglePlay}
                                        disabled={!audioUrl}
                                        className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center hover:bg-accent hover:text-theme-primary transition-all disabled:opacity-50"
                                    >
                                        <span className="text-accent text-xl">{isPlaying ? "⏸" : "▶"}</span>
                                    </button>
                                    <div className="flex-1">
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 0}
                                            value={currentTime}
                                            onChange={(e) => seekTo(parseFloat(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-[10px] text-theme-muted font-mono mt-1">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Structure Markers */}
                    <div className="bg-theme-secondary/40 border border-theme p-4 rounded-sm">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3">Song Structure</h2>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {["Intro", "Verse", "Pre-Chorus", "Hook", "Chorus", "Bridge", "Outro"].map((label) => (
                                <button
                                    key={label}
                                    onClick={() => markStructure(label)}
                                    className="bg-theme-primary border border-theme/20 text-theme-primary text-[9px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest hover:border-accent hover:text-accent transition-all"
                                >
                                    + {label}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {structureMarkers.sort((a, b) => a.timestamp - b.timestamp).map((marker, index) => (
                                <div key={index} className="flex items-center justify-between bg-theme-primary/50 p-2 rounded-sm border border-theme/10">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => seekTo(marker.timestamp)}
                                            className="text-[10px] font-mono text-accent hover:underline"
                                        >
                                            {formatTime(marker.timestamp)}
                                        </button>
                                        <span className="text-xs text-theme-primary font-bold uppercase tracking-wide">{marker.label}</span>
                                    </div>
                                    <button
                                        onClick={() => removeStructureMarker(index)}
                                        className="text-theme-muted hover:text-red-500 text-sm"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lyrics */}
                    <div className="bg-theme-secondary/40 border border-theme p-4 rounded-sm">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3">Lyrics</h2>
                        <textarea
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            rows={12}
                            className="w-full bg-theme-primary border border-theme p-3 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors resize-none"
                            placeholder="Write or paste lyrics here..."
                        />
                    </div>

                    {/* Comments */}
                    <div className="bg-theme-secondary/40 border border-theme p-4 rounded-sm">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3">Timestamped Notes</h2>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && addComment()}
                                className="flex-1 bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors"
                                placeholder="Add note... (use @mentions for collaborators)"
                            />
                            <button
                                onClick={addComment}
                                className="bg-accent/10 text-accent border border-accent/20 text-[9px] font-bold px-4 py-2 rounded-sm uppercase tracking-widest hover:bg-accent hover:text-theme-primary transition-all"
                            >
                                Add Note
                            </button>
                        </div>
                        <div className="space-y-2">
                            {comments.sort((a, b) => a.timestamp - b.timestamp).map((comment) => (
                                <div key={comment.id} className="flex items-start justify-between bg-theme-primary/50 p-3 rounded-sm border border-theme/10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <button
                                                onClick={() => seekTo(comment.timestamp)}
                                                className="text-[10px] font-mono text-accent hover:underline"
                                            >
                                                {formatTime(comment.timestamp)}
                                            </button>
                                            <span className="text-[9px] text-theme-muted">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-theme-primary whitespace-pre-wrap">{comment.text}</p>
                                    </div>
                                    <button
                                        onClick={() => removeComment(comment.id)}
                                        className="text-theme-muted hover:text-red-500 text-sm ml-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save Section */}
                    <div className="bg-theme-secondary/40 border border-theme p-4 rounded-sm">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3">Save Location</h2>
                        <div>
                            <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Select Folder *</label>
                            <select
                                value={selectedFolder}
                                onChange={(e) => setSelectedFolder(e.target.value)}
                                className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors"
                            >
                                <option value="">-- Select a folder --</option>
                                {folders.map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
