import React, { useState } from 'react';
import { Folder } from '../types/folder';

/* Add CSS for file explorer styling */
const style = document.createElement('style');
style.textContent = `
  .folder-tree {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    user-select: none;
  }

  .folder-row {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-colors 0.15s ease;
  }

  .folder-row:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .folder-name {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .folder-name.selected {
    background-color: rgb(59, 130, 246);
    color: white;
  }

  .expand-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 2px;
  }

  .expand-icon:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .folder-actions {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }

  .action-button {
    width: 20px;
    height: 20px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  .action-button:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .action-button.delete {
    color: #ef4444;
  }

  .action-button.delete:hover {
    color: #dc2626;
  }

  .folder-children {
    margin-left: 20px;
    border-left: 1px solid rgba(0, 0, 0, 0.1);
  }
`;

if (!document.head.querySelector('style[data-folder-tree]')) {
  document.head.appendChild(style);
}

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
    const canEdit = folder.type === 'custom';

    return (
      <div className="folder-row">
        {/* Expand/Collapse */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(folder.id);
            }}
            className="expand-icon"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d={`M${isExpanded ? '6 2l6 6' : '4 2l4 6'}M2 6h8`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* Folder Icon and Name */}
        <div 
          className={`folder-name ${isSelected ? 'selected' : ''}`}
          onClick={() => onFolderSelect(folder)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            {folder.type === 'root' && (
              <path d="M2 3h5l1 1h6a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
            )}
            {folder.type === 'year' && (
              <path d="M14 2H6a2 2 0 00-2h8a2 2 0 002 2v8a2 2 0 002 2H6a2 2 0 002-2z"/>
            )}
            {folder.type === 'custom' && (
              <path d="M3 2l4 2v8M2 6h8a1 1 0 001 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
            )}
          </svg>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                  if (editName.trim() && editName !== folder.name) {
                    onFolderRename?.(folder, editName.trim());
                    cancelEdit();
                  }
                }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveEdit(folder);
                }
                if (e.key === 'Escape') cancelEdit();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-theme-secondary border border-accent rounded px-1 py-0.5 text-sm"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-sm truncate">{folder.name}</span>
          )}
        </div>

        {/* Actions */}
        <div className="folder-actions">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditing(folder);
              }}
              className="action-button"
              title="Rename folder"
            >
              ✏️
            </button>
          )}
          
          {folder.type === 'custom' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFolderDelete?.(folder);
              }}
              className="action-button delete"
              title="Delete folder"
            >
              🗑️
            </button>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="folder-children">
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
    <div className="folder-tree">
      {folders.map(folder => (
        <div key={folder.id} className="folder-item">
          {renderFolder(folder)}
        </div>
      ))}
    </div>
  );
};

export default FolderTree;
