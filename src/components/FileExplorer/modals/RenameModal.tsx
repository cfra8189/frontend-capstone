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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-lg w-full max-w-md p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Rename Folder</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-1">
                            Folder Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#252526] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Enter folder name"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-medium"
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
