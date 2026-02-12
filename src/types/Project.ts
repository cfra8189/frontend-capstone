export interface Project {
  id: number;
  userId: string;
  title: string;
  type: string;
  status: string;
  description: string | null;
  metadata: Record<string, any>;
  isFeatured: boolean;
  folderPath: string;
  rootFolder: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedProject {
  id: number;
  title: string;
  type: string;
  status: string;
  description: string | null;
  metadata: Record<string, any>;
  isFeatured: boolean;
  folderPath: string;
  rootFolder: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistProject {
  id: number;
  title: string;
  type: string;
  status: string;
  description: string | null;
  metadata: Record<string, any>;
  isFeatured: boolean;
  folderPath: string;
  rootFolder: string;
  createdAt: string;
  updatedAt: string;
}
