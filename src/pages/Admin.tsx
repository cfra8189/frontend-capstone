import { useState, useEffect } from "react";
import { Link } from "wouter";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface Project {
  id: number;
  userId: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalProjects: number;
  projectsByStatus: Record<string, number>;
}

interface Submission {
  id: number;
  noteId: number;
  userId: number;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  approvedAt: string | null;
  noteContent: string;
  noteCategory: string;
  noteMediaUrls: string[];
  noteTags: string[];
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "projects" | "submissions">("overview");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/check");
      if (res.ok) {
        setIsAuthenticated(true);
        loadData();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        loadData();
      } else {
        setError("Invalid password");
      }
    } catch (error) {
      setError("Login failed");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setUsers([]);
    setProjects([]);
    setStats(null);
  }

  async function loadData() {
    try {
      const [usersRes, projectsRes, statsRes, submissionsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/projects"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/submissions"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  async function reviewSubmission(id: number, status: "approved" | "rejected", adminNotes?: string) {
    try {
      const res = await fetch(`/api/admin/submissions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error("Failed to review submission:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <p className="text-theme-muted">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <div className="card p-8 rounded-xl max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="text-xl font-bold">Admin Access</span>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full p-3 rounded"
                placeholder="Enter admin password"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-red-500 text-white font-bold py-3 rounded hover:bg-red-600">
              Login as Admin
            </button>
          </form>
          <Link href="/" className="block text-center text-gray-500 hover:text-white mt-4 text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <header className="border-b border-theme p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <span className="text-red-400 font-bold">ADMIN DASHBOARD</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-white text-sm">
              View Site
            </Link>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {(["overview", "users", "projects", "submissions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm ${activeTab === tab ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400"}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-6 rounded-xl text-center">
                <p className="text-3xl font-bold text-red-400">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
              <div className="card p-6 rounded-xl text-center">
                <p className="text-3xl font-bold text-accent">{stats.totalProjects}</p>
                <p className="text-xs text-gray-500">Total Projects</p>
              </div>
              <div className="card p-6 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-400">{stats.projectsByStatus?.development || 0}</p>
                <p className="text-xs text-gray-500">In Development</p>
              </div>
              <div className="card p-6 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-400">{stats.projectsByStatus?.published || 0}</p>
                <p className="text-xs text-gray-500">Published</p>
              </div>
            </div>
            <div className="card p-6 rounded-xl">
              <h3 className="font-bold mb-4">Projects by Status</h3>
              <div className="space-y-2">
                {Object.entries(stats.projectsByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{status}</span>
                    <span className="text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">All Users ({users.length})</h2>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="card p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-gray-500 text-center py-8">No users yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">All Projects ({projects.length})</h2>
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="card p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className={`status-${project.status} px-2 py-1 rounded text-xs uppercase`}>
                        {project.status}
                      </span>
                      <div>
                        <p className="font-bold">{project.title}</p>
                        <p className="text-xs text-gray-500">{project.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">User: {project.userId.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-gray-500 text-center py-8">No projects yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Community Submissions</h2>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="card p-6 rounded-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs text-gray-400 uppercase">{submission.noteCategory}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                        submission.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        submission.status === "approved" ? "bg-green-500/20 text-green-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {submission.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-4 whitespace-pre-wrap">{submission.noteContent}</p>
                  
                  {submission.noteTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {submission.noteTags.map((tag: string, i: number) => (
                        <span key={i} className="text-xs bg-gray-700 px-2 py-0.5 rounded">#{tag}</span>
                      ))}
                    </div>
                  )}

                  {submission.status === "pending" && (
                    <div className="flex gap-2 pt-4 border-t border-gray-700">
                      <button
                        onClick={() => reviewSubmission(submission.id, "approved")}
                        className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reviewSubmission(submission.id, "rejected")}
                        className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="text-gray-500 text-center py-8">No submissions yet</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
