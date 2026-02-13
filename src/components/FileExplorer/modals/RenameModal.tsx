import React, { useState, useEffect } from 'react';
import { useFolderContext } from '../../../context/FolderContext';
import { Folder } from '../../../types/folder';
import { X } from 'lucide-react';

interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    folder: Folder | null;
}

export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, folder }) => {
    const { renameFolder } = useFolderContext();
    const [name, setName] = useState('');

    useEffect(() => {
        if (folder) {
            setName(folder.name);
        }
    }, [folder]);

    if (!isOpen || !folder) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || name.trim() === folder.name) {
            onClose();
            return;
        }

        try {
            await renameFolder(folder, name.trim());
            onClose();
        } catch (err) {
            console.error('Failed to rename folder');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-theme-secondary border border-theme rounded-sm w-full max-w-sm p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-theme-primary font-mono uppercase tracking-tight">Rename Folder</h2>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-[10px] font-bold text-theme-muted mb-2 uppercase tracking-widest font-mono">
                            New Folder Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-theme-primary border border-theme rounded-sm px-3 py-2 text-theme-primary text-sm font-mono focus:outline-none focus:border-theme-primary transition-colors placeholder:text-theme-muted/30"
                            placeholder="Enter folder name"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-theme text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary transition-colors font-mono text-xs uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-theme-primary text-theme-primary border border-theme-primary hover:bg-theme-tertiary transition-colors font-bold font-mono text-xs uppercase tracking-wider"
                            disabled={!name.trim()}
                        >
                            Rename
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
