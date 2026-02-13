import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ProjectGrid } from './ProjectGrid';
import { useFolderContext } from '../../context/FolderContext';
import { Project } from '../../types/Project';
import { Folder } from '../../types/folder';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DragOverlay
} from '@dnd-kit/core';
import { CreateFolderModal } from './modals/CreateFolderModal';
import { RenameModal } from './modals/RenameModal';

interface FileExplorerProps {
    projects: Project[];
    loading: boolean;
    onProjectEdit: (project: Project) => void;
    onProjectDelete: (id: number) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
    projects,
    loading,
    onProjectEdit,
    onProjectDelete
}) => {
    const { moveProject, selectedFolderId } = useFolderContext();
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    // Modals state
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const project = projects.find(p => `project-${p.id}` === active.id);
        if (project) setActiveProject(project);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Check if dropped on a folder
            if (over.id.toString().startsWith('folder-')) {
                const folderId = over.id.toString().replace('folder-', '');
                const projectId = active.data.current?.id;

                // Don't move if dropped on same folder
                if (folderId === active.data.current?.folderId) return;
                if (folderId === selectedFolderId) return;

                try {
                    await moveProject(projectId, folderId);
                    // Optimistic update or wait for reload logic handled by parent/context
                    // Ideally we should reload projects here or the parent should know to reload
                    // The moves are handled, but we might need to trigger a refresh of the project list
                    // Dashboard.tsx reloads on selectedFolderId change, but not on move within same view 
                    // (Wait, moving removes it from current view usually, so it disappears seamlessly)

                    // Force refresh projects - passed from parent? 
                    // Actually Dashboard.tsx listens to selectedFolderId, but we might want to trigger a reload.
                    // For now let's assume the move is successful and we might need to manually trigger project reload in parent
                    // But since we don't have a callback for that, we rely on the state update.
                    // If the project moves OUT of the current folder, we should remove it from the local list optimistically?
                    // But projects prop comes from parent. 
                } catch (error) {
                    console.error("Failed to move project", error);
                }
            }
        }
        setActiveProject(null);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-64px)] bg-[#1e1e1e] text-zinc-300 overflow-hidden rounded-lg border border-[#333]">
                <Sidebar
                    className="w-64 flex-shrink-0"
                    onRenameFolder={(folder) => {
                        setFolderToRename(folder);
                        setIsRenameModalOpen(true);
                    }}
                    onDeleteFolder={(folder) => {
                        // Delete logic handled by Sidebar internally calling context, 
                        // or we can lift it up if needed. Sidebar handles it via context.
                    }}
                />

                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                    <div className="border-b border-[#333] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-400">
                                {selectedFolderId ? 'Projects' : 'All Projects'}
                            </span>
                        </div>
                        {/* Actions like View Mode can go here */}
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
                    <div className="bg-[#252526] p-2 rounded shadow-xl border border-blue-500 w-40 truncate text-white">
                        {activeProject.title}
                    </div>
                ) : null}
            </DragOverlay>

            <CreateFolderModal
                isOpen={isCreateFolderModalOpen}
                onClose={() => setIsCreateFolderModalOpen(false)}
                parentId={selectedFolderId}
            />

            <RenameModal
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                folder={folderToRename}
            />
        </DndContext>
    );
};
