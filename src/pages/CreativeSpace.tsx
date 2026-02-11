import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";
import { useUpload } from "../hooks/use-upload";
import Header from "../components/Header";
import PremiumEmbed from "../components/PremiumEmbed";

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


export default function CreativeSpace() {
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

    const newNote = {
      content: noteData.content,
      category: noteData.category,
      tags: noteData.tags || []
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
      const newSortOrder = notes.find(note => note.id === id)?.sortOrder + 1;
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
    const reorderedNotes = currentNotes.map((n, idx) => ({ ...n, sort_order: idx }));
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
    return (a.sort_order || 0) - (b.sort_order || 0);
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
      url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);

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
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Your Private Space</h1>
            <p className="text-sm sm:text-base text-theme-secondary">Capture ideas, inspiration, and creative notes</p>
          </div>
          <button
            onClick={() => { setEditingNote(null); setUploadedMediaUrl(""); setShowModal(true); }}
            className="btn-primary font-bold px-4 sm:px-6 py-2 sm:py-3 rounded text-sm sm:text-base w-full sm:w-auto"
          >
            + New Note
          </button>
        </div>

        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm whitespace-nowrap ${activeCategory === cat ? "btn-primary" : "bg-theme-tertiary text-theme-secondary"}`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-theme-muted">Loading...</div>
        ) : sortedNotes.length === 0 ? (
          <div className="text-center py-12 text-theme-muted">
            No notes yet. Start capturing your ideas!
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
                  className={`card p-4 rounded-xl transition-all ${activeCategory === "all" ? "cursor-move" : ""} ${note.is_pinned ? "border-accent" : ""} ${draggedNote?.id === note.id ? "opacity-50 scale-95" : ""} ${dragOverId === note.id ? "ring-2 ring-accent scale-105" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-theme-muted uppercase">{note.category}</span>
                      {note.is_pinned && <span className="text-xs text-accent">[pinned]</span>}
                    </div>
                    <div className="flex gap-2 items-center">
                      {(() => {
                        const status = getSubmissionStatus(note.id);
                        if (status === "pending") {
                          return <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">pending</span>;
                        } else if (status === "approved") {
                          return <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">shared</span>;
                        } else if (status === "rejected") {
                          return <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">declined</span>;
                        } else {
                          return (
                            <button
                              type="button"
                              onClick={() => shareNote(note.id)}
                              className="text-xs px-2 py-0.5 rounded bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary"
                              title="Submit to community"
                            >
                              share
                            </button>
                          );
                        }
                      })()}
                      <button
                        type="button"
                        onClick={() => togglePin(note.id)}
                        className={`text-xs px-2 py-0.5 rounded ${note.is_pinned ? "bg-accent text-theme-primary" : "bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary"}`}
                        style={note.is_pinned ? { color: 'var(--bg-primary)' } : {}}
                      >
                        {note.is_pinned ? "unpin" : "pin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingNote(note); setShowModal(true); }}
                        className="text-theme-muted hover:text-theme-primary text-sm"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        className="text-theme-muted hover:text-red-400 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {note.media_url && getMediaEmbed(note.media_url)}
                  <p className="text-sm whitespace-pre-wrap mb-3 text-theme-primary">{note.content}</p>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map(tag => (
                        <span key={tag} className="tag-pill">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-theme-muted">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-theme-tertiary disabled:opacity-50"
                >
                  ◀ Prev
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-theme-tertiary disabled:opacity-50"
                >
                  Next ▶
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="text-theme-muted">Per page:</label>
                <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="input-field text-sm">
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            </div>
          </>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50">
          <div className="card p-4 sm:p-6 rounded-t-xl sm:rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold text-accent">
                {editingNote ? "Edit Note" : "New Note"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-theme-muted hover:text-theme-primary text-xl p-1">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Category</label>
                <select name="category" defaultValue={editingNote?.category || "ideas"} className="input-field w-full p-2 rounded">
                  {categories.filter(c => c !== "all").map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Content *</label>
                <textarea
                  name="content"
                  defaultValue={editingNote?.content}
                  required
                  rows={5}
                  className="input-field w-full p-2 rounded"
                  placeholder="Write your thoughts..."
                />
              </div>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Media</label>
                <div className="space-y-2">
                  <input
                    name="media_url"
                    defaultValue={editingNote?.media_url || ""}
                    className="input-field w-full p-2 rounded"
                    placeholder="YouTube, SoundCloud, URL..."
                    disabled={!!uploadedMediaUrl}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-theme-muted">or</span>
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
                      onClick={softRefresh}
                      className="px-3 py-1 text-xs bg-theme-tertiary rounded hover:bg-theme-secondary"
                    >
                      Refresh
                    </button>
                    {uploadedMediaUrl && (
                      <span className="text-xs text-green-500">✓ Uploaded</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Tags</label>
                <input
                  name="tags"
                  defaultValue={editingNote?.tags.join(", ") || ""}
                  className="input-field w-full p-2 rounded"
                  placeholder="Separate with commas"
                />
              </div>
              <button type="submit" className="w-full btn-primary font-bold py-3 rounded">
                {editingNote ? "Save Changes" : "Create Note"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
