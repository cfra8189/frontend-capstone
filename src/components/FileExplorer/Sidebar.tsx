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
    Edit2,
    Monitor
} from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

interface SidebarProps {
    className?: string;
    onRenameFolder: (folder: Folder) => void;
    onDeleteFolder: (folder: Folder) => void;
}

const FolderItem: React.FC<{
    folder: Folder;
    level: number;
    isSelected: boolean;
    onSelect: (folderStr: string) => void;
    onRename: (folder: Folder) => void;
    onDelete: (folder: Folder) => void;
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
          flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md transition-colors text-sm
          ${isSelected ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}
          ${isOver ? 'bg-blue-500/20 ring-1 ring-blue-500' : ''}
        `}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={() => onSelect(folder.id)}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(folder.id);
                        }}
                        className={`p-0.5 rounded hover:bg-white/10 ${!hasChildren && 'invisible'}`}
                    >
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {expanded ? <FolderOpen size={16} className="text-blue-400" /> : <FolderIcon size={16} className="text-blue-400" />}

                    <span className="truncate flex-1">{folder.name}</span>

                    {!isSystem && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <button
                                onClick={(e) => { e.stopPropagation(); onRename(folder); }}
                                className="p-1 hover:bg-white/10 rounded"
                            >
                                <Edit2 size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
                                className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

export const Sidebar: React.FC<SidebarProps> = ({ className, onRenameFolder, onDeleteFolder }) => {
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
                        onRename={onRenameFolder}
                        onDelete={onDeleteFolder}
                        expanded={isExpanded}
                        toggleExpand={toggleExpand}
                        hasChildren={hasChildren}
                    />
                    {isExpanded && folder.children && renderTree(folder.children, level + 1)}
                </div>
            );
        });
    };

    return (
        <div className={`flex flex-col h-full bg-[#1e1e1e] border-r border-[#333] ${className}`}>
            <div className="p-3 border-b border-[#333] flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Explorer</span>
                <button
                    onClick={() => createFolder(selectedFolderId)}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                    title="New Folder"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <div
                    className={`
            flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md transition-colors text-sm mb-2
            ${!selectedFolderId ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}
          `}
                    onClick={() => selectFolder(undefined)}
                >
                    <Monitor size={16} className="text-purple-400" />
                    <span className="truncate">All Projects</span>
                </div>

                {renderTree(folderTree.folders)}
            </div>
        </div>
    );
};
