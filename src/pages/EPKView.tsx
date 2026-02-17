import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useTheme } from "../context/ThemeContext";
import { Play, Pause, ExternalLink, Mail, ArrowDown, Share2, Instagram, Twitter, Youtube, Music, Globe } from "lucide-react";

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
}

// ── Mock Data for Visualization ──
const MOCK_EPK: EPKData = {
  epk: {
    shortBio: "A defining voice in the new wave of experimental electronic soul.",
    mediumBio: "Emerging from the underground scene, [ARTIST] blurs the lines between analog warmth and digital precision. With a sound that has been described as 'hypnotic' and 'genre-defying', they have quickly garnered attention from tastemakers worldwide.",
    longBio: "Born in the haze of late-night studio sessions and driven by an obsession with sonic texture, [ARTIST] began their journey in [YEAR]. \n\nWhat started as a solitary experiment has evolved into a fully realized artistic vision, combining haunting vocals with intricate production. Their debut project challenged conventions, earning critical acclaim and a dedicated cult following. \n\nNow, with a new body of work on the horizon, [ARTIST] is poised to redefine the landscape of modern [GENRE].",
    genre: "Electronic / Soul / Experimental",
    location: "Los Angeles, CA",
    photoUrls: [
      "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2070&auto=format&fit=crop"
    ],
    videoUrls: ["https://youtube.com/watch?v=placeholder"],
    featuredTracks: [
      { title: "Midnight Static", url: "#", platform: "spotify" },
      { title: "Neon Haze", url: "#", platform: "apple" },
      { title: "Analog Heart", url: "#", platform: "soundcloud" }
    ],
    achievements: [
      "1.2M+ Streams across platforms",
      "Featured in Rolling Stone 'Artists to Watch'",
      "Sold out debut headline tour (2025)",
      "Best New Artist Nominee - Indie Awards"
    ],
    pressQuotes: [
      { quote: "A sonic masterpiece that demands your full attention.", source: "Pitchfork" },
      { quote: "The future of the genre has arrived.", source: "The FADER" },
      { quote: "Hauntingly beautiful and technically flawless.", source: "Complex" }
    ],
    socialLinks: {
      instagram: "https://instagram.com",
      twitter: "https://twitter.com",
      spotify: "https://spotify.com",
      youtube: "https://youtube.com"
    },
    contactEmail: "mgmt@artist.com",
    contactName: "Management Team",
    bookingEmail: "booking@agency.com",
    technicalRider: "Standard Rider",
    stagePlot: "Standard Plot"
  },
  artist: {
    id: 0,
    displayName: "THE UNKNOWN",
    profileImageUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a11d0?q=80&w=2071&auto=format&fit=crop",
    boxCode: "MOCK"
  }
};

