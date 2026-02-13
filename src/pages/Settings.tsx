import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import Header from "../components/Header";
import ProfileImageUpload from "../components/ProfileImageUpload";

export default function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.firstName || user?.displayName || "");
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || null);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileLoading(true);

    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfileMessage({ type: "success", text: "Profile updated successfully" });
        window.location.reload();
      } else {
        setProfileMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch (error) {
      setProfileMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.message || "Failed to change password" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to change password" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-theme-primary">Settings</h1>

        <section className="card p-6 rounded-xl mb-6">
          <h2 className="text-lg font-bold mb-4 text-theme-primary">Your BOX Code</h2>
          <div className="bg-theme-secondary p-4 rounded-lg mb-4">
            <p className="text-xs text-theme-muted mb-2">Share this code for collaborations and connections</p>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-mono font-bold text-accent tracking-wider">
                {user?.boxCode || "Generating..."}
              </code>
              <button
                onClick={() => {
                  if (user?.boxCode) {
                    navigator.clipboard.writeText(user.boxCode);
                    alert("BOX code copied to clipboard!");
                  }
                }}
                className="text-xs bg-theme-tertiary px-3 py-1 rounded hover:opacity-80"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-theme-muted mt-3">
              {user?.role === "studio" 
                ? "Artists can use this code to join your network when they sign up."
                : "Share this code with studios or other artists to connect and collaborate."}
            </p>
          </div>
        </section>

        <section className="card p-6 rounded-xl mb-6">
          <h2 className="text-lg font-bold mb-4 text-theme-primary">Profile Picture</h2>
          
          <div className="flex items-center gap-6 mb-6">
            <ProfileImageUpload
              currentImageUrl={profileImageUrl}
              onImageUpdate={setProfileImageUrl}
              size="large"
            />
            
            <div>
              <p className="text-sm text-theme-secondary mb-2">
                Upload a profile picture to personalize your account
              </p>
              <p className="text-xs text-theme-muted">
                Recommended: Square image, at least 200x200px<br/>
                Maximum file size: 5MB
              </p>
            </div>
          </div>
        </section>

        <section className="card p-6 rounded-xl mb-6">
          <h2 className="text-lg font-bold mb-4 text-theme-primary">Account Information</h2>
          <div className="space-y-2 text-theme-secondary mb-4">
            <p><span className="text-theme-muted">Email:</span> {user?.email || "N/A"}</p>
            <p><span className="text-theme-muted">Role:</span> {user?.role === "studio" ? "Studio / Business" : "Artist"}</p>
            <p><span className="text-theme-muted">Account Type:</span> {user?.authType === "email" ? "Email/Password" : "OAuth"}</p>
          </div>

          {profileMessage && (
            <div className={`p-3 rounded mb-4 ${profileMessage.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm text-theme-muted mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field w-full p-3 rounded"
                placeholder="Enter your display name"
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary py-2 px-4 rounded font-bold disabled:opacity-50"
            >
              {profileLoading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        {user?.authType === "email" && (
          <section className="card p-6 rounded-xl">
            <h2 className="text-lg font-bold mb-4 text-theme-primary">Change Password</h2>
            
            {message && (
              <div className={`p-3 rounded mb-4 ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm text-theme-muted mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field w-full p-3 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-theme-muted mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field w-full p-3 rounded"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm text-theme-muted mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field w-full p-3 rounded"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded font-bold disabled:opacity-50"
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </section>
        )}

        {user?.authType !== "email" && (
          <section className="card p-6 rounded-xl">
            <h2 className="text-lg font-bold mb-4 text-theme-primary">Password</h2>
            <p className="text-theme-muted">
              You signed in with OAuth (Google, GitHub, etc.). Password management is handled by your OAuth provider.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
