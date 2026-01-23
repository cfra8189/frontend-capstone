import { useState } from "react";

export default function Landing() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" 
        ? { email, password, firstName, lastName }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      window.location.href = "/";
    } catch (err) {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-black font-bold text-xl">
              W
            </div>
            <span className="text-xl font-bold">WayfinderOS</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Your Creative Work,{" "}
            <span className="text-accent">Protected.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Track projects from concept to publication. Manage metadata, generate agreements, and protect your intellectual property.
          </p>
        </div>
        <div className="text-gray-600 text-sm">
          <p>&copy; 2026 WayfinderOS. REVERIE | RVR Creative Development</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-black font-bold text-xl">
              W
            </div>
            <span className="text-xl font-bold">WayfinderOS</span>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-400">
              {mode === "login" ? "Sign in to manage your creative assets" : "Join WayfinderOS today"}
            </p>
          </div>

          <a
            href="/api/login"
            className="block w-full bg-accent text-black font-bold py-4 px-8 rounded-lg hover:bg-green-400 transition-colors text-center mb-4"
          >
            Continue with OAuth
          </a>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-500 text-sm">or use email</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-field w-full p-3 rounded"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-field w-full p-3 rounded"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
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
              <label className="block text-sm text-gray-400 mb-1">Password</label>
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
              className="w-full bg-gray-700 text-white font-bold py-4 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
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

          <div className="mt-8 pt-6 border-t border-gray-800">
            <h3 className="text-sm font-bold text-gray-400 mb-4 text-center">Features</h3>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-gray-900 rounded-lg">
                <p className="font-bold text-sm mb-1">Project Tracking</p>
                <p className="text-xs text-gray-500">Concept to publication</p>
              </div>
              <div className="p-3 bg-gray-900 rounded-lg">
                <p className="font-bold text-sm mb-1">IP Protection</p>
                <p className="text-xs text-gray-500">Step-by-step guidance</p>
              </div>
              <div className="p-3 bg-gray-900 rounded-lg">
                <p className="font-bold text-sm mb-1">Agreements</p>
                <p className="text-xs text-gray-500">Generate legal docs</p>
              </div>
              <div className="p-3 bg-gray-900 rounded-lg">
                <p className="font-bold text-sm mb-1">Creative Space</p>
                <p className="text-xs text-gray-500">Private inspiration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
