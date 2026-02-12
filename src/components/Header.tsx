import { useState, useEffect, useRef } from "react";
import LogoGif from "./LogoGif";
import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  showNav?: boolean;
}

interface SearchResult {
  type: "project" | "note" | "page";
  id?: number;
  title: string;
  subtitle?: string;
  href: string;
}

export default function Header({ showNav = true }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const pages: SearchResult[] = [
    { type: "page", title: "Dashboard", subtitle: "Home", href: "/" },
    { type: "page", title: "Creative Space", subtitle: "Notes & inspiration", href: "/creative" },
    { type: "page", title: "Agreements", subtitle: "Generate contracts", href: "/generator" },
    { type: "page", title: "Saved Agreements", subtitle: "Your saved contracts", href: "/documents" },
    { type: "page", title: "Community", subtitle: "Shared content", href: "/community" },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const pageResults = pages.filter(
      p => p.title.toLowerCase().includes(query) || p.subtitle?.toLowerCase().includes(query) || p.href?.toLowerCase().includes(query)
    );

    async function searchData() {
      setSearching(true);
      const results: SearchResult[] = [...pageResults];

      try {
        const [projectsRes, notesRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/creative/notes")
        ]);

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          const projects = (data.projects || []).filter((p: any) =>
            p.title.toLowerCase().includes(query) ||
            p.type?.toLowerCase().includes(query)
          ).slice(0, 5);
          
          projects.forEach((p: any) => {
            results.push({
              type: "project",
              id: p.id,
              title: p.title,
              subtitle: `${p.type} - ${p.status}`,
              href: `/project/${p.id}`
            });
          });
        }

        if (notesRes.ok) {
          const data = await notesRes.json();
          const notes = (data.notes || []).filter((n: any) =>
            n.content?.toLowerCase().includes(query) ||
            n.category?.toLowerCase().includes(query)
          ).slice(0, 5);

          notes.forEach((n: any) => {
            results.push({
              type: "note",
              id: n.id,
              title: n.content?.substring(0, 50) + (n.content?.length > 50 ? "..." : ""),
              subtitle: n.category,
              href: "/creative"
            });
          });
        }
      } catch (err) {
        console.error("Search error:", err);
      }

      setSearchResults(results.slice(0, 10));
      setSearching(false);
    }

    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  function handleResultClick(result: SearchResult) {
    setSearchOpen(false);
    setSearchQuery("");
    setLocation(result.href);
  }

  const isStudio = user?.role === "studio";
  
  const navLinks = isStudio ? [
    { href: "/", label: "Dashboard" },
    { href: "/studio", label: "Studio" },
    { href: "/documents", label: "Documents" },
    { href: "/submissions", label: "Submissions" },
    { href: "/settings", label: "Settings" },
  ] : [
    { href: "/", label: "Dashboard" },
    { href: "/creative", label: "Creative" },
    { href: "/documents", label: "Documents" },
    { href: "/submissions", label: "Submissions" },
    { href: "/epk", label: "EPK" },
    { href: "/settings", label: "Settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="border-b border-theme p-3 sm:p-4 relative">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        <Link href="/">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            {/* Use a small animated GIF for the logo (falls back to static PNG) */}
            <LogoGif className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-lg sm:text-xl brand-font tracking-wider text-theme-primary">BOX</span>
          </div>
        </Link>

        {showNav && (
          <>
            <div ref={searchRef} className="relative hidden sm:block flex-1 max-w-xs mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search projects, notes, docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  className="w-full input-field px-3 py-1.5 rounded text-sm pl-8"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {searchOpen && !searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-secondary border border-theme rounded-lg shadow-lg z-50 p-3">
                  <p className="text-xs text-theme-muted mb-2">Try searching for:</p>
                  <div className="space-y-1 text-xs">
                    <button onClick={() => setSearchQuery("docs")} className="block w-full text-left px-2 py-1 rounded hover:bg-theme-tertiary text-theme-secondary">
                      "docs" - Documentation & guides
                    </button>
                    <button onClick={() => setSearchQuery("agreements")} className="block w-full text-left px-2 py-1 rounded hover:bg-theme-tertiary text-theme-secondary">
                      "agreements" - Generate contracts
                    </button>
                    <button onClick={() => setSearchQuery("community")} className="block w-full text-left px-2 py-1 rounded hover:bg-theme-tertiary text-theme-secondary">
                      "community" - Shared content
                    </button>
                  </div>
                  <p className="text-xs text-theme-muted mt-3 pt-2 border-t border-theme">
                    Also searches your projects and notes
                  </p>
                </div>
              )}

              {searchOpen && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-secondary border border-theme rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {searching && (
                    <div className="p-3 text-center text-theme-muted text-sm">Searching...</div>
                  )}
                  {!searching && searchResults.length === 0 && searchQuery && (
                    <div className="p-3 text-center text-theme-muted text-sm">No results found</div>
                  )}
                  {!searching && searchResults.map((result, i) => (
                    <button
                      key={`${result.type}-${result.id || i}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-3 py-2 hover:bg-theme-tertiary transition-colors flex items-center gap-3"
                    >
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        result.type === "project" ? "bg-accent text-accent-contrast" :
                        result.type === "note" ? "bg-theme-tertiary text-theme-muted" :
                        "bg-theme-primary text-theme-secondary"
                      }`}>
                        {result.type === "project" ? "PRJ" : result.type === "note" ? "NOTE" : "PAGE"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-theme-primary truncate">{result.title}</div>
                        {result.subtitle && (
                          <div className="text-xs text-theme-muted truncate">{result.subtitle}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}>
                  <span className={`text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-theme-primary font-bold" : "text-theme-muted hover:text-theme-primary"}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="text-theme-muted hover:text-theme-primary text-xs font-mono transition-colors"
                title="Toggle theme"
              >
                [{theme}]
              </button>

              <a href="/api/logout" className="hidden sm:inline text-theme-muted hover:text-theme-primary text-xs">
                Logout
              </a>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-1 text-theme-primary"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {menuOpen && showNav && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-theme-secondary border-b border-theme z-50">
          <nav className="flex flex-col p-4 space-y-3">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <span 
                  onClick={() => setMenuOpen(false)}
                  className={`block text-sm cursor-pointer py-2 px-3 rounded ${isActive(link.href) ? "bg-theme-tertiary text-theme-primary font-bold" : "text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary"}`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
            <div className="border-t border-theme pt-3 mt-2">
              <div className="flex items-center gap-2 px-3 py-2">
                {user?.profileImageUrl && (
                  <img src={user.profileImageUrl} alt="" className="w-6 h-6 rounded-full" />
                )}
                <span className="text-sm text-theme-secondary">{user?.firstName || user?.displayName || user?.email}</span>
              </div>
              <a 
                href="/api/logout" 
                className="block text-sm text-red-400 hover:text-red-300 px-3 py-2"
                onClick={() => setMenuOpen(false)}
              >
                Logout
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
