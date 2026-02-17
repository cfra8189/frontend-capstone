import { useState, useEffect, useRef } from "react";
import LogoGif from "./LogoGif";
import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { useTheme } from "../context/ThemeContext";
import { ChevronRight, Sun, Moon } from "lucide-react";

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
    { type: "page", title: "Docs", subtitle: "IP & Copyright Guide", href: "/docs" },
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
    <header className="w-full border-b border-theme p-3 sm:p-4 sticky top-0 z-[150] bg-theme-primary animate-sync-border">
      <div className="w-full flex items-center justify-between gap-4 px-2 sm:px-6">
        <Link href="/">
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:scale-105">
              <LogoGif />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-lg font-bold brand-font tracking-[0.3em] leading-tight text-theme-primary animate-sync-text">
                BOX
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[7px] sm:text-[9px] font-mono text-theme-muted tracking-widest uppercase">
                  ID: BOX-WFKZY6 //
                </span>
                <span className="text-[7px] sm:text-[9px] font-mono text-accent tracking-widest uppercase animate-pulse">
                  VAULT_ACTIVE
                </span>
              </div>
            </div>
          </div>
        </Link>

        {showNav && (
          <>
            <div ref={searchRef} className="relative hidden lg:block flex-1 max-w-xs mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="SEARCH_VAULT_DATABASE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  className="w-full bg-theme-secondary border border-theme px-3 py-1.5 rounded text-[10px] pl-8 font-mono uppercase tracking-[0.2em] outline-none focus:border-theme-primary transition-all placeholder:text-theme-muted/50 animate-sync-search"
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
                      <span className={`text-xs px-1.5 py-0.5 rounded ${result.type === "project" ? "bg-accent text-accent-contrast" :
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

            <nav className="hidden xl:flex items-center gap-6">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}>
                  <span className={`text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-theme-primary font-bold" : "text-theme-muted hover:text-theme-primary"}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleTheme}
                className="text-[9px] sm:text-[10px] font-mono font-bold text-theme-primary px-3 py-1.5 hover:bg-theme-secondary/50 transition-all uppercase tracking-[0.3em] hover:opacity-100"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                [{theme === 'dark' ? 'light' : 'dark'}]
              </button>

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] font-bold text-accent tracking-widest uppercase">ACCESS_GRANTED</span>
                    <span className="text-[8px] font-mono text-theme-muted uppercase">{user.displayName || user.email}</span>
                  </div>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 transition-all text-theme-primary xl:hidden"
                  >
                    <div className="space-y-1.5 w-5 sm:w-6 transition-all group">
                      <span className={`block h-[1px] bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                      <span className={`block h-[1px] bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                      <span className={`block h-[1px] bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </div>
                  </button>
                </div>
              ) : (
                <Link href="/auth">
                  <span className="text-xs font-bold border border-theme px-3 py-1.5 hover:bg-theme-secondary transition-all cursor-pointer tracking-widest">
                    INITIALIZE_AUTH
                  </span>
                </Link>
              )}
            </div>
          </>
        )}
      </div>

      {menuOpen && showNav && (
        <div className="xl:hidden absolute top-full left-0 right-0 bg-theme-secondary/95 backdrop-blur-3xl border-b border-theme z-50 shadow-2xl overflow-hidden">
          <nav className="flex flex-col p-4 space-y-3">
            {/* Mobile Search */}
            <div className="lg:hidden relative mb-4">
              <input
                type="text"
                placeholder="SEARCH_VAULT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-theme-primary/50 border border-theme px-4 py-3 rounded text-sm font-mono uppercase tracking-[0.2em] outline-none focus:border-theme-primary transition-all"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {searchQuery && (
                <div className="mt-2 bg-theme-secondary/80 backdrop-blur-xl border border-theme/30 rounded max-h-60 overflow-y-auto shadow-xl">
                  {searching ? (
                    <div className="p-3 text-center text-theme-muted text-xs">SEARCHING...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-center text-theme-muted text-xs">NO_RESULTS_FOUND</div>
                  ) : searchResults.map((result, i) => (
                    <button
                      key={`mobile-${result.type}-${result.id || i}`}
                      onClick={() => {
                        handleResultClick(result);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-theme-tertiary transition-colors border-b border-theme/5 last:border-0 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-theme-primary truncate">{result.title}</div>
                        <div className="text-[10px] text-theme-muted uppercase tracking-widest">{result.type}</div>
                      </div>
                      <ChevronRight size={14} className="text-theme-muted" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <span
                  onClick={() => setMenuOpen(false)}
                  className={`block text-base cursor-pointer py-3 px-4 rounded border border-transparent transition-all ${isActive(link.href) ? "bg-theme-primary/10 text-theme-primary font-bold border-theme-primary/30" : "text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary"}`}
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
