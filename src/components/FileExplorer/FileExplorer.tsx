import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    pointerWithin,
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
import { FileText, Plus, FolderPlus } from 'lucide-react';
import { ProjectGrid } from './ProjectGrid';
import { Sidebar } from './Sidebar';
import { useFolderContext } from '../../context/FolderContext';
import { Project } from '../../types/folder';
import { CreateFolderModal } from './modals/CreateFolderModal';
import { MoveToFolderModal } from './modals/MoveToFolderModal';

interface FileExplorerProps {
    projects: Project[];
    loading: boolean;
    onProjectEdit: (project: Project) => void;
    onProjectDelete: (id: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
    projects,
    loading,
    onProjectEdit,
    onProjectDelete
}) => {
    const { moveProject, selectedFolderId, folders, deleteFolder } = useFolderContext();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [movingProject, setMovingProject] = useState<Project | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            if (over.data.current?.type === 'folder') {
                const folderId = over.data.current.id;
                const projectId = active.data.current?.id;
                const currentFolderId = active.data.current?.folderId;

                if (folderId && projectId && folderId !== currentFolderId) {
                    try {
                        await moveProject(projectId, folderId);
                    } catch (error) {
                        console.error("Failed to move project", error);
                    }
                }
            }
        }
        setActiveId(null);
    };

    const activeProject = activeId ? projects.find(p => `project-${p.id}` === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <CreateFolderModal
                isOpen={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                parentId={selectedFolderId}
            />

            <MoveToFolderModal
                isOpen={movingProject !== null}
                onClose={() => setMovingProject(null)}
                project={movingProject}
            />

            <div className="flex h-[calc(100vh-140px)] bg-theme-secondary text-theme-primary overflow-hidden rounded-lg border border-theme shadow-2xl">
                <Sidebar
                    className="w-64 flex-shrink-0"
                    onDeleteFolder={(folder) => deleteFolder(folder)}
                    onRenameFolder={() => { }} // Sidebar handles its own renaming state
                />

                <div className="flex-1 flex flex-col min-w-0 bg-theme-primary relative">
                    {/* Interior Toolbar */}
                    <div className="border-b border-theme p-3 flex items-center justify-between bg-theme-secondary/50 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-3 bg-theme-primary animate-pulse" />
                            <span className="text-[10px] font-mono font-bold text-theme-primary uppercase tracking-[0.3em]">
                                {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name || 'Folder' : 'ROOT_VAULT'}
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
                                <span>NEW_OBJECT</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <ProjectGrid
                            projects={projects}
                            loading={loading}
                            onEdit={onProjectEdit}
                            onDelete={onProjectDelete}
                            onMoveProject={(p) => setMovingProject(p)}
                        />
                    </div>
                </div>
            </div>

            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                {activeProject ? (
                    <div className="bg-theme-secondary p-3 rounded-sm border border-theme-primary shadow-2xl opacity-90 cursor-grabbing w-56 scale-95 origin-center transition-transform ring-1 ring-theme-primary/30 font-mono pointer-events-none">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-theme-tertiary flex items-center justify-center rounded-sm border border-theme text-theme-primary">
                                <FileText size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-theme-primary truncate uppercase tracking-tight">
                                    {activeProject.title}
                                </span>
                                <span className="text-[9px] text-theme-muted uppercase tracking-[0.2em]">
                                    MOVING_OBJECT
                                </span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
