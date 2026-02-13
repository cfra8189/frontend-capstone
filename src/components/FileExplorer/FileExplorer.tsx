import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { FileText, Folder as FolderIcon } from 'lucide-react';
import { ProjectGrid } from './ProjectGrid';
import { Sidebar } from './Sidebar';
import { useFolderContext } from '../../context/FolderContext';
import { Project, Folder } from '../../types/folder';

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
    const { moveProject, selectedFolderId, folders, renameFolder, deleteFolder } = useFolderContext();
    const [activeId, setActiveId] = useState<string | null>(null);

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
            // Check if dropped on a folder (Sidebar item)
            // active.id is `project-${id}`
            // over.id is `folder-${id}`
            // over.data.current.type === 'folder'
            if (over.data.current?.type === 'folder') {
                const folderId = over.data.current.id; // Raw folder ID
                const projectId = active.data.current?.id; // Raw project ID
                const currentFolderId = active.data.current?.folderId; // Current folder

                console.log(`Dropped project ${projectId} onto folder ${folderId}`);

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
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-64px)] bg-theme-secondary text-theme-primary overflow-hidden rounded-lg border border-theme">
                <Sidebar
                    className="w-64 flex-shrink-0"
                    onDeleteFolder={(folder) => deleteFolder(folder)}
                    onRenameFolder={() => { }} // Sidebar handles its own renaming state now
                />

                <div className="flex-1 flex flex-col min-w-0 bg-theme-primary">
                    <div className="border-b border-theme p-3 flex items-center justify-between bg-theme-secondary">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-theme-muted uppercase tracking-widest">
                                {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name || 'Folder' : 'ROOT'}
                            </span>
                        </div>
                    </div>

                    <ProjectGrid
                        projects={projects}
                        loading={loading}
                        onEdit={onProjectEdit}
                        onDelete={onProjectDelete}
                    />
                </div>
            </div>

            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                {activeProject ? (
                    <div className="bg-theme-secondary p-3 rounded-sm border border-theme-primary shadow-2xl opacity-90 cursor-grabbing w-56 scale-95 origin-center transition-transform ring-1 ring-theme-primary/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-theme-tertiary flex items-center justify-center rounded-sm border border-theme text-theme-primary">
                                <FileText size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-theme-primary truncate uppercase tracking-tight">
                                    {activeProject.title}
                                </span>
                                <span className="text-[9px] font-mono text-theme-muted uppercase tracking-widest">
                                    DRAGGING ITEM
                                </span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
