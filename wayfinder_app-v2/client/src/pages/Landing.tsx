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
        ? { email, password, displayName, firstName, lastName }
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
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <img src="/box-logo.png" alt="BOX" className="w-16 h-16 mx-auto mb-6" />
          <span className="text-2xl brand-font tracking-wider block mb-4">BOX</span>
          <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
          <p className="text-theme-secondary mb-6">
            We've sent a verification link to <span className="text-accent">{email}</span>
          </p>
          <p className="text-theme-muted text-sm mb-8">
            Click the link in the email to verify your account. The link expires in 24 hours.
          </p>

          {message && <p className="text-green-400 text-sm mb-4">{message}</p>}
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full bg-theme-tertiary text-theme-primary font-bold py-4 rounded-lg hover:opacity-80 transition-colors disabled:opacity-50 mb-4"
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </button>

          <button
            onClick={() => setMode("login")}
            className="text-theme-muted hover:text-theme-primary text-sm"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-theme-secondary p-12 flex-col justify-between">
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/box-logo.png" alt="BOX" className="w-10 h-10" />
            <span className="text-2xl brand-font tracking-wider">BOX</span>
          </div>
          
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 rounded-lg bg-theme-secondary border border-theme text-theme-secondary hover:text-theme-primary transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-theme-secondary">
              {mode === "login" ? "Sign in to manage your creative assets" : "Join BOX today"}
            </p>
          </div>

          <a
            href="/api/login"
            className="block w-full btn-primary font-bold py-4 px-8 rounded-lg transition-colors text-center mb-4"
          >
            Continue with OAuth
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
                  <label className="block text-sm text-theme-secondary mb-1">Artist / Business Name *</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field w-full p-3 rounded"
                    placeholder="Your stage name or business"
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
