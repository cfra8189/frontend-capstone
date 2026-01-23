import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { useTheme } from "../context/ThemeContext";
import { Link } from "wouter";

interface Note {
  id: number;
  category: string;
  content: string;
  media_url: string | null;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
}

export default function CreativeSpace() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const categories = ["all", "ideas", "lyrics", "inspiration", "audio", "visual", "journal"];

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const noteData = {
      category: formData.get("category") as string,
      content: formData.get("content") as string,
      media_url: formData.get("media_url") || null,
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
      await fetch(`/api/creative/notes/${id}/pin`, { method: "POST" });
      loadNotes();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  }

  const filteredNotes = activeCategory === "all"
    ? notes
    : notes.filter(n => n.category === activeCategory);

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-theme p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-theme-secondary hover:text-theme-primary">&larr;</Link>
            <img src="/box-logo.png" alt="BOX" className="w-8 h-8" />
            <span className="text-xl brand-font tracking-wider">BOX</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-theme-secondary text-theme-secondary hover:text-theme-primary transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <div className="flex items-center gap-2">
              {user?.profileImageUrl && (
                <img src={user.profileImageUrl} alt="" className="w-6 h-6 rounded-full" />
              )}
              <span className="text-sm text-theme-secondary">{user?.firstName || user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Private Space</h1>
            <p className="text-theme-secondary">Capture ideas, inspiration, and creative notes</p>
          </div>
          <button
            onClick={() => { setEditingNote(null); setShowModal(true); }}
            className="btn-primary font-bold px-6 py-3 rounded"
          >
            + New Note
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded text-sm whitespace-nowrap ${activeCategory === cat ? "btn-primary" : "bg-theme-tertiary text-theme-secondary"}`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNotes.map(note => (
              <div key={note.id} className={`card p-4 rounded-xl ${note.is_pinned ? "border-accent" : ""}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-theme-muted uppercase">{note.category}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePin(note.id)}
                      className={`text-sm ${note.is_pinned ? "text-accent" : "text-theme-muted"}`}
                    >
                      {note.is_pinned ? "★" : "☆"}
                    </button>
                    <button
                      onClick={() => { setEditingNote(note); setShowModal(true); }}
                      className="text-theme-muted hover:text-theme-primary text-sm"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-theme-muted hover:text-red-400 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap mb-3">{note.content}</p>
                {note.media_url && (
                  <a href={note.media_url} target="_blank" rel="noreferrer" className="text-accent text-xs hover:underline block mb-2">
                    View Media →
                  </a>
                )}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-800 px-2 py-1 rounded">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50">
          <div className="card p-6 rounded-xl max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-accent">
                {editingNote ? "Edit Note" : "New Note"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-theme-muted hover:text-theme-primary text-xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm text-theme-secondary mb-1">Media Link</label>
                <input
                  name="media_url"
                  defaultValue={editingNote?.media_url || ""}
                  className="input-field w-full p-2 rounded"
                  placeholder="YouTube, SoundCloud, Pinterest URL..."
                />
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
