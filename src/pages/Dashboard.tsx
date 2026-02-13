import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";
import Header from "../components/Header";
import { FileExplorer } from "../components/FileExplorer/FileExplorer";
import { FolderProvider, useFolderContext } from "../context/FolderContext";
import { Project } from "../types/folder";
import { Plus, Folder as FolderIcon, Search, Bell, Settings, Filter, Layers, FolderPlus } from 'lucide-react';
import { CreateFolderModal } from '../components/FileExplorer/modals/CreateFolderModal';

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

  const stats = {
    total: projects.length,
    concept: projects.filter(p => p.status === "concept").length,
    development: projects.filter(p => p.status === "development").length,
    published: projects.filter(p => p.status === "published").length,
  };

  const [showCreateFolder, setShowCreateFolder] = useState(false);

  return (
    <div className="min-h-screen bg-theme-primary text-theme-secondary font-sans selection:bg-theme-primary selection:text-theme-primary">
      <Header />

      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        parentId={selectedFolderId}
      />

      <main className="h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        {/* Retro Toolbar & Stats */}
        <div className="border-b border-theme bg-theme-secondary p-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold font-mono tracking-tight text-theme-primary">
                {selectedFolderId
                  ? `> ${folders.find(f => f.id === selectedFolderId)?.name || 'unk'}`
                  : '> root'}
              </h1>
              <p className="text-xs text-theme-muted font-mono mt-1">
                {filteredProjects.length} ITEM(S) LISTED
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateFolder(true)}
                className="px-3 py-1.5 border border-theme hover:bg-theme-primary hover:text-theme-primary hover:border-theme-primary transition-colors text-xs font-mono uppercase tracking-wider flex items-center gap-2"
              >
                [+] FOLDER
              </button>
              <button
                onClick={() => { setEditingProject(null); setShowModal(true); }}
                className="px-3 py-1.5 bg-theme-primary text-theme-primary border border-theme-primary hover:bg-theme-tertiary transition-colors text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2"
              >
                [+] PROJECT
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 sm:pb-0">
            {/* Filter Tabs - Retro Style */}
            <div className="flex border border-theme rounded-sm bg-theme-primary p-0.5">
              {["all", "concept", "development", "review", "published"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`
                    px-3 py-1 text-[10px] uppercase font-mono tracking-wider transition-all
                    ${filter === status
                      ? "bg-theme-primary text-theme-primary font-bold"
                      : "text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary"
                    }
                  `}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Mini Stats - Retro Style */}
            <div className="flex gap-4 text-[10px] font-mono text-theme-muted hidden sm:flex">
              <span className="flex items-center gap-1">
                TOTAL: <span className="text-theme-primary">{stats.total}</span>
              </span>
              <span className="flex items-center gap-1">
                DEV: <span className="text-blue-400">{stats.development}</span>
              </span>
              <span className="flex items-center gap-1">
                PUB: <span className="text-green-400">{stats.published}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <FileExplorer
            projects={filteredProjects}
            loading={loading || folderLoading}
            onProjectEdit={(project) => {
              setEditingProject(project);
              setShowModal(true);
            }}
            onProjectDelete={deleteProject}
          />
        </div>
      </main>

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
