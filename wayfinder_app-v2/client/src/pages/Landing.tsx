import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../context/ThemeContext";

export default function Landing() {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"artist" | "studio">("artist");
  const [businessName, setBusinessName] = useState("");
  const [studioCode, setStudioCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" 
        ? { email, password, displayName, firstName, lastName, role, businessName: role === "studio" ? businessName : null, studioCode: role === "artist" && studioCode ? studioCode : null }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsVerification) {
          setEmail(data.email || email);
          setMode("verify");
          return;
        }
        setError(data.message || "Something went wrong");
        return;
      }

      if (data.needsVerification) {
        setMode("verify");
        setMessage(data.message);
        return;
      }

      // Invalidate and refetch auth state, then redirect
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.reload();
    } catch (err) {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setResending(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Verification email sent! Check your inbox.");
      } else {
        setError(data.message || "Failed to resend email");
      }
    } catch (err) {
      setError("Failed to resend verification email");
    } finally {
      setResending(false);
    }
  }

  if (mode === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full text-center">
          <img src="/box-logo.png" alt="BOX" className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6" />
          <span className="text-xl sm:text-2xl brand-font tracking-wider block mb-3 sm:mb-4">BOX</span>
          <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Check Your Email</h1>
          <p className="text-sm sm:text-base text-theme-secondary mb-4 sm:mb-6">
            We've sent a verification link to <span className="text-accent break-all">{email}</span>
          </p>
          <p className="text-theme-muted text-xs sm:text-sm mb-6 sm:mb-8">
            Click the link in the email to verify your account. The link expires in 24 hours.
          </p>

          {message && <p className="text-green-400 text-xs sm:text-sm mb-4">{message}</p>}
          {error && <p className="text-red-400 text-xs sm:text-sm mb-4">{error}</p>}

          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full bg-theme-tertiary text-theme-primary font-bold py-3 sm:py-4 rounded-lg hover:opacity-80 transition-colors disabled:opacity-50 mb-4 text-sm sm:text-base"
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </button>

          <button
            onClick={() => setMode("login")}
            className="text-theme-muted hover:text-theme-primary text-xs sm:text-sm"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-theme-primary">
      <div className="hidden lg:flex lg:w-1/2 bg-theme-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <img src="/box-logo.png" alt="BOX" className="w-10 h-10" />
            <span className="text-2xl brand-font tracking-wider">BOX</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Your Creative Work,{" "}
            <span className="text-accent">Protected.</span>
          </h1>
          <p className="text-theme-secondary text-lg max-w-md">
            Track projects from concept to publication. Manage metadata, generate agreements, and protect your intellectual property.
          </p>
        </div>
        <div className="text-theme-muted text-sm">
          <p>&copy; 2026 BOX by luctheleo.com | REVERIE | RVR Creative Development</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full">
          <div className="lg:hidden flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <img src="/box-logo.png" alt="BOX" className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-xl sm:text-2xl brand-font tracking-wider">BOX</span>
          </div>
          
          <button
            onClick={toggleTheme}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-theme-muted hover:text-theme-primary text-xs font-mono transition-colors"
          >
            [{theme}]
          </button>

          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm sm:text-base text-theme-secondary">
              {mode === "login" ? "Sign in to manage your creative assets" : "Join BOX today"}
            </p>
          </div>

          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full bg-white text-black font-bold py-3 px-8 rounded-lg transition-colors hover:bg-gray-100 text-center mb-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-theme-tertiary" />
            <span className="text-theme-muted text-sm">or use email</span>
            <div className="flex-1 h-px bg-theme-tertiary" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm text-theme-secondary mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("artist")}
                      className={`p-3 rounded-lg border-2 transition-colors text-left ${
                        role === "artist" 
                          ? "border-accent bg-theme-tertiary" 
                          : "border-theme-tertiary bg-theme-secondary"
                      }`}
                    >
                      <p className="font-bold text-sm">Artist</p>
                      <p className="text-xs text-theme-muted">Individual creator</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("studio")}
                      className={`p-3 rounded-lg border-2 transition-colors text-left ${
                        role === "studio" 
                          ? "border-accent bg-theme-tertiary" 
                          : "border-theme-tertiary bg-theme-secondary"
                      }`}
                    >
                      <p className="font-bold text-sm">Studio</p>
                      <p className="text-xs text-theme-muted">Manage artists</p>
                    </button>
                  </div>
                </div>

                {role === "studio" && (
                  <div>
                    <label className="block text-sm text-theme-secondary mb-1">Business Name *</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="input-field w-full p-3 rounded"
                      placeholder="Your studio or label name"
                      required
                    />
                  </div>
                )}

                {role === "artist" && (
                  <div>
                    <label className="block text-sm text-theme-secondary mb-1">Studio Code (Optional)</label>
                    <input
                      type="text"
                      value={studioCode}
                      onChange={(e) => setStudioCode(e.target.value.toUpperCase())}
                      className="input-field w-full p-3 rounded font-mono"
                      placeholder="BOX-XXXXXX"
                      maxLength={12}
                    />
                    <p className="text-xs text-theme-muted mt-1">Have a studio code? Enter it to join their network.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-theme-secondary mb-1">
                    {role === "artist" ? "Artist / Stage Name *" : "Your Name *"}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field w-full p-3 rounded"
                    placeholder={role === "artist" ? "Your stage name" : "Your name"}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-theme-secondary mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-field w-full p-3 rounded"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-theme-secondary mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-field w-full p-3 rounded"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-theme-secondary mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full p-3 rounded"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-theme-secondary mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full p-3 rounded"
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-theme-tertiary text-theme-primary font-bold py-4 rounded-lg hover:opacity-80 transition-colors disabled:opacity-50"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-theme-muted text-sm mt-6">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => setMode("register")} className="text-accent hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-accent hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>

          <div className="mt-8 pt-6 border-t border-theme">
            <h3 className="text-sm font-bold text-theme-secondary mb-4 text-center">Features</h3>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-theme-secondary rounded-lg">
                <p className="font-bold text-sm mb-1">Project Tracking</p>
                <p className="text-xs text-theme-muted">Concept to publication</p>
              </div>
              <div className="p-3 bg-theme-secondary rounded-lg">
                <p className="font-bold text-sm mb-1">IP Protection</p>
                <p className="text-xs text-theme-muted">Step-by-step guidance</p>
              </div>
              <div className="p-3 bg-theme-secondary rounded-lg">
                <p className="font-bold text-sm mb-1">Agreements</p>
                <p className="text-xs text-theme-muted">Generate legal docs</p>
              </div>
              <div className="p-3 bg-theme-secondary rounded-lg">
                <p className="font-bold text-sm mb-1">Creative Space</p>
                <p className="text-xs text-theme-muted">Private inspiration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
