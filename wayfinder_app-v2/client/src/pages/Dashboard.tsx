import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";

interface Project {
  id: number;
  title: string;
  type: string;
  status: string;
  description: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const projectData = {
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      status: formData.get("status") as string,
      description: formData.get("description") as string,
      metadata: {
        isrc: formData.get("isrc") || null,
        upc: formData.get("upc") || null,
        copyright: formData.get("copyright") || null,
        release_date: formData.get("release_date") || null,
      },
    };

    const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects";
    const method = editingProject ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingProject(null);
        loadProjects();
      }
    } catch (error) {
      console.error("Failed to save project:", error);
    }
  }

  async function deleteProject(id: number) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) loadProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  }

  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(p => p.status === filter);

  const stats = {
    total: projects.length,
    concept: projects.filter(p => p.status === "concept").length,
    development: projects.filter(p => p.status === "development").length,
    published: projects.filter(p => p.status === "published").length,
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/box-logo.png" alt="The Box" className="w-8 h-8" />
            <span className="text-white font-bold">THE BOX</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/creative" className="text-gray-500 hover:text-white text-sm">
              Creative Space
            </Link>
            <Link href="/generator" className="text-gray-500 hover:text-white text-sm">
              Agreements
            </Link>
            <div className="flex items-center gap-2">
              {user?.profileImageUrl && (
                <img src={user.profileImageUrl} alt="" className="w-6 h-6 rounded-full" />
              )}
              <span className="text-sm text-gray-400">{user?.firstName || user?.email}</span>
            </div>
            <a href="/api/logout" className="text-gray-500 hover:text-red-400 text-sm">
              Logout
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Projects</h1>
            <p className="text-gray-500">Track your creative work from concept to publication</p>
          </div>
          <button
            onClick={() => { setEditingProject(null); setShowModal(true); }}
            className="bg-white text-black font-bold px-6 py-3 rounded hover:bg-gray-200"
          >
            + New Project
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="card p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-accent">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="card p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-gray-400">{stats.concept}</p>
            <p className="text-xs text-gray-500">Concept</p>
          </div>
          <div className="card p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.development}</p>
            <p className="text-xs text-gray-500">Development</p>
          </div>
          <div className="card p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-green-400">{stats.published}</p>
            <p className="text-xs text-gray-500">Published</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {["all", "concept", "development", "review", "published"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded text-sm ${filter === status ? "bg-white text-black" : "bg-gray-800 text-gray-400"}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No projects yet. Create your first one!
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className="card p-4 rounded-xl hover:border-gray-600 cursor-pointer"
                onClick={() => { setEditingProject(project); setShowModal(true); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`status-${project.status} px-2 py-1 rounded text-xs uppercase`}>
                      {project.status}
                    </span>
                    <div>
                      <p className="font-bold">{project.title}</p>
                      <p className="text-xs text-gray-500">{project.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/project/${project.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-500 hover:text-accent text-sm"
                    >
                      Details
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      className="text-gray-500 hover:text-red-400 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50">
          <div className="card p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-accent">
                {editingProject ? "Edit Project" : "New Project"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white text-xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input
                  name="title"
                  defaultValue={editingProject?.title}
                  required
                  className="input-field w-full p-2 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select name="type" defaultValue={editingProject?.type || "single"} className="input-field w-full p-2 rounded">
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="album">Album</option>
                    <option value="beat">Beat</option>
                    <option value="sample">Sample Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select name="status" defaultValue={editingProject?.status || "concept"} className="input-field w-full p-2 rounded">
                    <option value="concept">Concept</option>
                    <option value="development">Development</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingProject?.description || ""}
                  rows={3}
                  className="input-field w-full p-2 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">ISRC</label>
                  <input name="isrc" defaultValue={editingProject?.metadata?.isrc || ""} className="input-field w-full p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">UPC</label>
                  <input name="upc" defaultValue={editingProject?.metadata?.upc || ""} className="input-field w-full p-2 rounded" />
                </div>
              </div>
              <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded">
                {editingProject ? "Save Changes" : "Create Project"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
