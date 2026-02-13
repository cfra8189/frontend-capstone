import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import Header from "../components/Header";
import { FolderProvider, useFolderContext } from "../context/FolderContext";
import { Project } from "../types/folder";
import { Plus, Folder as LucideFolder } from 'lucide-react';
import { CreateFolderModal } from '../components/FileExplorer/modals/CreateFolderModal';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { DesktopItem } from "../components/FileExplorer/DesktopItem";
import { FolderWindow } from "../components/FileExplorer/FolderWindow";
import { FolderIcon } from "../components/FileExplorer/FolderIcon";

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
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [openWindows, setOpenWindows] = useState<string[]>([]); // Current open folder IDs
  const [activeWindow, setActiveWindow] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
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
      folderId: activeWindow, // Default to active window's folder
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

  const toggleWindow = (folderId: string) => {
    if (openWindows.includes(folderId)) {
      setActiveWindow(folderId);
    } else {
      setOpenWindows([...openWindows, folderId]);
      setActiveWindow(folderId);
    }
  };

  const closeWindow = (folderId: string) => {
    setOpenWindows(openWindows.filter(id => id !== folderId));
    if (activeWindow === folderId) setActiveWindow(null);
  };

  const rootProjects = projects.filter(p => !p.folderId);
  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div className="min-h-screen bg-theme-primary text-theme-secondary font-sans selection:bg-theme-primary selection:text-theme-primary relative overflow-hidden">
      {/* CRT Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      <Header />

      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        parentId={activeWindow}
      />

      <main className="h-[calc(100vh-64px)] relative overflow-hidden flex flex-col">
        {/* Desktop Environment */}
        <div className="flex-1 relative p-6 overflow-hidden">
          {/* System Pulse Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[60vh] h-[60vh] bg-theme-primary opacity-[0.02] rounded-full blur-[120px] animate-pulse" />
          </div>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={async (event) => {
              const { active, over } = event;
              if (over && active.data.current?.type === 'project' && over.data.current?.type === 'folder') {
                const projectId = active.data.current.id;
                const folderId = over.data.current.id;
                try {
                  await fetch(`/api/projects/${projectId}/move`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folderId })
                  });
                  loadProjects();
                } catch (err) {
                  console.error("Move error:", err);
                }
              }
            }}
          >
            {/* Desktop Icons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-6 relative z-10">
              {rootFolders.map(folder => (
                <DesktopItem
                  key={folder.id}
                  id={folder.id}
                  type="folder"
                  title={folder.name}
                  onOpen={() => toggleWindow(folder.id)}
                />
              ))}
              {rootProjects.map(project => (
                <DesktopItem
                  key={project.id}
                  id={project.id}
                  type="project"
                  title={project.title}
                  iconVariant={project.type}
                  onOpen={() => {
                    setEditingProject(project);
                    setShowModal(true);
                  }}
                />
              ))}

              <button
                onClick={() => setShowCreateFolder(true)}
                className="flex flex-col items-center gap-2 p-2 rounded-sm hover:bg-theme-secondary/50 transition-all cursor-pointer w-24 group"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-dashed border-theme-muted group-hover:border-theme-primary transition-colors">
                  <Plus className="text-theme-muted group-hover:text-theme-primary" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-tight text-theme-muted">NEW_FOLDER</span>
              </button>

              <button
                onClick={() => { setEditingProject(null); setShowModal(true); }}
                className="flex flex-col items-center gap-2 p-2 rounded-sm hover:bg-theme-secondary/50 transition-all cursor-pointer w-24 group"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-dashed border-theme-muted group-hover:border-theme-primary transition-colors">
                  <Plus className="text-theme-muted group-hover:text-theme-primary" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-tight text-theme-muted">NEW_PROJECT</span>
              </button>
            </div>

            {/* Windows Area */}
            <div className="absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {openWindows.map((folderId, index) => {
                  const folder = folders.find(f => f.id === folderId);
                  if (!folder) return null;

                  const folderProjects = projects.filter(p => p.folderId === folderId);

                  return (
                    <div key={folderId} className="pointer-events-auto">
                      <FolderWindow
                        id={folderId}
                        title={folder.name}
                        zIndex={activeWindow === folderId ? 100 : 50 + index}
                        onFocus={() => setActiveWindow(folderId)}
                        onClose={() => closeWindow(folderId)}
                        initialPosition={{ x: 100 + (index * 40), y: 100 + (index * 40) }}
                      >
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {folderProjects.map(project => (
                            <DesktopItem
                              key={project.id}
                              id={project.id}
                              type="project"
                              title={project.title}
                              iconVariant={project.type}
                              onOpen={() => {
                                setEditingProject(project);
                                setShowModal(true);
                              }}
                            />
                          ))}
                          {folderProjects.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-theme-muted opacity-30 select-none">
                              <FolderIcon variant="outline" className="w-12 h-12 mb-2" />
                              <span className="text-[10px] font-mono uppercase tracking-[0.2em]">EMPTY_VOLUME</span>
                            </div>
                          )}
                        </div>
                      </FolderWindow>
                    </div>
                  );
                })}
              </AnimatePresence>
            </div>

            <DragOverlay>
              {/* Drag Overlay could be added here for smoother project dragging */}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Taskbar */}
        <div className="h-10 border-t border-theme bg-theme-secondary/80 backdrop-blur-md flex items-center justify-between px-4 select-none z-[200]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-theme-primary">SYSTEM_ROOT</span>
            </div>
            <div className="h-4 w-px bg-theme mx-2" />
            <div className="flex gap-2">
              {openWindows.map(id => (
                <button
                  key={id}
                  onClick={() => setActiveWindow(id)}
                  className={`px-3 py-1 text-[9px] font-mono uppercase border transition-all ${activeWindow === id ? 'bg-theme-primary text-theme-primary border-theme-primary shadow-sm' : 'text-theme-muted border-theme hover:border-theme-primary'}`}
                >
                  {folders.find(f => f.id === id)?.name || 'VOL'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-theme-muted">
            <span>MEM_READY</span>
            <span>OBJECTS: {projects.length + folders.length}</span>
            <span className="text-theme-primary font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </main>

      {/* Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[300]">
          <div className="bg-theme-secondary border border-theme p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-theme-primary uppercase font-mono">
                {editingProject ? "Update Object" : "Initialize New Object"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-theme-muted hover:text-theme-primary text-xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-theme-muted mb-1">Title</label>
                <input
                  name="title"
                  defaultValue={editingProject?.title}
                  required
                  className="w-full bg-theme-primary border border-theme p-2 text-sm text-theme-primary font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-theme-muted mb-1">Type</label>
                  <select name="type" defaultValue={editingProject?.type || "single"} className="w-full bg-theme-primary border border-theme p-2 text-sm text-theme-primary font-mono">
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="album">Album</option>
                    <option value="beat">Beat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-theme-muted mb-1">Status</label>
                  <select name="status" defaultValue={editingProject?.status || "concept"} className="w-full bg-theme-primary border border-theme p-2 text-sm text-theme-primary font-mono">
                    <option value="concept">Concept</option>
                    <option value="development">Development</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-theme-muted mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingProject?.description || ""}
                  rows={3}
                  className="w-full bg-theme-primary border border-theme p-2 text-sm text-theme-primary font-mono"
                />
              </div>
              <button type="submit" className="w-full bg-theme-primary text-theme-primary border border-theme font-bold py-3 uppercase tracking-widest hover:bg-theme-secondary transition-all">
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
