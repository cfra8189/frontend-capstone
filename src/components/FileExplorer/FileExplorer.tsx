import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
    pointerWithin,
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
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-64px)] bg-[#1e1e1e] text-zinc-300 overflow-hidden rounded-lg border border-[#333]">
                <Sidebar
                    className="w-64 flex-shrink-0"
                    onDeleteFolder={(folder) => deleteFolder(folder)}
                    onRenameFolder={(folder) => {
                        const newName = prompt("Rename folder:", folder.name);
                        if (newName) renameFolder(folder, newName);
                    }}
                />

                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                    <div className="border-b border-[#333] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-400">
                                {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name || 'Folder' : 'All Projects'}
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

            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                {activeProject ? (
                    <div className="bg-[#1e1e1e] p-3 rounded border border-gray-700 shadow-xl opacity-80 cursor-grabbing w-48">
                        <div className="flex items-center gap-2">
                            <FileText size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-200 truncate">
                                {activeProject.title}
                            </span>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
