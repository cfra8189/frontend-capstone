import React, { useState } from 'react';
import { Project, Folder } from '../../../types/folder';
import { Search, Folder as FolderIcon, X } from 'lucide-react';

interface MoveToFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    onMoveProject: (projectId: string, folderId: string) => Promise<void>;
    currentFolderId?: string;
    folders: Folder[];
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({ isOpen, onClose, project, onMoveProject, currentFolderId, folders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [moving, setMoving] = useState(false);

    if (!isOpen || !project) return null;

    const filteredFolders = folders.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) && f.id !== currentFolderId
    );

    const handleMove = async (folderId: string) => {
        try {
            setMoving(true);
            await onMoveProject(project.id, folderId);
            onClose();
        } catch (error) {
            console.error("Failed to move project", error);
        } finally {
            setMoving(false);
        }
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
                            MOVE_PROJECT
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Project Info Side */}
                    <div className="w-1/2 border-r border-theme flex flex-col">
                        <div className="p-3 border-b border-theme bg-theme-primary/10">
                            <p className="text-[10px] text-theme-muted uppercase tracking-widest mb-2">PROJECT_INFO</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-2">
                                <div>
                                    <p className="text-[8px] text-theme-muted uppercase tracking-widest">Title</p>
                                    <p className="text-sm font-bold text-theme-primary uppercase">{project.title}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] text-theme-muted uppercase tracking-widest">Type</p>
                                    <p className="text-xs text-theme-secondary uppercase">{project.type}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] text-theme-muted uppercase tracking-widest">Status</p>
                                    <p className="text-xs text-theme-secondary uppercase">{project.status}</p>
                                </div>
                            </div>
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
                            {filteredFolders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => handleMove(folder.id)}
                                    disabled={moving}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-theme-tertiary text-left transition-all border border-transparent hover:border-theme rounded-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FolderIcon size={14} className="text-theme-muted group-hover:text-theme-primary" />
                                    <div className="flex-1">
                                        <p className="text-[11px] font-bold text-theme-primary uppercase truncate">{folder.name}</p>
                                    </div>
                                </button>
                            ))}
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
