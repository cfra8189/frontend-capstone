import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";
import Header from "../components/Header";

interface SharedContent {
  id: number;
  noteId: number;
  userId: number;
  approvedAt: string;
  noteContent: string;
  noteCategory: string;
  noteMediaUrls: string[];
  noteTags: string[];
  favoritesCount: number;
  commentsCount: number;
}

interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
}

export default function Community() {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState<SharedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SharedContent | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userFavorites, setUserFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadContent();
    if (isAuthenticated) {
      loadUserFavorites();
    }
  }, [isAuthenticated]);

  async function loadContent() {
    try {
      const res = await fetch("/api/community");
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || []);
      }
    } catch (error) {
      console.error("Failed to load community content:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserFavorites() {
    try {
      const res = await fetch("/api/community/my-favorites");
      if (res.ok) {
        const data = await res.json();
        setUserFavorites(new Set(data.favoriteIds || []));
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    }
  }

  async function loadComments(id: number) {
    try {
      const res = await fetch(`/api/community/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  }

  async function toggleFavorite(id: number) {
    if (!isAuthenticated) {
      alert("Please sign in to favorite content");
      return;
    }

    try {
      const res = await fetch(`/api/community/${id}/favorite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setUserFavorites(prev => {
          const next = new Set(prev);
          if (data.favorited) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
        loadContent();
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  }

  async function addComment() {
    if (!isAuthenticated || !selectedItem || !newComment.trim()) return;

    try {
      const res = await fetch(`/api/community/${selectedItem.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment("");
        loadComments(selectedItem.id);
        loadContent();
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  }

  function getMediaEmbed(url: string) {
    if (!url) return null;
    
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be") 
        ? url.split("/").pop() 
        : new URLSearchParams(new URL(url).search).get("v");
      if (videoId) {
        return (
          <div className="aspect-video mb-3">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full rounded"
              allowFullScreen
            />
          </div>
        );
      }
    }
    
    if (url.includes("spotify.com")) {
      const embedUrl = url.replace("spotify.com", "spotify.com/embed");
      return (
        <div className="mb-3">
          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="rounded"
          />
        </div>
      );
    }
    
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes("/object-storage/")) {
      return (
        <div className="mb-3">
          <img src={url} alt="Media" className="w-full h-auto rounded max-h-64 object-cover" />
        </div>
      );
    }
    
    return null;
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-theme-primary mb-2">Community</h1>
          <p className="text-theme-muted">Creative work shared by BOX members</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-theme-muted">Loading...</div>
        ) : content.length === 0 ? (
          <div className="text-center py-12 text-theme-muted">
            No shared content yet. Be the first to share!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map(item => (
              <div key={item.id} className="card p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-theme-muted uppercase">{item.noteCategory}</span>
                  <span className="text-xs text-theme-muted">
                    {new Date(item.approvedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm whitespace-pre-wrap mb-3">{item.noteContent}</p>
                
                {item.noteMediaUrls?.[0] && getMediaEmbed(item.noteMediaUrls[0])}
                
                {item.noteTags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.noteTags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs bg-theme-tertiary px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-theme">
                  <div className="flex gap-4">
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`text-sm flex items-center gap-1 ${userFavorites.has(item.id) ? "text-accent" : "text-theme-muted hover:text-theme-primary"}`}
                    >
                      {userFavorites.has(item.id) ? "♥" : "♡"} {item.favoritesCount}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        loadComments(item.id);
                      }}
                      className="text-sm text-theme-muted hover:text-theme-primary flex items-center gap-1"
                    >
                      💬 {item.commentsCount}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-theme-secondary rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-theme-primary">Comments</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-theme-muted hover:text-theme-primary text-xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-theme-tertiary rounded">
                <p className="text-sm">{selectedItem.noteContent}</p>
              </div>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-theme-muted text-sm text-center py-4">No comments yet</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="p-3 bg-theme-tertiary rounded">
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-xs text-theme-muted mt-1">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {isAuthenticated && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="input-field flex-1 p-2 rounded text-sm"
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                  />
                  <button
                    onClick={addComment}
                    className="btn-primary px-4 py-2 rounded text-sm"
                    disabled={!newComment.trim()}
                  >
                    Post
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
