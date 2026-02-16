import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useUpload } from "../../hooks/use-upload";
import PremiumEmbed from "../PremiumEmbed";

interface Note {
    id: number;
    content: string;
    category: string;
    is_pinned: boolean;
    sortOrder: number;
    created_at: string;
    updated_at: string;
    media_url?: string;
    tags?: string[];
}

interface Submission {
    id: number;
    noteId: number;
    userId: string;
    status: string;
    created_at: string;
}


export default function CreativeSpaceContent() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string>("");
    const [draggedNote, setDraggedNote] = useState<Note | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { uploadFile, isUploading, progress } = useUpload({
        onSuccess: (response) => {
            setUploadedMediaUrl(response.objectPath);
        },
        onError: (error) => {
            console.error("Upload failed:", error);
        },
    });

    const softRefresh = () => {
        loadNotes();
        loadSubmissions();
    };

    const categories = ["all", "ideas", "lyrics", "inspiration", "audio", "visual", "journal"];

    useEffect(() => {
        loadNotes();
        loadSubmissions();
    }, [activeCategory]);

    async function loadNotes() {
        setLoading(true);
        try {
            const res = await fetch("/api/creative/notes");
            if (res.ok) {
                const data = await res.json();
                setNotes(data.notes || []);
            }
        } catch (error) {
            console.error("Failed to load notes:", error);
        } finally {
            setLoading(false);
        }
    }

    async function loadSubmissions() {
        setLoading(true);
        try {
            const res = await fetch("/api/community/my-submissions");
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data.submissions || []);
            }
        } catch (error) {
            console.error("Failed to load submissions:", error);
        } finally {
            setLoading(false);
        }
    }

    async function shareNote(noteId: number) {
        try {
            const res = await fetch("/api/community/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteId }),
            });
            if (res.ok) {
                loadSubmissions();
                alert("Note submitted for community sharing! It will be visible once approved.");
            } else {
                const data = await res.json();
                alert(data.message || "Failed to submit");
            }
        } catch (error) {
            console.error("Failed to share note:", error);
        }
    }

    function getSubmissionStatus(noteId: number): string | null {
        const sub = submissions.find(s => s.noteId === noteId);
        return sub?.status || null;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const mediaLink = formData.get("media_url") as string;
        const noteData = {
            content: formData.get("content") as string,
            category: formData.get("category") as string,
            media_url: uploadedMediaUrl || mediaLink || null,
            tags: (formData.get("tags") as string)?.split(",").map(t => t.trim()).filter(Boolean) || [],
        };

        const url = editingNote ? `/api/creative/notes/${editingNote.id}` : "/api/creative/notes";
        const method = editingNote ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(noteData),
            });
            if (res.ok) {
                setShowModal(false);
                setEditingNote(null);
                setUploadedMediaUrl("");
                loadNotes();
            }
        } catch (error) {
            console.error("Failed to save note:", error);
        }
    }

    async function deleteNote(id: number) {
        if (!confirm("Delete this note?")) return;
        try {
            const res = await fetch(`/api/creative/notes/${id}`, { method: "DELETE" });
            if (res.ok) loadNotes();
        } catch (error) {
            console.error("Failed to delete note:", error);
        }
    }

    async function togglePin(id: number) {
        try {
            // Optimistic update
            const targetNote = notes.find(note => note.id === id);
            if (!targetNote) return;
            const newSortOrder = targetNote.sortOrder + 1;
            const reorderedNotes = notes.map(note =>
                note.id === id ? { ...note, sortOrder: newSortOrder, is_pinned: !note.is_pinned } : note
            );

            const res = await fetch(`/api/creative/notes/${id}/pin`, { method: "POST" });
            if (!res.ok) {
                // Revert on failure
                setNotes(prev => prev.map(noteItem =>
                    noteItem.id === id ? { ...noteItem, sortOrder: newSortOrder, is_pinned: !noteItem.is_pinned } : noteItem
                ));
            }
        } catch (error) {
            console.error("Failed to toggle pin:", error);
            loadNotes();
        }
    }

    function handleDragStart(e: React.DragEvent, note: Note) {
        setDraggedNote(note);
        e.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(e: React.DragEvent, noteId: number) {
        e.preventDefault();
        setDragOverId(noteId);
    }

    function handleDragLeave() {
        setDragOverId(null);
    }

    async function handleDrop(e: React.DragEvent, targetNote: Note) {
        e.preventDefault();
        setDragOverId(null);

        if (!draggedNote || draggedNote.id === targetNote.id) {
            setDraggedNote(null);
            return;
        }

        const currentNotes = [...notes];
        const draggedIndex = currentNotes.findIndex(n => n.id === draggedNote.id);
        const targetIndex = currentNotes.findIndex(n => n.id === targetNote.id);

        currentNotes.splice(draggedIndex, 1);
        currentNotes.splice(targetIndex, 0, draggedNote);

        // Update sort_order locally for immediate feedback
        const reorderedNotes = currentNotes.map((n, idx) => ({ ...n, sortOrder: idx }));
        setNotes(reorderedNotes);
        setDraggedNote(null);

        try {
            const res = await fetch("/api/creative/notes/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteIds: reorderedNotes.map(n => n.id) }),
            });
            if (!res.ok) {
                loadNotes();
            }
        } catch (error) {
            console.error("Failed to reorder notes:", error);
            loadNotes();
        }
    }

    function handleDragEnd() {
        setDraggedNote(null);
        setDragOverId(null);
    }

    const filteredNotes = activeCategory === "all"
        ? notes
        : notes.filter(n => n.category === activeCategory);

    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    // Pagination (client-side)
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(12);
    const totalPages = Math.max(1, Math.ceil(sortedNotes.length / perPage));

    useEffect(() => {
        // Reset to first page when notes or filter change
        setPage(1);
    }, [activeCategory, notes, perPage]);

    const paginatedNotes = sortedNotes.slice((page - 1) * perPage, page * perPage);

    function getMediaEmbed(url: string) {
        if (!url) return null;

        // Unified premium embed for Pinterest, Twitter, YouTube, etc.
        const isSocial = url.includes("pinterest.com") || url.includes("pin.it") ||
            url.includes("twitter.com") || url.includes("x.com") ||
            url.includes("youtube.com") || url.includes("youtu.be") ||
            url.includes("spotify.com") || url.includes("soundcloud.com") ||
            url.includes("instagram.com") || url.includes("tiktok.com") ||
            url.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|vimeo)(\?.*)?$/i);

        if (isSocial) {
            return <PremiumEmbed url={url} />;
        }

        // Default: show link
        return (
            <a href={url} target="_blank" rel="noreferrer" className="text-accent text-xs hover:underline block mb-3">
                {url.length > 40 ? url.substring(0, 40) + "..." : url} →
            </a>
        );
    }

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 p-3 sm:p-4 border-b border-theme/10 bg-theme-primary/5">
                <div>
                    <h1 className="text-sm sm:text-base font-bold uppercase tracking-[0.3em] text-theme-primary">Creative Space</h1>
                    <p className="text-[9px] text-theme-muted uppercase tracking-widest opacity-60">Capture ideas & inspiration</p>
                </div>
                <button
                    onClick={() => { setEditingNote(null); setUploadedMediaUrl(""); setShowModal(true); }}
                    className="bg-accent/10 text-accent border border-accent/20 text-[9px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest hover:bg-accent hover:text-theme-primary transition-all self-start sm:self-auto"
                >
                    + NEW_ENTRY
                </button>
            </div>

            <div className="px-3 pb-2 border-b border-theme/5 mb-2 bg-theme-primary/5">
                <div className="flex gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-2.5 py-1 rounded-sm text-[9px] font-mono uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === cat ? "bg-accent/10 text-accent border-accent/20" : "bg-theme-secondary/30 text-theme-muted border-transparent hover:border-theme/20"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-12 text-theme-muted animate-pulse uppercase tracking-widest text-xs">Loading Resources...</div>
                ) : sortedNotes.length === 0 ? (
                    <div className="text-center py-12 text-theme-muted flex flex-col items-center">
                        <p className="uppercase tracking-widest text-xs mb-2">Workspace Empty</p>
                        <p className="text-[10px] opacity-50">Create a new note to begin capturing</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedNotes.map(note => (
                                <div
                                    key={note.id}
                                    draggable={activeCategory === "all"}
                                    onDragStart={(e) => { if (activeCategory === "all") handleDragStart(e, note); }}
                                    onDragOver={(e) => { e.preventDefault(); if (activeCategory === "all") handleDragOver(e, note.id); }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => { if (activeCategory === "all") handleDrop(e, note); }}
                                    onDragEnd={handleDragEnd}
                                    className={`
                    p-4 rounded-sm border transition-all relative overflow-hidden group
                    bg-theme-secondary/40 backdrop-blur-sm
                    ${activeCategory === "all" ? "cursor-move" : ""} 
                    ${note.is_pinned ? "border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]" : "border-theme hover:border-theme-primary"} 
                    ${draggedNote?.id === note.id ? "opacity-50 scale-95 grayscale" : ""} 
                    ${dragOverId === note.id ? "ring-1 ring-accent scale-[1.02] bg-theme-primary/20" : ""}
                  `}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wider bg-accent/10 px-1 py-0.5 rounded-sm">{note.category}</span>
                                            {note.is_pinned && <span className="text-[9px] text-accent uppercase tracking-widest">[PINNED]</span>}
                                        </div>
                                        <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => togglePin(note.id)}
                                                className={`text-[10px] uppercase hover:underline ${note.is_pinned ? "text-accent" : "text-theme-muted hover:text-theme-primary"}`}
                                            >
                                                {note.is_pinned ? "UNPIN" : "PIN"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setEditingNote(note); setShowModal(true); }}
                                                className="text-theme-muted hover:text-theme-primary"
                                            >
                                                <span className="sr-only">Edit</span>
                                                ✎
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteNote(note.id)}
                                                className="text-theme-muted hover:text-red-500"
                                            >
                                                <span className="sr-only">Delete</span>
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    {note.media_url && getMediaEmbed(note.media_url)}
                                    <p className="text-xs font-mono text-theme-primary whitespace-pre-wrap mb-3 leading-relaxed opacity-90">{note.content}</p>
                                    {(note.tags || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-theme/10">
                                            {(note.tags || []).map(tag => (
                                                <span key={tag} className="text-[9px] text-theme-muted bg-theme-tertiary px-1.5 py-0.5 rounded-sm uppercase tracking-wide">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex items-center justify-between gap-4 border-t border-theme/20 pt-4">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-theme-muted uppercase tracking-wider">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-2 py-1 rounded-sm bg-theme-tertiary hover:bg-theme-secondary disabled:opacity-50 transition-colors"
                                >
                                    PREV
                                </button>
                                <span>PG {page} / {totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-2 py-1 rounded-sm bg-theme-tertiary hover:bg-theme-secondary disabled:opacity-50 transition-colors"
                                >
                                    NEXT
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[600]" onClick={() => setShowModal(false)}>
                    <div className="bg-theme-secondary border border-theme p-6 rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-theme pb-4">
                            <h3 className="text-sm font-bold text-theme-primary uppercase tracking-widest">
                                {editingNote ? "EDIT OBJECT" : "NEW NOTE OBJECT"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-theme-muted hover:text-theme-primary text-xl">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Category</label>
                                <select name="category" defaultValue={editingNote?.category || "ideas"} className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors uppercase">
                                    {categories.filter(c => c !== "all").map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Data Content *</label>
                                <textarea
                                    name="content"
                                    defaultValue={editingNote?.content}
                                    required
                                    rows={5}
                                    className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors resize-none"
                                    placeholder="INPUT_DATA_STREAM..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Media Link / Upload</label>
                                <div className="space-y-2">
                                    <input
                                        name="media_url"
                                        defaultValue={editingNote?.media_url || ""}
                                        className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors"
                                        placeholder="HTTPS://..."
                                        disabled={!!uploadedMediaUrl}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-theme-muted uppercase">OR</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,audio/*,video/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) uploadFile(file);
                                            }}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-1 text-[9px] font-bold bg-theme-tertiary hover:bg-theme-primary text-theme-secondary hover:text-theme-primary uppercase tracking-widest border border-transparent hover:border-theme transition-all"
                                        >
                                            {isUploading ? "UPLOADING..." : "UPLOAD_FILE"}
                                        </button>
                                        {uploadedMediaUrl && (
                                            <span className="text-[9px] text-green-500 font-mono uppercase tracking-wide">✓ UPLOAD_COMPLETE</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-widest">Tags</label>
                                <input
                                    name="tags"
                                    defaultValue={editingNote?.tags?.join(", ") || ""}
                                    className="w-full bg-theme-primary border border-theme p-2 text-xs font-mono text-theme-primary outline-none focus:border-accent transition-colors"
                                    placeholder="TAG1, TAG2..."
                                />
                            </div>
                            <button type="submit" className="w-full bg-accent/10 border border-accent text-accent font-bold py-3 text-xs uppercase tracking-[0.2em] hover:bg-accent hover:text-theme-primary transition-all mt-4">
                                {editingNote ? "UPDATE_ENTRY" : "INITIALIZE_ENTRY"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
