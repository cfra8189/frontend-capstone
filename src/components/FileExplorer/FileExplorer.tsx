
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    pointerWithin,
    rectIntersection,
    useDroppable,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { FileText, Plus, FolderPlus, Check, Search, FileJson } from 'lucide-react';
import { ProjectGrid } from './ProjectGrid';
import { Sidebar } from './Sidebar';
import { useFolderContext } from '../../context/FolderContext';
import { Project, Folder } from '../../types/folder';
import { CreateFolderModal } from './modals/CreateFolderModal';
import { MoveToFolderModal } from './modals/MoveToFolderModal';
import CreativeSpaceContent from '../Creative/CreativeSpaceContent';
import { useNotifications, Notifications } from '../Notifications';

interface FileExplorerProps {
    projects: Project[];
    loading: boolean;
    onProjectEdit: (project: Project) => void;
    onProjectDelete: (id: string) => void;
    onRefresh: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
    projects,
    loading,
    onProjectEdit,
    onProjectDelete,
    onRefresh
}) => {
    const { moveProject, selectedFolderId, folders, deleteFolder } = useFolderContext();
    const { success, error, notifications, removeNotification } = useNotifications();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
    const [movingProjectTitle, setMovingProjectTitle] = useState<string>('');
    const [view, setView] = useState<'files' | 'creative'>('files');

    const { setNodeRef: setGridDropRef, isOver: isOverGrid } = useDroppable({
        id: `grid-${selectedFolderId || 'root'}`,
        data: { type: 'folder', id: selectedFolderId || null }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const activeId = event.active.id as string;
        const projectId = activeId.replace('project-', '');

        setActiveId(projectId);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        // Strip 'project-' to get the real ID
        const activeIdRaw = active.id as string;
        const projectId = activeIdRaw.replace('project-', '');

        setActiveId(null);

        if (!over) return;

        const project = projects.find(p => p.id === projectId);

        if (!project) return;

        // Check if dropping on a folder
        if (over.data.current?.type === 'folder') {
            const targetFolderId = over.data.current.id;
            const targetFolderName = over.data.current.name || 'folder';

            try {
                await moveProject(projectId, targetFolderId);
                success(`"${project.title}" moved to "${targetFolderName}"`);
                onRefresh(); // Refresh the project list
            } catch (err) {
                console.error('D&D: Failed to move project:', err);
                error(err instanceof Error ? err.message : 'Failed to move project');
            }
        }
    };


    const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <CreateFolderModal
                isOpen={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                parentId={selectedFolderId}
            />

            <MoveToFolderModal
                isOpen={movingProjectId !== null}
                onClose={() => {
                    setMovingProjectId(null);
                    setMovingProjectTitle('');
                }}
                projectId={movingProjectId}
                projectTitle={movingProjectTitle}
                currentFolderId={selectedFolderId}
                onSuccess={onRefresh}
            />

            <div className="bg-theme-secondary/20 backdrop-blur-2xl text-theme-primary rounded-lg border border-theme/30 shadow-2xl relative z-10 transition-all duration-500 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-theme/30 bg-theme-primary/10 backdrop-blur-md">
                    <button
                        onClick={() => setView('files')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-theme-secondary/20 ${view === 'files' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-theme-muted border-b-2 border-transparent'}`}
                    >
                        PROJECT_FILES
                    </button>
                    <button
                        onClick={() => setView('creative')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-theme-secondary/20 ${view === 'creative' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-theme-muted border-b-2 border-transparent'}`}
                    >
                        CREATIVE_SPACE
                    </button>
                </div>

                {view === 'files' ? (
                    <div className="flex flex-1 overflow-hidden">
                        <Sidebar
                            className="w-64 flex-shrink-0"
                            onDeleteFolder={(folder) => deleteFolder(folder)}
                            onRenameFolder={() => { }} // Sidebar handles its own renaming state
                        />

                        <div
                            ref={setGridDropRef}
                            className={`flex-1 flex flex-col min-w-0 relative transition-all duration-300 ${isOverGrid ? 'bg-theme-primary/10 ring-2 ring-inset ring-theme-primary/30' : ''}`}
                        >
                            {/* Interior Toolbar */}
                            <div className="border-b border-theme/20 p-3 flex items-center justify-between bg-transparent backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-3 bg-theme-primary animate-pulse" />
                                    <span className="text-[10px] font-mono font-bold text-theme-primary uppercase tracking-[0.3em]">
                                        {selectedFolderId ? folders.find(f => f._id === selectedFolderId)?.name || 'Folder' : 'ROOT_PROJECTS'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowCreateFolder(true)}
                                        className="flex items-center gap-2 px-3 py-1 border border-theme hover:bg-theme-secondary hover:text-theme-primary transition-all text-[9px] font-mono uppercase tracking-widest group"
                                    >
                                        <FolderPlus size={12} className="opacity-50 group-hover:opacity-100" />
                                        <span>NEW_FOLDER</span>
                                    </button>
                                    <button
                                        onClick={() => onProjectEdit(null as any)}
                                        className="flex items-center gap-2 px-3 py-1 bg-theme-primary text-theme-primary border border-theme hover:bg-theme-secondary transition-all text-[9px] font-bold font-mono uppercase tracking-widest group"
                                    >
                                        <Plus size={12} />
                                        <span>NEW_PROJECT</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <ProjectGrid
                                    projects={projects}
                                    loading={loading}
                                    onEdit={onProjectEdit}
                                    onDelete={onProjectDelete}
                                    onMoveProject={(project) => {
                                        setMovingProjectId(project.id);
                                        setMovingProjectTitle(project.title);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <CreativeSpaceContent />
                )}
            </div>

            {/* Drag Overlay - Portaled to body to ensure it's above everything */}
            {typeof document !== 'undefined' && createPortal(
                <DragOverlay
                    dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}
                    style={{ zIndex: 9999, pointerEvents: 'none' }}
                >
                    {activeProject ? (
                        <div className="
                            relative w-64 p-3 rounded-lg 
                            bg-theme-secondary/90 backdrop-blur-xl 
                            border border-accent shadow-[0_0_30px_-5px_var(--accent)]
                            cursor-grabbing scale-105 -rotate-2 origin-center 
                            transition-all duration-200 ease-out
                            group pointer-events-none z-[9999]
                            overflow-hidden ring-1 ring-white/10
                        ">
                            {/* Decorative corner accents */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-accent" />
                            <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-accent" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-accent" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-accent" />

                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 bg-accent/20 flex items-center justify-center rounded-md border border-accent/30 text-accent">
                                    <FileJson size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-theme-primary text-xs truncate uppercase tracking-wider mb-0.5">{activeProject.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded-sm uppercase tracking-widest border border-accent/20">
                                            MOVING
                                        </span>
                                        <span className="text-[9px] text-theme-muted truncate uppercase tracking-wider opacity-70">
                                            {activeProject.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Scanning line effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer" />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}


            {/* Notifications */}
            < Notifications
                notifications={notifications}
                onRemove={removeNotification}
            />
        </DndContext >
    );
};
