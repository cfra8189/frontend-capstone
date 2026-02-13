import React, { useState } from 'react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, type: 'custom' | 'year', year?: number) => void;
  parentFolderName?: string;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
  parentFolderName
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [folderType, setFolderType] = useState<'custom' | 'year'>('custom');
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    if (folderType === 'year' && !year) {
      setError('Year is required for year folders');
      return;
    }

    onCreateFolder(folderName.trim(), folderType, folderType === 'year' ? year : undefined);
    handleClose();
  };

  const handleClose = () => {
    setFolderName('');
    setFolderType('custom');
    setYear(new Date().getFullYear());
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="card p-6 rounded-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-accent">
            Create New Folder
          </h3>
          <button
            onClick={handleClose}
            className="text-theme-muted hover:text-theme-primary text-xl"
          >
            ×
          </button>
        </div>

        {parentFolderName && (
          <div className="mb-4 p-3 bg-theme-tertiary rounded-lg">
            <p className="text-sm text-theme-secondary">
              Creating in: <span className="text-theme-primary font-bold">{parentFolderName}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-theme-muted mb-1">
              Folder Type
            </label>
            <select
              value={folderType}
              onChange={(e) => setFolderType(e.target.value as 'custom' | 'year')}
              className="input-field w-full p-2 rounded"
            >
              <option value="custom">Custom Folder</option>
              <option value="year">Year Folder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-theme-muted mb-1">
              {folderType === 'year' ? 'Year' : 'Folder Name'}
            </label>
            {folderType === 'year' ? (
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2020"
                max={new Date().getFullYear() + 1}
                className="input-field w-full p-2 rounded"
                placeholder="2024"
              />
            ) : (
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="input-field w-full p-2 rounded"
                placeholder="Enter folder name"
                autoFocus
              />
            )}
          </div>

          {folderType === 'custom' && (
            <div className="text-xs text-theme-muted">
              <p>• Folder names can contain letters, numbers, and spaces</p>
              <p>• Avoid special characters like / \ : * ? " &lt; &gt; |</p>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400">
              {error}
            </div>
          )}

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
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