export default function EPKView() {
  const { boxCode } = useParams<{ boxCode: string }>();
  // @ts-ignore - Unused but kept for strict mode compatibility if needed later
  const { theme } = useTheme();

  const [data, setData] = useState<EPKData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);

  // Refs for scroll spy
  const sectionRefs = {
    hero: useRef<HTMLElement>(null),
    bio: useRef<HTMLElement>(null),
    music: useRef<HTMLElement>(null),
    visuals: useRef<HTMLElement>(null),
    press: useRef<HTMLElement>(null),
    contact: useRef<HTMLElement>(null)
  };

  useEffect(() => {
    loadEPK();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [boxCode]);

  function handleScroll() {
    setScrolled(window.scrollY > 50);

    // Scroll Spy Logic
    const scrollPosition = window.scrollY + 100;
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        const { offsetTop, offsetHeight } = ref.current;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setActiveSection(key);
        }
      }
    });
  }

  async function loadEPK() {
    if (!boxCode || boxCode === "mock" || boxCode === "test" || boxCode === "MOCK") {
      setData(MOCK_EPK);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/epk/${boxCode}`);
      if (res.ok) {
        const epkData = await res.json();
        const hasContent = epkData.epk.shortBio || epkData.epk.mediumBio || epkData.epk.photoUrls.length > 0;
        // Use Mock data if fetched data is largely empty (for visualization purposes)
        setData(hasContent ? epkData : MOCK_EPK);
      } else {
        // Fallback to mock data for demo/testing if not found
        setData(MOCK_EPK);
      }
    } catch (err) {
      console.error("Failed to load press kit, using mock data", err);
      setData(MOCK_EPK);
    } finally {
      setLoading(false);
    }
  }

  function scrollToSection(key: keyof typeof sectionRefs) {
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="w-16 h-1 bg-white mb-4 animate-pulse mx-auto opacity-50"></div>
          <p className="uppercase tracking-[0.3em] text-xs opacity-50">Loading Interface...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { epk, artist } = data;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans selection:bg-white selection:text-black overflow-x-hidden relative">

      {/* ── CRT Scanline Texture ── */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-black/80 backdrop-blur-md py-4 border-b border-white/5" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <a href="#" className="text-lg font-bold tracking-[0.2em] uppercase mix-blend-difference">{artist.displayName}</a>

          <div className="hidden md:flex gap-8">
            {Object.keys(sectionRefs).filter(k => k !== 'hero').map((key) => (
              <button
                key={key}
                onClick={() => scrollToSection(key as keyof typeof sectionRefs)}
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:text-white ${activeSection === key ? "text-white opacity-100" : "text-gray-400 opacity-60"}`}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button className="text-xs uppercase tracking-widest font-bold border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all">
              Download press kit
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section ref={sectionRefs.hero} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          {artist.profileImageUrl ? (
            <img src={artist.profileImageUrl} alt="Hero" className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-[2s]" />
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <p className="text-accent uppercase tracking-[0.5em] text-xs mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">Electronic Press Kit</p>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-none mix-blend-overlay opacity-90">
            {artist.displayName}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl mx-auto mb-10 leading-relaxed opacity-90">
            {epk.shortBio}
          </p>
          <div className="flex justify-center gap-6">
            <button onClick={() => scrollToSection('music')} className="bg-white text-black px-8 py-3 uppercase tracking-widest text-[10px] font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Play size={12} fill="currentColor" /> Listen
            </button>
            <button onClick={() => scrollToSection('contact')} className="border border-white/30 text-white px-8 py-3 uppercase tracking-widest text-[10px] font-bold hover:bg-white/10 transition-colors">
              Contact
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ArrowDown size={20} />
        </div>
      </section>

      {/* ── Biography ── */}
      <section ref={sectionRefs.bio} className="py-24 md:py-32 px-6 container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold uppercase tracking-wide">The Story</h2>
            <div className="w-12 h-0.5 bg-accent opacity-50" />
            <p className="text-gray-400 leading-8 text-lg font-light whitespace-pre-wrap">
              {epk.mediumBio}
            </p>
            {epk.longBio && (
              <p className="text-gray-500 leading-7 text-sm whitespace-pre-wrap border-l-2 border-white/10 pl-6 italic">
                "{epk.longBio.slice(0, 150)}..."
              </p>
            )}

            <div className="pt-6">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Stats & Achievements</h3>
              <ul className="space-y-3">
                {epk.achievements.slice(0, 4).map((ach, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    {ach}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {epk.photoUrls.slice(0, 2).map((url, i) => (
              <img key={i} src={url} alt={`Bio ${i}`} className={`w-full object-cover grayscale hover:grayscale-0 transition-all duration-700 rounded-sm ${i === 1 ? 'mt-12' : ''} h-[400px]`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Music ── */}
      <section ref={sectionRefs.music} className="py-24 bg-[#0f0f0f]">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-bold uppercase tracking-wide text-center mb-16">Selected Discography</h2>

          <div className="grid gap-6">
            {epk.featuredTracks.map((track, i) => (
              <div key={i} className="group flex items-center justify-between p-6 border border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all rounded-sm">
                <div className="flex items-center gap-6">
                  <span className="text-2xl font-black text-white/20 group-hover:text-accent transition-colors">0{i + 1}</span>
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-accent transition-colors">{track.title}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{track.platform} Release</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <a href={track.url} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors">
                    <Play size={14} fill="currentColor" />
                  </a>
                  <button className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors">
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-6">Listen on</h3>
            <div className="flex justify-center gap-8 opacity-50 hover:opacity-100 transition-opacity">
              <Music size={24} />
              <Youtube size={24} />
              <Globe size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Visuals ── */}
      <section ref={sectionRefs.visuals} className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {epk.photoUrls.map((url, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden bg-gray-900 cursor-pointer">
              <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs uppercase tracking-widest border border-white px-4 py-2 hover:bg-white hover:text-black transition-colors">View High-Res</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Press ── */}
      <section ref={sectionRefs.press} className="py-24 px-6 container mx-auto max-w-4xl text-center">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-12">Press & Acclaim</h2>
        <div className="grid gap-12">
          {epk.pressQuotes.map((quote, i) => (
            <blockquote key={i} className="relative">
              <p className="text-2xl md:text-4xl font-light leading-tight mb-6">"{quote.quote}"</p>
              <cite className="text-xs uppercase tracking-widest font-bold text-gray-500 not-italic">— {quote.source}</cite>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ── Contact ── */}
      <section ref={sectionRefs.contact} className="py-24 bg-[#0a0a0a] border-t border-white/5 pb-40">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter mb-8">Get In Touch</h2>
              <p className="text-gray-400 mb-8 max-w-md">For booking inquiries, press features, or collaboration requests, please contact our team directly.</p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Management</h3>
                  <p className="text-lg font-bold">{epk.contactName}</p>
                  <a href={`mailto:${epk.contactEmail}`} className="text-accent hover:underline flex items-center gap-2 mt-1">
                    <Mail size={14} /> {epk.contactEmail}
                  </a>
                </div>

                {epk.bookingEmail && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Booking</h3>
                    <a href={`mailto:${epk.bookingEmail}`} className="text-accent hover:underline flex items-center gap-2 mt-1">
                      <ExternalLink size={14} /> {epk.bookingEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-sm border border-white/5">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-6">Technical & Assets</h3>
              <div className="space-y-4">
                <div
                  onClick={() => window.print()}
                  className="flex items-center justify-between p-4 bg-black/20 rounded border border-white/5 hover:border-white/20 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-sm">Download Full EPK</span>
                  <ArrowDown size={14} />
                </div>
                <div
                  onClick={() => {
                    if (epk.technicalRider) {
                      const element = document.createElement('a');
                      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(epk.technicalRider));
                      element.setAttribute('download', 'technical-rider.txt');
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    } else {
                      alert("No technical rider available to download.");
                    }
                  }}
                  className="flex items-center justify-between p-4 bg-black/20 rounded border border-white/5 hover:border-white/20 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-sm">Tech Rider</span>
                  <ArrowDown size={14} />
                </div>
                <div
                  onClick={() => {
                    if (epk.photoUrls.length > 0) {
                      window.open(epk.photoUrls[0], '_blank');
                    } else {
                      alert("No photos available.");
                    }
                  }}
                  className="flex items-center justify-between p-4 bg-black/20 rounded border border-white/5 hover:border-white/20 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-sm">High-Res Photos</span>
                  <ArrowDown size={14} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} {artist.displayName}. All Rights Reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              {Object.entries(epk.socialLinks).map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  {platform}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
