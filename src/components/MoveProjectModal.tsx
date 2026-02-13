import React, { useState } from 'react';
import { Folder } from '../types/folder';

interface MoveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoveProject: (projectId: string, folderId: string) => void;
  projectId: string;
  projectName: string;
  currentFolderId?: string;
  folders: Folder[];
}

export default function MoveProjectModal({
  isOpen,
  onClose,
  onMoveProject,
  projectId,
  projectName,
  currentFolderId,
  folders
}: MoveProjectModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFolders = folders.filter(folder => 
    folder.type !== 'root' && 
    (folder.name.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === '')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFolderId) {
      alert('Please select a destination folder');
      return;
    }

    onMoveProject(projectId, selectedFolderId);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFolderId(currentFolderId || '');
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="card p-6 rounded-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-accent">
            Move Project
          </h3>
          <button
            onClick={handleClose}
            className="text-theme-muted hover:text-theme-primary text-xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-theme-tertiary rounded-lg">
          <p className="text-sm text-theme-secondary">
            Moving: <span className="text-theme-primary font-bold">{projectName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-theme-muted mb-1">
              Destination Folder
            </label>
            
            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search folders..."
              className="input-field w-full p-2 rounded mb-3"
            />

            {/* Folder Selection */}
            <div className="max-h-40 overflow-y-auto border border-theme-tertiary rounded">
              {filteredFolders.length === 0 ? (
                <div className="p-3 text-center text-theme-muted">
                  No folders available
                </div>
              ) : (
                filteredFolders.map(folder => (
                  <label
                    key={folder.id}
                    className="flex items-center gap-2 p-2 hover:bg-theme-tertiary cursor-pointer rounded"
                  >
                    <input
                      type="radio"
                      name="folder"
                      value={folder.id}
                      checked={selectedFolderId === folder.id}
                      onChange={() => setSelectedFolderId(folder.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {/* Folder Icon */}
                        <div className="w-4 h-4 flex items-center justify-center">
                          {folder.type === 'year' ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M14 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001 1H2a1 1 0 00-1-1V3a1 1 0 011-1z"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M3 2h4l1 1h6a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-theme-primary">{folder.name}</div>
                          <div className="text-xs text-theme-muted">{folder.type}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded border border-theme-tertiary text-theme-secondary hover:bg-theme-tertiary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary font-bold py-2 rounded"
            >
              Move Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
