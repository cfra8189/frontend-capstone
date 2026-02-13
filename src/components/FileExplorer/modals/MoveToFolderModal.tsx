import React, { useState } from 'react';
import { useFolderContext } from '../../../context/FolderContext';
import { Search, Folder as FolderIcon, X } from 'lucide-react';
import { useNotifications } from '../../Notifications';

interface MoveToFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
    projectTitle: string;
    currentFolderId?: string;
    onSuccess: () => void;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
    isOpen,
    onClose,
    projectId,
    projectTitle,
    currentFolderId,
    onSuccess
}) => {
    const { folders, moveProject } = useFolderContext();
    const { success, error } = useNotifications();
    const [searchTerm, setSearchTerm] = useState('');
    const [moving, setMoving] = useState(false);

    if (!isOpen || !projectId) return null;

    console.log('MoveToFolderModal - folders from context:', folders);
    console.log('MoveToFolderModal - currentFolderId:', currentFolderId);

    // Debug: Log the first folder to see its structure
    if (folders.length > 0) {
        console.log('Sample folder object:', folders[0]);
        console.log('Sample folder keys:', Object.keys(folders[0]));
    }

    // Filter folders: exclude current folder (if specified) and apply search
    const filteredFolders = folders.filter(f => {
        const notCurrentFolder = !currentFolderId || f.id !== currentFolderId;
        const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
        return notCurrentFolder && matchesSearch;
    });

    console.log('MoveToFolderModal - filteredFolders:', filteredFolders);

    const handleMove = async (folderId: string, folderName: string) => {
        try {
            setMoving(true);
            console.log('=== MOVE OPERATION START ===');
            console.log('Moving project:', projectId, 'to folder:', folderId);
            console.log('Project title:', projectTitle);
            console.log('Folder name:', folderName);

            await moveProject(projectId, folderId);

            console.log('=== MOVE OPERATION SUCCESS ===');
            success(`"${projectTitle}" moved to "${folderName}"`);
            console.log('Calling onSuccess to refresh...');
            onSuccess();
            console.log('Closing modal...');
            onClose();
        } catch (err) {
            console.error('=== MOVE OPERATION FAILED ===');
            console.error('Failed to move project:', err);
            error(err instanceof Error ? err.message : 'Failed to move project');
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
                className="bg-theme-secondary border border-theme w-full max-w-md shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[70vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
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

                {/* Project Info */}
                <div className="p-4 border-b border-theme bg-theme-primary/10">
                    <p className="text-[8px] text-theme-muted uppercase tracking-widest mb-1">Moving Project</p>
                    <p className="text-sm font-bold text-theme-primary uppercase">{projectTitle}</p>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-theme bg-theme-primary/5">
                    <p className="text-[10px] text-theme-muted uppercase tracking-widest mb-2">SELECT_DESTINATION</p>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-theme-muted" size={12} />
                        <input
                            type="text"
                            placeholder="SEARCH FOLDERS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-theme-secondary border border-theme py-1 pl-7 pr-3 text-[10px] font-mono text-theme-primary outline-none focus:border-theme-primary transition-all rounded-sm uppercase"
                        />
                    </div>
                </div>

                {/* Folder List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredFolders.length === 0 ? (
                        <div className="p-4 text-center">
                            <p className="text-xs text-theme-muted uppercase">
                                {folders.length === 0 ? 'No folders available' : 'No matching folders'}
                            </p>
                        </div>
                    ) : (
                        filteredFolders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => handleMove(folder.id, folder.name)}
                                disabled={moving}
                                className="w-full flex items-center gap-3 p-2 hover:bg-theme-tertiary text-left transition-all border border-transparent hover:border-theme rounded-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FolderIcon size={14} className="text-theme-muted group-hover:text-theme-primary" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-theme-primary uppercase truncate">{folder.name}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
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
