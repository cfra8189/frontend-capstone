import React, { useState } from 'react';
import { useFolderContext } from '../../../context/FolderContext';
import { Project, Folder } from '../../../types/folder';
import { Search, Folder as FolderIcon, X, CheckSquare, Square } from 'lucide-react';

interface MoveToFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    targetFolder?: Folder | null;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({ isOpen, onClose, projects, targetFolder }) => {
    const { folderTree, moveProject, folders: allFolders } = useFolderContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [moving, setMoving] = useState(false);
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    const flattenedFolders: Folder[] = [];
    const flatten = (folders: Folder[]) => {
        folders.forEach(f => {
            flattenedFolders.push(f);
            if (f.children) flatten(f.children);
        });
    };
    flatten(folderTree.folders);

    const filteredFolders = flattenedFolders.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMove = async (folderId: string) => {
        try {
            setMoving(true);
            const idsToMove = selectedProjectIds.size > 0
                ? Array.from(selectedProjectIds)
                : projects.map(p => p.id);

            await Promise.all(idsToMove.map(id => moveProject(id, folderId)));
            onClose();
        } catch (error) {
            console.error("Failed to move projects", error);
        } finally {
            setMoving(false);
        }
    };

    const toggleProject = (projectId: string) => {
        setSelectedProjectIds(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-6 z-[400]"
            onClick={onClose}
        >
            <div
                className="bg-theme-secondary border border-theme w-full max-w-2xl shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-theme flex items-center justify-between bg-theme-tertiary">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.2em]">FILE_OPERATIONS</span>
                        <h3 className="text-sm font-bold text-theme-primary uppercase tracking-widest">
                            {targetFolder ? `ADD_TO_${targetFolder.name.toUpperCase()}` : 'MOVE_PROJECTS'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Project Selection Side */}
                    <div className="w-1/2 border-r border-theme flex flex-col">
                        <div className="p-3 border-b border-theme bg-theme-primary/10">
                            <p className="text-[10px] text-theme-muted uppercase tracking-widest mb-2">SELECT_PROJECTS</p>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-theme-primary font-mono">{selectedProjectIds.size || projects.length} SELECTED</span>
                                <button
                                    onClick={() => setSelectedProjectIds(selectedProjectIds.size === projects.length ? new Set() : new Set(projects.map(p => p.id)))}
                                    className="text-[9px] text-accent hover:underline uppercase tracking-tighter"
                                >
                                    {selectedProjectIds.size === projects.length ? 'DESELECT_ALL' : 'SELECT_ALL'}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {projects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => toggleProject(project.id)}
                                    className="w-full flex items-center gap-2 p-2 hover:bg-theme-tertiary text-left transition-all rounded-sm group border border-transparent hover:border-theme/30"
                                >
                                    {selectedProjectIds.has(project.id) ? (
                                        <CheckSquare size={14} className="text-accent" />
                                    ) : (
                                        <Square size={14} className="text-theme-muted" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-theme-primary truncate uppercase">{project.title}</p>
                                        <p className="text-[8px] text-theme-muted uppercase">{project.type}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Folder Selection Side */}
                    <div className="w-1/2 flex flex-col bg-theme-primary/5">
                        <div className="p-3 border-b border-theme bg-theme-primary/10">
                            <p className="text-[10px] text-theme-muted uppercase tracking-widest mb-2">TARGET_DIRECTORY</p>
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-theme-muted" size={12} />
                                <input
                                    type="text"
                                    placeholder="SEARCH..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-theme-secondary border border-theme py-1 pl-7 pr-3 text-[10px] font-mono text-theme-primary outline-none focus:border-theme-primary transition-all rounded-sm uppercase"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {targetFolder ? (
                                <button
                                    onClick={() => handleMove(targetFolder.id)}
                                    disabled={moving || (selectedProjectIds.size === 0 && projects.length === 0)}
                                    className="w-full flex items-center gap-3 p-3 bg-accent/10 border border-accent hover:bg-accent/20 text-left transition-all rounded-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FolderIcon size={16} className="text-accent" />
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-accent uppercase tracking-wide">CONFIRM_ADD_TO_{targetFolder.name}</p>
                                        <p className="text-[8px] text-accent/70 uppercase">CLICK_TO_FINALIZE</p>
                                    </div>
                                </button>
                            ) : (
                                filteredFolders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleMove(folder.id)}
                                        disabled={moving}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-theme-tertiary text-left transition-all border border-transparent hover:border-theme rounded-sm group"
                                    >
                                        <FolderIcon size={14} className="text-theme-muted group-hover:text-theme-primary" />
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-theme-primary uppercase truncate">{folder.name}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-theme-tertiary border-t border-theme flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-1 text-[9px] font-bold text-theme-muted hover:text-theme-primary uppercase tracking-widest transition-all"
                    >
                        CANCEL
                    </button>
                </div>
            </div>
        </div>
    );
};
