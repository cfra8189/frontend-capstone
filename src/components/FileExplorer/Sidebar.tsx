import React, { useState } from 'react';
import { useFolderContext } from '../../context/FolderContext';
import { Folder } from '../../types/folder';
import {
    ChevronRight,
    ChevronDown,
    Folder as FolderIcon,
    FolderOpen,
    Plus,
    Trash2,
    Monitor,
    Edit2
} from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { RenameModal } from './modals/RenameModal';

interface SidebarProps {
    className?: string;
    onRenameFolder: (folder: Folder) => void;
    onDeleteFolder: (folder: Folder) => void;
    onAddProjects: (folder: Folder) => void;
}

const FolderItem: React.FC<{
    folder: Folder;
    level: number;
    isSelected: boolean;
    onSelect: (folderStr: string) => void;
    onRename: (folder: Folder) => void;
    onDelete: (folder: Folder) => void;
    onAddProjects: (folder: Folder) => void;
    expanded: boolean;
    toggleExpand: (id: string) => void;
    hasChildren: boolean;
}> = ({
    folder,
    level,
    isSelected,
    onSelect,
    onRename,
    onDelete,
    onAddProjects,
    expanded,
    toggleExpand,
    hasChildren
}) => {
        const { setNodeRef, isOver } = useDroppable({
            id: `folder-${folder.id}`,
            data: { type: 'folder', id: folder.id, name: folder.name }
        });

        const isSystem = folder.type === 'root' || folder.type === 'year';

        return (
            <div ref={setNodeRef}>
                <div
                    className={`
           flex items-center gap-2 px-3 py-2 cursor-pointer transition-all text-xs font-mono tracking-wide mb-[2px] rounded-sm
           ${isSelected
                            ? 'bg-theme-primary text-theme-primary border border-theme-primary shadow-md brightness-125'
                            : 'text-theme-muted hover:bg-theme-tertiary hover:text-theme-primary hover:border-theme border border-transparent'
                        }
           ${isOver ? 'ring-2 ring-theme-primary bg-theme-primary/20 text-theme-primary scale-[1.05] shadow-[0_0_20px_rgba(var(--particle-color),0.3)] z-20 relative' : ''}
         `}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={() => onSelect(folder.id)}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(folder.id);
                        }}
                        className={`p-0.5 hover:bg-black/10 rounded-sm ${!hasChildren && 'invisible'}`}
                    >
                        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>

                    {expanded ? <FolderOpen size={14} /> : <FolderIcon size={14} />}

                    <span className="truncate flex-1 uppercase">{folder.name}</span>

                    {!isSystem && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddProjects(folder); }}
                                className="p-1 hover:bg-theme-tertiary hover:text-accent rounded-sm"
                                title="Add Projects"
                            >
                                <Plus size={10} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRename(folder); }}
                                className="p-1 hover:bg-theme-tertiary hover:text-theme-primary rounded-sm"
                            >
                                <Edit2 size={10} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
                                className="p-1 hover:bg-theme-tertiary hover:text-red-500 rounded-sm"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

export const Sidebar: React.FC<SidebarProps> = ({ className, onRenameFolder, onDeleteFolder, onAddProjects }) => {
    const {
        folderTree,
        selectedFolderId,
        selectFolder,
        createFolder
    } = useFolderContext();

    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderTree = (folders: Folder[], level = 0) => {
        return folders.map(folder => {
            const isExpanded = expanded.has(folder.id);
            const hasChildren = (folder.children?.length ?? 0) > 0;

            return (
                <div key={folder.id} className="group">
                    <FolderItem
                        folder={folder}
                        level={level}
                        isSelected={selectedFolderId === folder.id}
                        onSelect={selectFolder}
                        onRename={(f) => setRenamingFolder(f)}
                        onDelete={onDeleteFolder}
                        onAddProjects={onAddProjects}
                        expanded={isExpanded}
                        toggleExpand={toggleExpand}
                        hasChildren={hasChildren}
                    />
                    {isExpanded && folder.children && renderTree(folder.children, level + 1)}
                </div>
            );
        });
    };

    const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);

    return (
        <div className="flex flex-col h-full bg-transparent border-r border-theme/20 font-mono relative z-10">
            <RenameModal
                isOpen={renamingFolder !== null}
                onClose={() => setRenamingFolder(null)}
                folder={renamingFolder}
            />
            <div className="p-3 border-b border-theme flex items-center justify-between text-theme-muted">
                <span className="text-[10px] font-bold uppercase tracking-widest">FILESYSTEM</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <div
                    className={`
            flex items-center gap-2 px-2 py-1 cursor-pointer transition-all text-xs font-mono tracking-wide mb-2 border border-transparent
            ${!selectedFolderId
                            ? 'bg-theme-primary text-accent border-accent'
                            : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary hover:border-theme'
                        }
          `}
                    onClick={() => selectFolder(undefined)}
                >
                    <Monitor size={14} />
                    <span className="truncate uppercase font-bold tracking-widest">ROOT_PROJECTS</span>
                </div>

                {renderTree(folderTree.folders)}
            </div>
        </div>
    );
};
