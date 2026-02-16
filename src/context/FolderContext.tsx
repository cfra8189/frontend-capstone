import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Folder, FolderTree } from '../types/folder';
import { folderService } from '../lib/folderService';

interface FolderContextType {
  folders: Folder[];
  folderTree: FolderTree;
  selectedFolderId?: string;
  loading: boolean;
  error: string | null;
  selectFolder: (folderId?: string) => void;
  createFolder: (parentId?: string, name?: string) => Promise<Folder | void>;
  renameFolder: (folder: Folder, newName: string) => void;
  deleteFolder: (folder: Folder) => void;
  refreshFolders: () => void;
  moveProject: (projectId: string, folderId: string) => Promise<void>;
  ensureYearFolder: () => Promise<Folder>;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export function FolderProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTree>({ folders: [] });
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading folders...');

      const [foldersData, treeData] = await Promise.all([
        folderService.getFolders(),
        folderService.getFolderTree()
      ]);

      console.log('Folders loaded:', foldersData);
      console.log('Tree loaded:', treeData);

      setFolders(foldersData);
      setFolderTree(treeData);

      // Auto-select current year folder
      const currentYear = new Date().getFullYear().toString();
      const yearFolder = foldersData.find(f => f.type === 'year' && f.name === currentYear);
      if (yearFolder && !selectedFolderId) {
        setSelectedFolderId(yearFolder._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const selectFolder = (folderId?: string) => {
    setSelectedFolderId(folderId);
  };

  const createFolder = async (parentId?: string, name?: string): Promise<Folder | undefined> => {
    try {
      console.log('Creating folder with parentId:', parentId);

      const parentFolder = folders.find(f => f._id === parentId);
      const folderType = parentFolder?.type === 'root' ? 'year' : 'custom';

      let folderName = name || '';
      if (!folderName) {
        if (folderType === 'year') {
          folderName = new Date().getFullYear().toString();
        } else {
          throw new Error('Folder name is required');
        }
      }

      console.log('Creating folder:', { name: folderName.trim(), parentId, type: folderType });

      const newFolder = await folderService.createFolder({
        name: folderName.trim(),
        parentId,
        type: folderType,
        year: folderType === 'year' ? new Date().getFullYear() : undefined,
      });

      console.log('Folder created:', newFolder);
      await loadFolders();
      return newFolder;
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create folder');
      throw err;
    }
  };

  const renameFolder = async (folder: Folder, newName: string) => {
    try {
      await folderService.updateFolder(folder._id, { name: newName });
      await loadFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename folder');
    }
  };

  const deleteFolder = async (folder: Folder) => {
    if (!confirm(`Are you sure you want to delete "${folder.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await folderService.deleteFolder(folder._id);
      await loadFolders();

      if (selectedFolderId === folder._id) {
        setSelectedFolderId(undefined);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      setError(errorMessage);
      throw err; // Re-throw so UI can handle it
    }
  };

  const moveProject = async (projectId: string, folderId: string) => {
    try {
      console.log('Moving project:', projectId, 'to folder:', folderId);
      await folderService.moveProjectToFolder(projectId, folderId);
      console.log('Project moved successfully');
      // Show success message
      setError(null);
      // We don't need to reload folders, but the consumer should reload projects
    } catch (err) {
      console.error('Error moving project:', err);
      setError(err instanceof Error ? err.message : 'Failed to move project');
      throw err;
    }
  };

  const refreshFolders = () => {
    loadFolders();
  };

  const ensureYearFolder = async (): Promise<Folder> => {
    try {
      const yearFolder = await folderService.ensureYearFolder();
      await loadFolders();
      return yearFolder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ensure year folder');
      throw err;
    }
  };

  const value: FolderContextType = {
    folders,
    folderTree,
    selectedFolderId,
    loading,
    error,
    selectFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    moveProject,
    refreshFolders,
    ensureYearFolder,
  };

  return (
    <FolderContext.Provider value={value}>
      {children}
    </FolderContext.Provider>
  );
}

export function useFolderContext() {
  const context = useContext(FolderContext);
  if (context === undefined) {
    throw new Error('useFolderContext must be used within a FolderProvider');
  }
  return context;
}
