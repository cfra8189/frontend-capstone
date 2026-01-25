import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useTheme } from "../context/ThemeContext";

interface EPKData {
  epk: {
    shortBio: string;
    mediumBio: string;
    longBio: string;
    genre: string;
    location: string;
    photoUrls: string[];
    videoUrls: string[];
    featuredTracks: { title: string; url: string; platform: string }[];
    achievements: string[];
    pressQuotes: { quote: string; source: string }[];
    socialLinks: Record<string, string>;
    contactEmail: string;
    contactName: string;
    bookingEmail: string;
    technicalRider: string;
    stagePlot: string;
  };
  artist: {
    id: number;
    displayName: string;
    profileImageUrl: string | null;
    boxCode: string;
  };
  projects: {
    id: number;
    title: string;
    type: string;
    status: string;
    metadata: any;
  }[];
}

export default function EPKView() {
  const { boxCode } = useParams<{ boxCode: string }>();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<EPKData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<"bio" | "music" | "media" | "press" | "contact">("bio");

  useEffect(() => {
    loadEPK();
  }, [boxCode]);

  async function loadEPK() {
    try {
      const res = await fetch(`/api/epk/${boxCode}`);
      if (res.ok) {
        const epkData = await res.json();
        setData(epkData);
      } else {
        setError("Press kit not found or not published");
      }
    } catch (err) {
      setError("Failed to load press kit");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-primary">
        <div className="text-center">
          <img src="/box-logo.png" alt="BOX" className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-theme-muted">Loading press kit...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-primary">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Press Kit Not Found</h1>
          <p className="text-theme-muted mb-6">{error}</p>
          <a href="/" className="text-accent hover:underline">Return to BOX</a>
        </div>
      </div>
    );
  }

  const { epk, artist, projects } = data;

  return (
    <div className="min-h-screen bg-theme-primary">
      <header className="border-b border-theme p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/box-logo.png" alt="BOX" className="w-8 h-8" />
            <span className="text-xl brand-font tracking-wider">BOX</span>
          </a>
          <button
            onClick={toggleTheme}
            className="text-theme-muted hover:text-theme-primary text-xs font-mono"
          >
            [{theme}]
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <section className="text-center mb-12">
          {artist.profileImageUrl && (
            <img
              src={artist.profileImageUrl}
              alt={artist.displayName}
              className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-accent"
            />
          )}
          <h1 className="text-4xl font-bold mb-2">{artist.displayName}</h1>
          {epk.genre && <p className="text-accent text-lg mb-1">{epk.genre}</p>}
          {epk.location && <p className="text-theme-muted">{epk.location}</p>}
          
          {Object.keys(epk.socialLinks).length > 0 && (
            <div className="flex justify-center gap-4 mt-6">
              {Object.entries(epk.socialLinks).filter(([_, url]) => url).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-theme-muted hover:text-accent transition-colors capitalize text-sm"
                >
                  {platform}
                </a>
              ))}
            </div>
          )}
        </section>

        <nav className="flex flex-wrap justify-center gap-2 mb-8 border-b border-theme pb-4">
          {(["bio", "music", "media", "press", "contact"] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeSection === section ? "bg-accent text-accent-contrast font-bold" : "text-theme-muted hover:text-theme-primary"
              }`}
            >
              {section === "bio" ? "About" :
               section === "music" ? "Music" :
               section === "media" ? "Photos & Videos" :
               section === "press" ? "Press" : "Contact"}
            </button>
          ))}
        </nav>

        {activeSection === "bio" && (
          <section className="max-w-3xl mx-auto">
            <div className="prose prose-invert max-w-none">
              {epk.mediumBio ? (
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{epk.mediumBio}</p>
              ) : epk.shortBio ? (
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{epk.shortBio}</p>
              ) : (
                <p className="text-theme-muted">No biography available.</p>
              )}
            </div>

            {epk.longBio && (
              <details className="mt-8">
                <summary className="cursor-pointer text-accent hover:underline">Read full bio</summary>
                <p className="mt-4 text-theme-secondary whitespace-pre-wrap">{epk.longBio}</p>
              </details>
            )}
          </section>
        )}

        {activeSection === "music" && (
          <section>
            {epk.featuredTracks.length > 0 ? (
              <div className="grid gap-4 max-w-2xl mx-auto">
                {epk.featuredTracks.map((track, i) => (
                  <a
                    key={i}
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card p-6 rounded-xl flex items-center gap-4 hover:border-accent transition-colors"
                  >
                    <span className="text-2xl font-bold text-accent">{i + 1}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{track.title}</h3>
                      <p className="text-xs text-theme-muted capitalize">{track.platform}</p>
                    </div>
                    <span className="text-accent">Listen</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-center text-theme-muted">No featured tracks available.</p>
            )}

            {projects.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-center mb-6">Published Projects</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <div key={project.id} className="card p-4 rounded-xl">
                      <h3 className="font-bold">{project.title}</h3>
                      <p className="text-xs text-theme-muted capitalize">{project.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeSection === "media" && (
          <section className="space-y-12">
            {epk.photoUrls.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-6 text-center">Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {epk.photoUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-48 object-cover rounded-lg hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {epk.videoUrls.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-6 text-center">Videos</h2>
                <div className="grid gap-4 max-w-2xl mx-auto">
                  {epk.videoUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card p-4 rounded-xl hover:border-accent transition-colors flex items-center gap-4"
                    >
                      <span className="text-2xl">Watch Video {i + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {epk.photoUrls.length === 0 && epk.videoUrls.length === 0 && (
              <p className="text-center text-theme-muted">No media available.</p>
            )}
          </section>
        )}

        {activeSection === "press" && (
          <section className="max-w-3xl mx-auto space-y-8">
            {epk.achievements.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Achievements</h2>
                <ul className="space-y-2">
                  {epk.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-accent">&#9670;</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {epk.pressQuotes.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Press Quotes</h2>
                <div className="space-y-6">
                  {epk.pressQuotes.map((quote, i) => (
                    <blockquote key={i} className="card p-6 rounded-xl border-l-4 border-accent">
                      <p className="text-lg italic">"{quote.quote}"</p>
                      {quote.source && (
                        <footer className="mt-3 text-theme-muted text-sm">— {quote.source}</footer>
                      )}
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {epk.achievements.length === 0 && epk.pressQuotes.length === 0 && (
              <p className="text-center text-theme-muted">No press information available.</p>
            )}
          </section>
        )}

        {activeSection === "contact" && (
          <section className="max-w-2xl mx-auto space-y-8">
            <div className="card p-8 rounded-xl text-center">
              <h2 className="text-xl font-bold mb-6">Get In Touch</h2>
              
              <div className="space-y-4">
                {epk.contactName && (
                  <p className="text-lg">{epk.contactName}</p>
                )}
                
                {epk.contactEmail && (
                  <div>
                    <p className="text-theme-muted text-sm mb-1">Press & General Inquiries</p>
                    <a href={`mailto:${epk.contactEmail}`} className="text-accent hover:underline text-lg">
                      {epk.contactEmail}
                    </a>
                  </div>
                )}
                
                {epk.bookingEmail && (
                  <div className="mt-6">
                    <p className="text-theme-muted text-sm mb-1">Booking</p>
                    <a href={`mailto:${epk.bookingEmail}`} className="text-accent hover:underline text-lg">
                      {epk.bookingEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {(epk.technicalRider || epk.stagePlot) && (
              <div className="card p-6 rounded-xl">
                <h3 className="text-lg font-bold mb-4">Technical Information</h3>
                
                {epk.technicalRider && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-accent hover:underline">View Technical Rider</summary>
                    <pre className="mt-4 text-sm text-theme-secondary whitespace-pre-wrap bg-theme-secondary p-4 rounded">
                      {epk.technicalRider}
                    </pre>
                  </details>
                )}
                
                {epk.stagePlot && (
                  <details>
                    <summary className="cursor-pointer text-accent hover:underline">View Stage Plot</summary>
                    <pre className="mt-4 text-sm text-theme-secondary whitespace-pre-wrap bg-theme-secondary p-4 rounded">
                      {epk.stagePlot}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-theme p-6 mt-12 text-center">
        <p className="text-theme-muted text-sm">
          Electronic Press Kit powered by <a href="/" className="text-accent hover:underline">BOX</a> by luctheleo.com
        </p>
        <p className="text-xs text-theme-muted mt-2">BOX Code: {artist.boxCode}</p>
      </footer>
    </div>
  );
}
