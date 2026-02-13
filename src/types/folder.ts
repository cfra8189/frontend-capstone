export interface Folder {
  _id: string;
  name: string;
  path: string;
  parentId?: string;
  userId: string;
  type: 'root' | 'year' | 'custom';
  year?: number;
  createdAt: string;
  updatedAt: string;
  children?: Folder[];
}

export interface FolderTree {
  folders: Folder[];
}

export interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  description?: string;
  metadata: Record<string, any>;
  isFeatured: boolean;
  folderPath: string;
  rootFolder: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}
