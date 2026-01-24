import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  showNav?: boolean;
}

export default function Header({ showNav = true }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/creative", label: "Creative Space" },
    { href: "/community", label: "Community" },
    { href: "/generator", label: "Agreements" },
    { href: "/docs", label: "Docs" },
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
            <img src="/box-logo.png" alt="BOX" className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-lg sm:text-xl brand-font tracking-wider text-theme-primary">BOX</span>
          </div>
        </Link>

        {showNav && (
          <>
            <nav className="hidden md:flex items-center gap-4">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}>
                  <span className={`text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-theme-primary font-bold" : "text-theme-secondary hover:text-theme-primary"}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className="text-theme-muted hover:text-theme-primary text-xs font-mono transition-colors"
              >
                [{theme}]
              </button>

              <div className="hidden sm:flex items-center gap-2">
                {user?.profileImageUrl && (
                  <img src={user.profileImageUrl} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                )}
                <span className="text-xs sm:text-sm text-theme-secondary">{user?.firstName || user?.displayName || user?.email}</span>
              </div>

              <a href="/api/logout" className="hidden sm:inline text-theme-secondary hover:text-red-400 text-xs sm:text-sm">
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
