import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/use-auth";
import { useNotifications } from "../components/Notifications"; // Assuming usage of the notification system
import { X, Save, Download, Play, Pause, Plus, Trash2, Mic2 } from "lucide-react";
import { useLocation } from "wouter";

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
    const [_, setLocation] = useLocation();

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

    // Internal state to track if we're editing an existing review found via ID
    const [currentReviewId, setCurrentReviewId] = useState<string | null>(reviewId || null);

    useEffect(() => {
        if (isOpen) {
            loadFolders();
            if (reviewId) {
                loadReview(reviewId);
            } else {
                // Reset form for new review
                resetForm();
                if (initialFolderId) setSelectedFolder(initialFolderId);
            }
        } else {
            // Stop audio when closed
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
                // Auto load audio if present
                if (data.audioUrl) {
                    setTimeout(() => loadAudio(data.audioUrl), 500);
                }
            }
        } catch (error) {
            console.error("Failed to load review:", error);
            notifyError("Failed to load review data");
        }
    }

    function loadAudio(urlOverride?: string) {
        const srcToLoad = urlOverride || audioUrl;
        if (audioRef.current && srcToLoad) {
            let src = srcToLoad;

            // Handle Google Drive links
            if (src.includes("drive.google.com")) {
                const idMatch = src.match(/[-\w]{25,}/);
                if (idMatch) {
                    src = `https://drive.google.com/uc?export=download&id=${idMatch[0]}`;
                }
            }

            audioRef.current.src = src;
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
                    // Update URL without reloading if not already there
                    // setLocation(`/track-review?id=${data.reviewId}`); // Don't change location in modal mode
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

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-theme-secondary/95 border border-theme w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl rounded-sm overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-theme/20 bg-theme-primary/10">
                    <div className="flex items-center gap-3">
                        <Mic2 className="text-accent" size={18} />
                        <div>
                            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-theme-primary">Track Review</h1>
                            <p className="text-[10px] text-theme-muted uppercase tracking-widest opacity-80">Audio Analysis & Notes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportReview}
                            disabled={!currentReviewId}
                            className="flex items-center gap-2 bg-theme-primary/20 text-theme-primary border border-theme/20 text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest hover:bg-theme-secondary transition-all disabled:opacity-50"
                        >
                            <Download size={12} />
                            Export
                        </button>
                        <button
                            onClick={saveReview}
                            disabled={saving}
                            className="flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest hover:bg-accent hover:text-theme-primary transition-all disabled:opacity-50"
                        >
                            <Save size={12} />
                            {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={onClose}
                            className="ml-2 text-theme-muted hover:text-red-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                        {/* Left Column: Info & Audio (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Track Info */}
                            <div className="bg-theme-primary/30 border border-theme/20 p-4 rounded-sm">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-accent rounded-full"></span> Track Info
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[9px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Track Name *</label>
                                        <input
                                            type="text"
                                            value={trackName}
                                            onChange={(e) => setTrackName(e.target.value)}
                                            className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors placeholder-dark"
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
                                                className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors placeholder-dark"
                                                placeholder="C# Min"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-theme-muted mb-1 uppercase tracking-widest">BPM</label>
                                            <input
                                                type="number"
                                                value={bpm}
                                                onChange={(e) => setBpm(e.target.value)}
                                                className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors placeholder-dark"
                                                placeholder="140"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Audio Player */}
                            <div className="bg-theme-primary/30 border border-theme/20 p-4 rounded-sm">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-accent rounded-full"></span> Audio Source
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={audioUrl}
                                            onChange={(e) => setAudioUrl(e.target.value)}
                                            className="flex-1 bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors placeholder-dark"
                                            placeholder="Paste audio URL..."
                                        />
                                        <button
                                            onClick={() => loadAudio()}
                                            className="bg-accent/10 text-accent border border-accent/20 text-[9px] font-bold px-3 py-2 rounded-sm uppercase tracking-widest hover:bg-accent hover:text-theme-primary transition-all"
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

                                    {/* Custom Player Controls */}
                                    <div className="bg-theme-primary/50 p-3 rounded-sm border border-theme/20">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={togglePlay}
                                                disabled={!audioUrl}
                                                className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center hover:bg-accent hover:text-theme-primary transition-all disabled:opacity-50 flex-shrink-0"
                                            >
                                                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={duration || 0}
                                                    value={currentTime}
                                                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                                                    className="w-full h-1 bg-theme-secondary rounded-lg appearance-none cursor-pointer accent-accent"
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

                            {/* Save Location */}
                            <div className="bg-theme-primary/30 border border-theme/20 p-4 rounded-sm">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-accent rounded-full"></span> Location
                                </h2>
                                <div>
                                    <label className="block text-[9px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Select Folder *</label>
                                    <select
                                        value={selectedFolder}
                                        onChange={(e) => setSelectedFolder(e.target.value)}
                                        className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors"
                                    >
                                        <option value="">-- Select --</option>
                                        {folders.map((folder) => (
                                            <option key={folder.id} value={folder.id}>
                                                {folder.path || folder.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Structure & Comments (8 cols) */}
                        <div className="lg:col-span-8 flex flex-col gap-6">

                            {/* Structure */}
                            <div className="bg-theme-primary/30 border border-theme/20 p-4 rounded-sm flex-1 min-h-[300px]">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-accent rounded-full"></span> Structure & Lyrics
                                </h2>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {["Intro", "Verse", "Pre-Chorus", "Hook", "Chorus", "Bridge", "Outro"].map((label) => (
                                        <button
                                            key={label}
                                            onClick={() => markStructure(label)}
                                            className="flex items-center gap-1 bg-theme-primary border border-theme/20 text-theme-primary text-[9px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest hover:border-accent hover:text-accent transition-all"
                                        >
                                            <Plus size={10} /> {label}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {structureMarkers.length === 0 ? (
                                        <div className="text-center py-12 text-theme-muted border-2 border-dashed border-theme/10 rounded-sm">
                                            <p className="uppercase tracking-widest text-xs mb-1">No Structure Markers</p>
                                            <p className="text-[10px] opacity-50">Click tags above to mark sections at current timestamp</p>
                                        </div>
                                    ) : (
                                        structureMarkers.sort((a, b) => a.timestamp - b.timestamp).map((marker, index) => (
                                            <div key={index} className="bg-theme-primary/50 p-4 rounded-sm border border-theme/10 group hover:border-theme/30 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => seekTo(marker.timestamp)}
                                                            className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1"
                                                        >
                                                            <Play size={8} /> {formatTime(marker.timestamp)}
                                                        </button>
                                                        <span className="text-xs text-theme-primary font-bold uppercase tracking-wide bg-theme-secondary/50 px-2 py-0.5 rounded-sm">{marker.label}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeStructureMarker(index)}
                                                        className="text-theme-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={marker.lyrics}
                                                    onChange={(e) => updateSectionLyrics(index, e.target.value)}
                                                    rows={3}
                                                    className="w-full bg-theme-primary/50 border border-theme/20 p-3 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors resize-none placeholder-dark"
                                                    placeholder={`Write lyrics for ${marker.label}...`}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="bg-theme-primary/30 border border-theme/20 p-4 rounded-sm flex-1 min-h-[200px]">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-accent rounded-full"></span> Time-synced Notes
                                </h2>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && addComment()}
                                        className="flex-1 bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors placeholder-dark"
                                        placeholder="Add note at current time..."
                                    />
                                    <button
                                        onClick={addComment}
                                        className="bg-accent/10 text-accent border border-accent/20 text-[9px] font-bold px-4 py-2 rounded-sm uppercase tracking-widest hover:bg-accent hover:text-theme-primary transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {comments.sort((a, b) => a.timestamp - b.timestamp).map((comment) => (
                                        <div key={comment.id} className="flex items-start justify-between bg-theme-primary/50 p-2 rounded-sm border border-theme/10 group hover:border-theme/30 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <button
                                                        onClick={() => seekTo(comment.timestamp)}
                                                        className="text-[10px] font-mono text-accent hover:underline"
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
                                                className="text-theme-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-[10px]"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
