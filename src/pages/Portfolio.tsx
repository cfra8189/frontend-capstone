import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useTheme } from "../context/ThemeContext";

interface StudioInfo {
  id: number;
  businessName: string;
  businessBio: string | null;
  displayName: string;
}

interface FeaturedProject {
  id: number;
  title: string;
  type: string;
  status: string;
  description: string | null;
  artistName: string;
  createdAt: string;
}

interface RosterArtist {
  id: number;
  displayName: string;
  projectCount: number;
}

export default function Portfolio() {
  const { id } = useParams();
  const { theme, toggleTheme } = useTheme();
  const [studio, setStudio] = useState<StudioInfo | null>(null);
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [roster, setRoster] = useState<RosterArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolio();
  }, [id]);

  async function loadPortfolio() {
    try {
      const res = await fetch(`/api/portfolio/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStudio(data.studio);
        setFeaturedProjects(data.featuredProjects || []);
        setRoster(data.roster || []);
      }
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-theme-muted">Loading...</p>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-theme-muted mb-4">Portfolio not found</p>
          <Link href="/" className="text-accent hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <header className="border-b border-theme p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/box-logo.png" alt="BOX" className="w-8 h-8" />
            </Link>
            <span className="text-xl brand-font tracking-wider">BOX</span>
          </div>
          <button
            onClick={toggleTheme}
            className="text-theme-muted hover:text-theme-primary text-xs font-mono transition-colors"
          >
            [{theme}]
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">{studio.businessName}</h1>
          {studio.businessBio && (
            <p className="text-theme-secondary max-w-2xl mx-auto">{studio.businessBio}</p>
          )}
        </div>

        {roster.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-accent mb-6">Artist Roster</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {roster.map((artist) => (
                <div key={artist.id} className="card p-4 rounded-xl text-center">
                  <div className="w-16 h-16 rounded-full bg-theme-tertiary mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-accent">
                      {artist.displayName?.charAt(0) || "?"}
                    </span>
                  </div>
                  <p className="font-bold">{artist.displayName}</p>
                  <p className="text-theme-muted text-xs">{artist.projectCount} projects</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {featuredProjects.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-accent mb-6">Featured Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <div key={project.id} className="card p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-theme-tertiary px-2 py-1 rounded">{project.type}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      project.status === "published" 
                        ? "bg-green-900/50 text-green-400" 
                        : "bg-theme-tertiary text-theme-muted"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{project.title}</h3>
                  <p className="text-theme-muted text-sm mb-3">by {project.artistName}</p>
                  {project.description && (
                    <p className="text-theme-secondary text-sm line-clamp-3">{project.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {featuredProjects.length === 0 && roster.length === 0 && (
          <div className="text-center py-12">
            <p className="text-theme-muted">No content to display yet</p>
          </div>
        )}
      </main>

      <footer className="border-t border-theme p-6 mt-12">
        <div className="max-w-6xl mx-auto text-center text-theme-muted text-sm">
          <p>Powered by BOX | luctheleo.com</p>
        </div>
      </footer>
    </div>
  );
}
