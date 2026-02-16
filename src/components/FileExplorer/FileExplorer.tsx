
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
import { FileText, Plus, FolderPlus, Check, Search, FileJson, AlignLeft } from 'lucide-react';
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

    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

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
                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Mobile Sidebar Overlay */}
                        {showMobileSidebar && (
                            <div
                                className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                                onClick={() => setShowMobileSidebar(false)}
                            />
                        )}

                        <Sidebar
                            className={`
                                fixed md:relative left-0 top-0 bottom-0 z-[70] md:z-10
                                w-64 flex-shrink-0 transition-transform duration-300 ease-in-out
                                ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                                bg-theme-secondary/95 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none
                            `}
                            onDeleteFolder={(folder) => deleteFolder(folder)}
                            onRenameFolder={() => { }} // Sidebar handles its own renaming state
                        />

                        <div
                            ref={setGridDropRef}
                            className={`flex-1 flex flex-col min-w-0 relative transition-all duration-300 ${isOverGrid ? 'bg-theme-primary/10 ring-2 ring-inset ring-theme-primary/30' : ''}`}
                        >
                            {/* Interior Toolbar */}
                            <div className="border-b border-theme/20 p-3 flex flex-wrap items-center justify-between gap-3 bg-transparent backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowMobileSidebar(true)}
                                        className="md:hidden p-1 text-theme-muted hover:text-theme-primary transition-colors"
                                    >
                                        <AlignLeft size={16} />
                                    </button>
                                    <div className="w-1 h-3 bg-theme-primary animate-pulse" />
                                    <span className="text-[10px] font-mono font-bold text-theme-primary uppercase tracking-[0.3em] truncate max-w-[120px] sm:max-w-none">
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
                        <div className="bg-theme-secondary/50 flex items-center gap-2 p-2 rounded-sm border border-theme-primary/30 shadow-xl cursor-grabbing pointer-events-none w-40 backdrop-blur-sm">
                            <div className="p-1 bg-theme-primary text-theme-secondary rounded-sm opacity-50">
                                <FileJson size={12} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[10px] font-bold font-mono text-theme-primary truncate uppercase tracking-tight opacity-70">
                                    {activeProject.title}
                                </h3>
                                <p className="text-[8px] text-theme-muted font-mono uppercase tracking-tighter opacity-50">
                                    {activeProject.status || 'concept'}
                                </p>
                            </div>
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
