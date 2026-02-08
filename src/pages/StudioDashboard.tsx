import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";
import Header from "../components/Header";

interface Artist {
  id: number;
  artistId: number | null;
  inviteEmail: string | null;
  status: string;
  createdAt: string;
  acceptedAt: string | null;
  artistName: string | null;
  artistEmail: string | null;
  projectCount: number;
}

interface ArtistProject {
  id: number;
  title: string;
  type: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
}

export default function StudioDashboard() {
  const { user } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistProjects, setArtistProjects] = useState<ArtistProject[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"roster" | "portfolio" | "settings">("roster");

  useEffect(() => {
    loadArtists();
  }, []);

  async function loadArtists() {
    try {
      const res = await fetch("/api/studio/artists");
      if (res.ok) {
        const data = await res.json();
        setArtists(data.artists || []);
      }
    } catch (err) {
      console.error("Failed to load artists:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadArtistProjects(artistId: number) {
    try {
      const res = await fetch(`/api/studio/artists/${artistId}/projects`);
      if (res.ok) {
        const data = await res.json();
        setArtistProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load artist projects:", err);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setInviting(true);

    try {
      const res = await fetch("/api/studio/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Invitation sent successfully!");
        setInviteEmail("");
        loadArtists();
      } else {
        setError(data.message || "Failed to send invitation");
      }
    } catch (err) {
      setError("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleToggleFeatured(projectId: number, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/studio/projects/${projectId}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentStatus }),
      });

      if (res.ok && selectedArtist) {
        loadArtistProjects(selectedArtist.artistId!);
      }
    } catch (err) {
      console.error("Failed to toggle featured status:", err);
    }
  }

  async function handleRemoveArtist(artistRelationId: number) {
    if (!confirm("Are you sure you want to remove this artist from your roster?")) return;

    try {
      const res = await fetch(`/api/studio/artists/${artistRelationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadArtists();
        setSelectedArtist(null);
        setArtistProjects([]);
      }
    } catch (err) {
      console.error("Failed to remove artist:", err);
    }
  }

  if (user?.role !== "studio") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-theme-muted mb-4">Studio access only</p>
          <Link href="/" className="text-accent hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{user.businessName || "Studio Dashboard"}</h1>
          <p className="text-theme-secondary">Manage your artist roster and curate your portfolio</p>
          
          <div className="mt-4 p-4 bg-theme-secondary rounded-lg inline-block">
            <p className="text-xs text-theme-muted mb-1">Your Studio Code</p>
            <div className="flex items-center gap-3">
              <code className="text-xl font-mono font-bold text-accent tracking-wider">
                {user.boxCode || "Loading..."}
              </code>
              <button
                onClick={() => {
                  if (user.boxCode) {
                    navigator.clipboard.writeText(user.boxCode);
                    setSuccess("Code copied!");
                    setTimeout(() => setSuccess(""), 2000);
                  }
                }}
                className="text-xs bg-theme-tertiary px-3 py-1 rounded hover:opacity-80"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-theme-muted mt-2">Share this code with artists to join your network during signup</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-theme pb-2">
          <button
            onClick={() => setActiveTab("roster")}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === "roster" ? "bg-theme-tertiary text-accent" : "text-theme-muted hover:text-theme-primary"
            }`}
          >
            Artist Roster
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === "portfolio" ? "bg-theme-tertiary text-accent" : "text-theme-muted hover:text-theme-primary"
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === "settings" ? "bg-theme-tertiary text-accent" : "text-theme-muted hover:text-theme-primary"
            }`}
          >
            Settings
          </button>
        </div>

        {activeTab === "roster" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="card p-6 rounded-xl mb-6">
                <h2 className="text-lg font-bold text-accent mb-4">Invite Artist</h2>
                <form onSubmit={handleInvite} className="space-y-4">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field w-full p-3 rounded"
                    placeholder="artist@email.com"
                    required
                  />
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  {success && <p className="text-green-400 text-sm">{success}</p>}
                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full btn-primary py-3 rounded-lg font-bold disabled:opacity-50"
                  >
                    {inviting ? "Sending..." : "Send Invitation"}
                  </button>
                </form>
              </div>

              <div className="card p-6 rounded-xl">
                <h2 className="text-lg font-bold text-accent mb-4">
                  Your Roster ({artists.filter(a => a.status === "accepted").length})
                </h2>
                {loading ? (
                  <p className="text-theme-muted">Loading...</p>
                ) : artists.length === 0 ? (
                  <p className="text-theme-muted text-sm">No artists yet. Invite some to get started!</p>
                ) : (
                  <div className="space-y-3">
                    {artists.map((artist) => (
                      <div
                        key={artist.id}
                        onClick={() => {
                          if (artist.status === "accepted" && artist.artistId) {
                            setSelectedArtist(artist);
                            loadArtistProjects(artist.artistId);
                          }
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedArtist?.id === artist.id 
                            ? "bg-theme-tertiary border border-accent" 
                            : "bg-theme-secondary hover:bg-theme-tertiary"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">
                              {artist.artistName || artist.inviteEmail}
                            </p>
                            <p className="text-theme-muted text-xs">
                              {artist.status === "pending" ? "Pending invite" : `${artist.projectCount} projects`}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            artist.status === "accepted" 
                              ? "bg-green-900/50 text-green-400" 
                              : "bg-yellow-900/50 text-yellow-400"
                          }`}>
                            {artist.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedArtist ? (
                <div className="card p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold">{selectedArtist.artistName}</h2>
                      <p className="text-theme-muted text-sm">{selectedArtist.artistEmail}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveArtist(selectedArtist.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove from roster
                    </button>
                  </div>

                  <h3 className="font-bold text-accent mb-4">Projects</h3>
                  {artistProjects.length === 0 ? (
                    <p className="text-theme-muted text-sm">No projects yet</p>
                  ) : (
                    <div className="space-y-3">
                      {artistProjects.map((project) => (
                        <div
                          key={project.id}
                          className="p-4 bg-theme-secondary rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold">{project.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-theme-muted text-xs">{project.type}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                project.status === "published" 
                                  ? "bg-green-900/50 text-green-400" 
                                  : "bg-theme-tertiary text-theme-muted"
                              }`}>
                                {project.status}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleFeatured(project.id, project.isFeatured)}
                            className={`px-3 py-1.5 rounded text-sm transition-colors ${
                              project.isFeatured
                                ? "bg-accent text-accent-contrast font-bold"
                                : "bg-theme-tertiary text-theme-muted hover:text-theme-primary"
                            }`}
                          >
                            {project.isFeatured ? "Featured" : "Feature"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card p-6 rounded-xl text-center">
                  <p className="text-theme-muted">Select an artist to view their projects</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "portfolio" && (
          <div className="card p-6 rounded-xl">
            <h2 className="text-lg font-bold text-accent mb-4">Featured Work</h2>
            <p className="text-theme-muted text-sm mb-6">
              These projects will appear on your public portfolio page.
            </p>
            <Link 
              href={`/portfolio/${user.id}`} 
              className="text-accent hover:underline text-sm"
            >
              View public portfolio →
            </Link>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="card p-6 rounded-xl max-w-xl">
            <h2 className="text-lg font-bold text-accent mb-4">Studio Settings</h2>
            <p className="text-theme-muted text-sm">
              Update your studio profile in the Settings page.
            </p>
            <Link 
              href="/settings" 
              className="inline-block mt-4 btn-primary px-4 py-2 rounded-lg text-sm"
            >
              Go to Settings
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
