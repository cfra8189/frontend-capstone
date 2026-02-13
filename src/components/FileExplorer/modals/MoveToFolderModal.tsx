import React, { useState } from 'react';
import { useFolderContext } from '../../../context/FolderContext';
import { Project, Folder } from '../../../types/folder';
import { Search, Folder as FolderIcon, X } from 'lucide-react';

interface MoveToFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({ isOpen, onClose, project }) => {
    const { folderTree, moveProject } = useFolderContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [moving, setMoving] = useState(false);

    if (!isOpen || !project) return null;

    const flattenedFolders: Folder[] = [];
    const flatten = (folders: Folder[]) => {
        folders.forEach(f => {
            flattenedFolders.push(f);
            if (f.children) flatten(f.children);
        });
    };
    flatten(folderTree.folders);

    const filteredFolders = flattenedFolders.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) && f.id !== project.folderId
    );

    const handleMove = async (folderId: string) => {
        try {
            setMoving(true);
            await moveProject(project.id, folderId);
            onClose();
        } catch (error) {
            console.error("Failed to move project", error);
        } finally {
            setMoving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[400] backdrop-blur-md">
            <div className="bg-theme-secondary border border-theme w-full max-w-md shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-theme flex items-center justify-between bg-theme-tertiary">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.2em]">FILE_OPERATIONS</span>
                        <h3 className="text-sm font-bold text-theme-primary uppercase tracking-widest">MOVE_PROJECT</h3>
                    </div>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-theme-primary/30 border-b border-theme">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-theme-tertiary border border-theme flex items-center justify-center text-theme-primary rounded-sm shadow-inner">
                            <FolderIcon size={20} className="opacity-50" />
                        </div>
                        <div>
                            <p className="text-[10px] text-theme-muted uppercase tracking-widest">TARGET_PROJECT</p>
                            <p className="text-sm font-bold text-theme-primary truncate max-w-[250px]">{project.title}</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={14} />
                        <input
                            type="text"
                            placeholder="SEARCH_DESTINATION..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-theme-secondary border border-theme py-2 pl-10 pr-4 text-xs font-mono text-theme-primary outline-none focus:border-theme-primary transition-all rounded-sm uppercase tracking-widest"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-theme-primary/10">
                    {filteredFolders.length > 0 ? (
                        filteredFolders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => handleMove(folder.id)}
                                disabled={moving}
                                className="w-full flex items-center gap-3 p-3 hover:bg-theme-tertiary text-left transition-all border border-transparent hover:border-theme rounded-sm group"
                            >
                                <FolderIcon size={16} className="text-theme-muted group-hover:text-theme-primary transition-colors" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-theme-secondary group-hover:text-theme-primary transition-colors uppercase tracking-wide">
                                        {folder.name}
                                    </p>
                                    <p className="text-[9px] text-theme-muted group-hover:text-theme-muted/80 transition-colors uppercase tracking-[0.1em]">
                                        DIRECTORY_PATH: /ROOT/{folder.name}
                                    </p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center text-theme-muted flex flex-col items-center">
                            <Search size={32} className="mb-2 opacity-10" />
                            <p className="text-[10px] uppercase tracking-widest">NO_MATCHING_DESTINATIONS</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-theme-tertiary border-t border-theme flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-[10px] font-bold text-theme-muted hover:text-theme-primary uppercase tracking-widest transition-all"
                    >
                        ABORT_OPERATION
                    </button>
                </div>
            </div>
        </div>
    );
};
