import { Folder, FolderTree } from '../types/folder';

const API_BASE = '/api/folders';

export const folderService = {
  // Get all folders for user
  async getFolders(): Promise<Folder[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }
    const data = await response.json();
    return data.folders;
  },

  // Get folder tree structure
  async getFolderTree(): Promise<FolderTree> {
    const response = await fetch(`${API_BASE}/tree`);
    if (!response.ok) {
      throw new Error('Failed to fetch folder tree');
    }
    return response.json();
  },

  // Create new folder
  async createFolder(folder: {
    name: string;
    parentId?: string;
    type: 'root' | 'year' | 'custom';
    year?: number;
  }): Promise<Folder> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folder),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create folder');
    }
    
    const data = await response.json();
    return data.folder;
  },

  // Ensure year folder exists
  async ensureYearFolder(): Promise<Folder> {
    const response = await fetch(`${API_BASE}/ensure-year`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to ensure year folder');
    }
    
    const data = await response.json();
    return data.folder;
  },

  // Update folder
  async updateFolder(id: string, updates: {
    name: string;
  }): Promise<Folder> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update folder');
    }
    
    const data = await response.json();
    return data.folder;
  },

  // Delete folder
  async deleteFolder(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete folder');
    }
  },

  // Move project to folder
  async moveProjectToFolder(projectId: string, folderId: string): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/move`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folderId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to move project');
    }
  }
};
