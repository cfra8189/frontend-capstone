import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import Header from "../components/Header";

interface EPK {
  id?: number;
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
  isPublished: boolean;
}

const defaultEPK: EPK = {
  shortBio: "",
  mediumBio: "",
  longBio: "",
  genre: "",
  location: "",
  photoUrls: [],
  videoUrls: [],
  featuredTracks: [],
  achievements: [],
  pressQuotes: [],
  socialLinks: {},
  contactEmail: "",
  contactName: "",
  bookingEmail: "",
  technicalRider: "",
  stagePlot: "",
  isPublished: false,
};

export default function EPKEditor() {
  const { user } = useAuth();
  const [epk, setEpk] = useState<EPK>(defaultEPK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"bio" | "media" | "achievements" | "contact" | "technical">("bio");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newTrack, setNewTrack] = useState({ title: "", url: "", platform: "spotify" });
  const [newAchievement, setNewAchievement] = useState("");
  const [newQuote, setNewQuote] = useState({ quote: "", source: "" });

  useEffect(() => {
    loadEPK();
  }, []);

  async function loadEPK() {
    try {
      const res = await fetch("/api/epk");
      if (res.ok) {
        const data = await res.json();
        if (data.epk) {
          setEpk({
            ...defaultEPK,
            ...data.epk,
            photoUrls: data.epk.photoUrls || [],
            videoUrls: data.epk.videoUrls || [],
            featuredTracks: data.epk.featuredTracks || [],
            achievements: data.epk.achievements || [],
            pressQuotes: data.epk.pressQuotes || [],
            socialLinks: data.epk.socialLinks || {},
          });
        }
      }
    } catch (err) {
      console.error("Failed to load EPK:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveEPK(publish = false) {
    setSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch("/api/epk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...epk, isPublished: publish ? true : epk.isPublished }),
      });

      if (res.ok) {
        const data = await res.json();
        setEpk({
          ...defaultEPK,
          ...data.epk,
          photoUrls: data.epk.photoUrls || [],
          videoUrls: data.epk.videoUrls || [],
          featuredTracks: data.epk.featuredTracks || [],
          achievements: data.epk.achievements || [],
          pressQuotes: data.epk.pressQuotes || [],
          socialLinks: data.epk.socialLinks || {},
        });
        setMessage({ type: "success", text: publish ? "EPK published!" : "EPK saved!" });
      } else {
        setMessage({ type: "error", text: "Failed to save EPK" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save EPK" });
    } finally {
      setSaving(false);
    }
  }

  function addPhoto() {
    if (newPhotoUrl.trim()) {
      setEpk({ ...epk, photoUrls: [...epk.photoUrls, newPhotoUrl.trim()] });
      setNewPhotoUrl("");
    }
  }

  function removePhoto(index: number) {
    setEpk({ ...epk, photoUrls: epk.photoUrls.filter((_, i) => i !== index) });
  }

  function addVideo() {
    if (newVideoUrl.trim()) {
      setEpk({ ...epk, videoUrls: [...epk.videoUrls, newVideoUrl.trim()] });
      setNewVideoUrl("");
    }
  }

  function removeVideo(index: number) {
    setEpk({ ...epk, videoUrls: epk.videoUrls.filter((_, i) => i !== index) });
  }

  function addTrack() {
    if (newTrack.title.trim() && newTrack.url.trim()) {
      setEpk({ ...epk, featuredTracks: [...epk.featuredTracks, { ...newTrack }] });
      setNewTrack({ title: "", url: "", platform: "spotify" });
    }
  }

  function removeTrack(index: number) {
    setEpk({ ...epk, featuredTracks: epk.featuredTracks.filter((_, i) => i !== index) });
  }

  function addAchievement() {
    if (newAchievement.trim()) {
      setEpk({ ...epk, achievements: [...epk.achievements, newAchievement.trim()] });
      setNewAchievement("");
    }
  }

  function removeAchievement(index: number) {
    setEpk({ ...epk, achievements: epk.achievements.filter((_, i) => i !== index) });
  }

  function addQuote() {
    if (newQuote.quote.trim()) {
      setEpk({ ...epk, pressQuotes: [...epk.pressQuotes, { ...newQuote }] });
      setNewQuote({ quote: "", source: "" });
    }
  }

  function removeQuote(index: number) {
    setEpk({ ...epk, pressQuotes: epk.pressQuotes.filter((_, i) => i !== index) });
  }

  function updateSocialLink(platform: string, url: string) {
    setEpk({ ...epk, socialLinks: { ...epk.socialLinks, [platform]: url } });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <Header />
        <div className="flex items-center justify-center p-8">
          <p className="text-theme-muted">Loading your EPK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Electronic Press Kit</h1>
            <p className="text-theme-secondary">Your professional resume for the music industry</p>
          </div>
          <div className="flex items-center gap-3">
            {epk.isPublished && user?.boxCode && (
              <a
                href={`/epk/${user.boxCode}`}
                target="_blank"
                className="text-xs text-accent hover:underline"
              >
                View Public EPK
              </a>
            )}
            <span className={`text-xs px-2 py-1 rounded ${epk.isPublished ? "bg-green-500/20 text-green-400" : "bg-theme-tertiary text-theme-muted"}`}>
              {epk.isPublished ? "Published" : "Draft"}
            </span>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded mb-6 ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6 border-b border-theme pb-2">
          {(["bio", "media", "achievements", "contact", "technical"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm transition-colors ${
                activeTab === tab ? "bg-theme-tertiary text-accent font-bold" : "text-theme-muted hover:text-theme-primary"
              }`}
            >
              {tab === "bio" ? "Biography" : 
               tab === "media" ? "Media & Music" :
               tab === "achievements" ? "Press & Awards" :
               tab === "contact" ? "Contact" : "Technical"}
            </button>
          ))}
        </div>

        {activeTab === "bio" && (
          <div className="space-y-6">
            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Artist Biography</h2>
              <p className="text-xs text-theme-muted mb-4">
                Write in third person so journalists can copy/paste. Create three versions for different contexts.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">
                    Short Bio (50-100 words) - Elevator pitch
                  </label>
                  <textarea
                    value={epk.shortBio}
                    onChange={(e) => setEpk({ ...epk, shortBio: e.target.value })}
                    className="input-field w-full p-3 rounded h-24"
                    placeholder="[Artist Name] is a [genre] artist from [location]..."
                  />
                  <p className="text-xs text-theme-muted mt-1">{(epk.shortBio || '').split(/\s+/).filter(Boolean).length} words</p>
                </div>

                <div>
                  <label className="block text-sm text-theme-secondary mb-1">
                    Medium Bio (150-250 words) - For press
                  </label>
                  <textarea
                    value={epk.mediumBio}
                    onChange={(e) => setEpk({ ...epk, mediumBio: e.target.value })}
                    className="input-field w-full p-3 rounded h-36"
                    placeholder="Expand on your story, influences, and recent work..."
                  />
                  <p className="text-xs text-theme-muted mt-1">{(epk.mediumBio || '').split(/\s+/).filter(Boolean).length} words</p>
                </div>

                <div>
                  <label className="block text-sm text-theme-secondary mb-1">
                    Long Bio - For in-depth features
                  </label>
                  <textarea
                    value={epk.longBio}
                    onChange={(e) => setEpk({ ...epk, longBio: e.target.value })}
                    className="input-field w-full p-3 rounded h-48"
                    placeholder="Your complete artist story..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-theme-secondary mb-1">Genre</label>
                    <input
                      type="text"
                      value={epk.genre}
                      onChange={(e) => setEpk({ ...epk, genre: e.target.value })}
                      className="input-field w-full p-3 rounded"
                      placeholder="Hip-Hop, R&B, Electronic..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-theme-secondary mb-1">Location</label>
                    <input
                      type="text"
                      value={epk.location}
                      onChange={(e) => setEpk({ ...epk, location: e.target.value })}
                      className="input-field w-full p-3 rounded"
                      placeholder="Los Angeles, CA"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "media" && (
          <div className="space-y-6">
            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Featured Tracks</h2>
              <p className="text-xs text-theme-muted mb-4">
                Add 3-5 of your best tracks. Lead with your strongest song.
              </p>

              <div className="space-y-3 mb-4">
                {epk.featuredTracks.map((track, i) => (
                  <div key={i} className="flex items-center gap-3 bg-theme-secondary p-3 rounded">
                    <span className="text-accent font-bold">{i + 1}.</span>
                    <span className="flex-1">{track.title}</span>
                    <span className="text-xs text-theme-muted">{track.platform}</span>
                    <button onClick={() => removeTrack(i)} className="text-red-400 text-sm hover:underline">Remove</button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newTrack.title}
                  onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                  className="input-field p-2 rounded text-sm"
                  placeholder="Track title"
                />
                <input
                  type="text"
                  value={newTrack.url}
                  onChange={(e) => setNewTrack({ ...newTrack, url: e.target.value })}
                  className="input-field p-2 rounded text-sm"
                  placeholder="Streaming URL"
                />
                <div className="flex gap-2">
                  <select
                    value={newTrack.platform}
                    onChange={(e) => setNewTrack({ ...newTrack, platform: e.target.value })}
                    className="input-field p-2 rounded text-sm flex-1"
                  >
                    <option value="spotify">Spotify</option>
                    <option value="apple">Apple Music</option>
                    <option value="soundcloud">SoundCloud</option>
                    <option value="youtube">YouTube</option>
                    <option value="other">Other</option>
                  </select>
                  <button onClick={addTrack} className="btn-primary px-3 py-2 rounded text-sm">Add</button>
                </div>
              </div>
            </div>

            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Photos</h2>
              <p className="text-xs text-theme-muted mb-4">
                Add 3-5 high-resolution photo URLs. Include landscape, portrait, and square formats.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {epk.photoUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover rounded" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="input-field flex-1 p-2 rounded text-sm"
                  placeholder="Photo URL (https://...)"
                />
                <button onClick={addPhoto} className="btn-primary px-4 py-2 rounded text-sm">Add Photo</button>
              </div>
            </div>

            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Videos</h2>
              <p className="text-xs text-theme-muted mb-4">
                Add 2-3 video links: live performances and official music videos.
              </p>

              <div className="space-y-2 mb-4">
                {epk.videoUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-3 bg-theme-secondary p-3 rounded">
                    <span className="flex-1 text-sm truncate">{url}</span>
                    <button onClick={() => removeVideo(i)} className="text-red-400 text-sm hover:underline">Remove</button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="input-field flex-1 p-2 rounded text-sm"
                  placeholder="Video URL (YouTube, Vimeo...)"
                />
                <button onClick={addVideo} className="btn-primary px-4 py-2 rounded text-sm">Add Video</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="space-y-6">
            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Achievements & Stats</h2>
              <p className="text-xs text-theme-muted mb-4">
                Awards, streaming milestones, notable performances, chart positions.
              </p>

              <div className="space-y-2 mb-4">
                {epk.achievements.map((achievement, i) => (
                  <div key={i} className="flex items-center gap-3 bg-theme-secondary p-3 rounded">
                    <span className="flex-1">{achievement}</span>
                    <button onClick={() => removeAchievement(i)} className="text-red-400 text-sm hover:underline">Remove</button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  className="input-field flex-1 p-2 rounded text-sm"
                  placeholder="1M+ streams on Spotify, Winner of XYZ Award..."
                />
                <button onClick={addAchievement} className="btn-primary px-4 py-2 rounded text-sm">Add</button>
              </div>
            </div>

            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Press Quotes</h2>
              <p className="text-xs text-theme-muted mb-4">
                Notable quotes from press, reviews, or industry professionals.
              </p>

              <div className="space-y-3 mb-4">
                {epk.pressQuotes.map((quote, i) => (
                  <div key={i} className="bg-theme-secondary p-4 rounded">
                    <p className="italic text-theme-primary">"{quote.quote}"</p>
                    {quote.source && <p className="text-xs text-theme-muted mt-2">— {quote.source}</p>}
                    <button onClick={() => removeQuote(i)} className="text-red-400 text-xs mt-2 hover:underline">Remove</button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <textarea
                  value={newQuote.quote}
                  onChange={(e) => setNewQuote({ ...newQuote, quote: e.target.value })}
                  className="input-field w-full p-2 rounded text-sm h-20"
                  placeholder="Quote text..."
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuote.source}
                    onChange={(e) => setNewQuote({ ...newQuote, source: e.target.value })}
                    className="input-field flex-1 p-2 rounded text-sm"
                    placeholder="Source (Rolling Stone, Billboard...)"
                  />
                  <button onClick={addQuote} className="btn-primary px-4 py-2 rounded text-sm">Add Quote</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="space-y-6">
            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={epk.contactName}
                    onChange={(e) => setEpk({ ...epk, contactName: e.target.value })}
                    className="input-field w-full p-3 rounded"
                    placeholder="Manager, publicist, or artist name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">Press/General Inquiries Email</label>
                  <input
                    type="email"
                    value={epk.contactEmail}
                    onChange={(e) => setEpk({ ...epk, contactEmail: e.target.value })}
                    className="input-field w-full p-3 rounded"
                    placeholder="press@artist.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-theme-secondary mb-1">Booking Email</label>
                  <input
                    type="email"
                    value={epk.bookingEmail}
                    onChange={(e) => setEpk({ ...epk, bookingEmail: e.target.value })}
                    className="input-field w-full p-3 rounded"
                    placeholder="booking@artist.com"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Social Links</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["instagram", "twitter", "tiktok", "youtube", "spotify", "soundcloud", "website"].map((platform) => (
                  <div key={platform}>
                    <label className="block text-sm text-theme-secondary mb-1 capitalize">{platform}</label>
                    <input
                      type="text"
                      value={epk.socialLinks[platform] || ""}
                      onChange={(e) => updateSocialLink(platform, e.target.value)}
                      className="input-field w-full p-3 rounded"
                      placeholder={`https://${platform}.com/...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "technical" && (
          <div className="space-y-6">
            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Technical Rider</h2>
              <p className="text-xs text-theme-muted mb-4">
                Equipment needs, input list, and stage requirements for venues.
              </p>
              <textarea
                value={epk.technicalRider}
                onChange={(e) => setEpk({ ...epk, technicalRider: e.target.value })}
                className="input-field w-full p-3 rounded h-48"
                placeholder="Input List:
- Vocal Mic (SM58 or equivalent)
- DI Box for backing tracks
- 2 Monitor wedges

Equipment Provided:
- Laptop with backing tracks
- ..."
              />
            </div>

            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Stage Plot</h2>
              <p className="text-xs text-theme-muted mb-4">
                Describe your stage setup or link to a stage plot image.
              </p>
              <textarea
                value={epk.stagePlot}
                onChange={(e) => setEpk({ ...epk, stagePlot: e.target.value })}
                className="input-field w-full p-3 rounded h-36"
                placeholder="Stage setup description or URL to stage plot diagram..."
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-theme">
          <div className="text-sm text-theme-muted">
            {user?.boxCode && (
              <span>Your EPK URL: <code className="text-accent">/epk/{user.boxCode}</code></span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => saveEPK(false)}
              disabled={saving}
              className="bg-theme-secondary px-6 py-3 rounded-lg font-bold hover:opacity-80 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => saveEPK(true)}
              disabled={saving}
              className="btn-primary px-6 py-3 rounded-lg font-bold disabled:opacity-50"
            >
              {saving ? "Publishing..." : epk.isPublished ? "Update & Publish" : "Publish EPK"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
