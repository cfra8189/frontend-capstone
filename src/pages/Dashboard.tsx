import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";
import Header from "../components/Header";
import { FileExplorer } from "../components/FileExplorer/FileExplorer";
import { FolderProvider, useFolderContext } from "../context/FolderContext";
import { Project } from "../types/Project";

function DashboardContent() {
  const { user } = useAuth();
  const {
    folders,
    folderTree,
    selectedFolderId,
    selectFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    loading: folderLoading
  } = useFolderContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadProjects();
  }, [selectedFolderId]); // Reload projects when folder changes

  async function loadProjects() {
    try {
      setLoading(true);
      const url = selectedFolderId
        ? `/api/projects?folderId=${selectedFolderId}`
        : "/api/projects";

      const res = await fetch(url);
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
      folderId: selectedFolderId, // Add folderId to project
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
    <div className="min-h-screen bg-[#141414] text-zinc-300 font-sans">
      <Header />

      <main className="h-[calc(100vh-64px)] overflow-hidden">
        <FileExplorer
          projects={filteredProjects}
          loading={loading || folderLoading}
          onProjectEdit={(project) => {
            setEditingProject(project);
            setShowModal(true);
          }}
          onProjectDelete={deleteProject}
        />
      </main>

      {/* Project Create/Edit Modal */}

      {/* Project Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50">
          <div className="card p-4 sm:p-6 rounded-t-xl sm:rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-accent">
                {editingProject ? "Edit Project" : "New Project"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-theme-muted hover:text-theme-primary text-xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Title *</label>
                <input
                  name="title"
                  defaultValue={editingProject?.title}
                  required
                  className="input-field w-full p-2 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">Type</label>
                  <select name="type" defaultValue={editingProject?.type || "single"} className="input-field w-full p-2 rounded">
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="album">Album</option>
                    <option value="beat">Beat</option>
                    <option value="sample">Sample Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">Status</label>
                  <select name="status" defaultValue={editingProject?.status || "concept"} className="input-field w-full p-2 rounded">
                    <option value="concept">Concept</option>
                    <option value="development">Development</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingProject?.description || ""}
                  rows={3}
                  className="input-field w-full p-2 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">ISRC</label>
                  <input name="isrc" defaultValue={editingProject?.metadata?.isrc || ""} className="input-field w-full p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">UPC</label>
                  <input name="upc" defaultValue={editingProject?.metadata?.upc || ""} className="input-field w-full p-2 rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Copyright</label>
                <input name="copyright" defaultValue={editingProject?.metadata?.copyright || ""} className="input-field w-full p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Release Date</label>
                <input name="release_date" defaultValue={editingProject?.metadata?.release_date || ""} className="input-field w-full p-2 rounded" />
              </div>
              <button type="submit" className="w-full btn-primary font-bold py-3 rounded">
                {editingProject ? "Save Changes" : "Create Project"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <FolderProvider>
      <DashboardContent />
    </FolderProvider>
  );
}
