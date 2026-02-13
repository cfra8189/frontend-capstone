import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import Header from "../components/Header";
import { FolderProvider, useFolderContext } from "../context/FolderContext";
import { Project } from "../types/folder";
import { FileExplorer } from "../components/FileExplorer/FileExplorer";
import GlobalEffects from "../components/GlobalEffects";

function DashboardContent() {
  const { user } = useAuth();
  const {
    folders,
    selectedFolderId,
    loading: folderLoading
  } = useFolderContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadProjects();
  }, [selectedFolderId]);

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
      folderId: selectedFolderId,
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

  async function deleteProject(id: string) {
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

  return (
    <div className="min-h-screen bg-theme-primary text-theme-secondary font-mono relative flex flex-col overflow-hidden">
      <GlobalEffects opacity={0.12} />

      {/* CRT Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      <Header />

      <main className="flex-1 p-4 lg:p-10 overflow-hidden relative z-10">
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

      {/* Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-[300] backdrop-blur-3xl">
          <div className="bg-theme-secondary/80 border border-theme p-6 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-theme-primary uppercase tracking-widest">
                {editingProject ? "Update Object" : "Initialize New Object"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-theme-muted hover:text-theme-primary text-xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-theme-muted mb-1 tracking-widest">Title</label>
                <input
                  name="title"
                  defaultValue={editingProject?.title}
                  required
                  className="w-full bg-theme-primary border border-theme p-2 text-sm text-theme-primary font-mono outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-theme-muted mb-1 tracking-widest">Type</label>
                  <select
                    name="type"
                    defaultValue={editingProject?.type || "single"}
                    className="w-full bg-theme-primary border border-theme p-2 text-sm text-theme-primary font-mono outline-none"
                  >
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="album">Album</option>
                    <option value="beat">Beat</option>
                    <option value="sample">Sample Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-theme-muted mb-1 tracking-widest">Status</label>
                  <select
                    name="status"
                    defaultValue={editingProject?.status || "concept"}
                    className="w-full bg-theme-primary border border-theme p-2 text-sm text-theme-primary font-mono outline-none"
                  >
                    <option value="concept">Concept</option>
                    <option value="development">Development</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-theme-muted mb-1 tracking-widest">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingProject?.description || ""}
                  rows={3}
                  className="w-full bg-theme-primary border border-theme p-2 text-sm text-theme-primary font-mono outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-theme-primary text-theme-primary border border-theme font-bold py-3 uppercase tracking-widest hover:bg-theme-secondary transition-all"
              >
                {editingProject ? "Confirm Changes" : "Create Object"}
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
