import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";
import Header from "../components/Header";
import FolderTree from "../components/FolderTree";
import MoveProjectModal from "../components/MoveProjectModal";
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
    moveProjectToFolder,
    loading: folderLoading 
  } = useFolderContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState("all");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveProjectId, setMoveProjectId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex gap-6">
          {/* Folder Tree Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Folders</h2>
                <button
                  onClick={() => createFolder()}
                  className="w-6 h-6 flex items-center justify-center text-theme-muted hover:text-accent"
                  title="Create folder"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              
              {folderLoading ? (
                <div className="text-center text-theme-muted py-4">
                  <div className="animate-pulse">Loading folders...</div>
                </div>
              ) : (
                <FolderTree
                  folders={folderTree.folders}
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={(folder) => selectFolder(folder.id)}
                  onFolderCreate={createFolder}
                  onFolderRename={(folder) => {
                    const newName = prompt('Enter new name:', folder.name);
                    if (newName && newName.trim() && newName !== folder.name) {
                      renameFolder(folder, newName.trim());
                    }
                  }}
                  onFolderDelete={deleteFolder}
                />
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  {selectedFolderId 
                    ? `Projects in ${folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}`
                    : 'Your Projects'
                  }
                </h1>
                <p className="text-sm sm:text-base text-theme-secondary">Track your creative work from concept to publication</p>
              </div>
              <button
                onClick={() => { setEditingProject(null); setShowModal(true); }}
                className="btn-primary font-bold px-4 sm:px-6 py-2 sm:py-3 rounded text-sm sm:text-base w-full sm:w-auto"
              >
                + New Project
              </button>
            </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="card p-3 sm:p-4 rounded-xl text-center">
            <p className="text-2xl sm:text-3xl font-bold text-accent">{stats.total}</p>
            <p className="text-xs text-theme-muted">Total</p>
          </div>
          <div className="card p-3 sm:p-4 rounded-xl text-center">
            <p className="text-2xl sm:text-3xl font-bold text-theme-secondary">{stats.concept}</p>
            <p className="text-xs text-theme-muted">Concept</p>
          </div>
          <div className="card p-3 sm:p-4 rounded-xl text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-500">{stats.development}</p>
            <p className="text-xs text-theme-muted">Development</p>
          </div>
          <div className="card p-3 sm:p-4 rounded-xl text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-500">{stats.published}</p>
            <p className="text-xs text-theme-muted">Published</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {["all", "concept", "development", "review", "published"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm whitespace-nowrap ${filter === status ? "btn-primary" : "bg-theme-tertiary text-theme-secondary"}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-theme-muted">Loading...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-theme-muted">
            No projects yet. Create your first one!
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className="card p-3 sm:p-4 rounded-xl hover:border-theme cursor-pointer"
                onClick={() => { setEditingProject(project); setShowModal(true); }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className={`status-${project.status} px-2 py-1 rounded text-xs uppercase`}>
                      {project.status}
                    </span>
                    <div>
                      <p className="font-bold text-sm sm:text-base">{project.title}</p>
                      <p className="text-xs text-theme-muted">{project.type}</p>

                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMoveProjectId(project.id.toString());
                        setShowMoveModal(true);
                      }}
                      className="text-theme-muted hover:text-accent text-xs sm:text-sm"
                      title="Move project"
                    >
                      Move
                    </button>
                    <Link
                      href={`/project/${project.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-theme-muted hover:text-accent text-xs sm:text-sm"
                    >
                      Details
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      className="text-theme-muted hover:text-red-400 text-xs sm:text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </main>

      {/* Move Project Modal */}
      <MoveProjectModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMoveProject={(projectId, folderId) => {
          moveProjectToFolder(projectId, folderId);
          loadProjects();
        }}
        projectId={moveProjectId || ''}
        projectName={projects.find(p => p.id.toString() === moveProjectId)?.title || ''}
        currentFolderId={selectedFolderId}
        folders={folders}
      />

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
