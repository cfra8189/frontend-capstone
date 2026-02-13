import React, { useState } from 'react';
import { Folder } from '../types/folder';

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId?: string;
  onFolderSelect: (folder: Folder) => void;
  onFolderCreate?: (parentId?: string) => void;
  onFolderRename?: (folder: Folder) => void;
  onFolderDelete?: (folder: Folder) => void;
  level?: number;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  level = 0
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggleExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const startEditing = (folder: Folder) => {
    setEditingFolder(folder.id);
    setEditName(folder.name);
  };

  const saveEdit = (folder: Folder) => {
    if (editName.trim() && editName !== folder.name) {
      onFolderRename?.({ ...folder, name: editName.trim() });
    }
    setEditingFolder(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingFolder(null);
    setEditName('');
  };

  const handleCreateFolder = (parentId?: string) => {
    onFolderCreate?.(parentId);
  };

  const renderFolder = (folder: Folder) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isEditing = editingFolder === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const canEdit = folder.type === 'custom'; // Only allow editing custom folders

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected ? 'bg-accent text-accent-contrast' : 'hover:bg-theme-tertiary'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => onFolderSelect(folder)}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
              className="w-4 h-4 flex items-center justify-center text-theme-muted hover:text-theme-primary transition-transform"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <path
                  d="M3 6 L9 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          {/* Folder Icon */}
          <div className="w-4 h-4 flex items-center justify-center">
            {folder.type === 'root' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 3h5l1 1h6a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
              </svg>
            )}
            {folder.type === 'year' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1zM2 4h12v8H2V4z"/>
              </svg>
            )}
            {folder.type === 'custom' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 2h4l1 1h5a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
              </svg>
            )}
          </div>

          {/* Folder Name */}
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => saveEdit(folder)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(folder);
                if (e.key === 'Escape') cancelEdit();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-theme-secondary border border-accent rounded px-1 py-0.5 text-sm"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-sm truncate">{folder.name}</span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(folder);
                }}
                className="w-6 h-6 flex items-center justify-center text-theme-muted hover:text-accent"
                title="Rename folder"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M8.5 1L11 3.5L4 10.5L1 11L1.5 8L8.5 1zM7.5 2.5L2.5 7.5L2 9L3.5 8.5L8.5 3.5L7.5 2.5z"/>
                </svg>
              </button>
            )}
            
            {folder.type === 'custom' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFolderDelete?.(folder);
                }}
                className="w-6 h-6 flex items-center justify-center text-theme-muted hover:text-red-400"
                title="Delete folder"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 3h1v7a1 1 0 001 1h3a1 1 0 001-1V3h1M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M2 3h8"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div
            className="overflow-hidden transition-all duration-200"
            style={{ 
              maxHeight: isExpanded ? '1000px' : '0',
              opacity: isExpanded ? 1 : 0
            }}
          >
            {folder.children!.map(child => (
              <FolderTree
                key={child.id}
                folders={[child]}
                selectedFolderId={selectedFolderId}
                onFolderSelect={onFolderSelect}
                onFolderCreate={onFolderCreate}
                onFolderRename={onFolderRename}
                onFolderDelete={onFolderDelete}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="folder-tree space-y-1">
      {folders.map(folder => renderFolder(folder))}
    </div>
  );
};

export default FolderTree;
