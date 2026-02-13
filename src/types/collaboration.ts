export interface Collaboration {
  id: string;
  projectId?: string;
  agreementId?: string;
  folderId?: string;
  ownerId: string;
  collaboratorId: string;
  collaboratorBoxId: string;
  role: 'viewer' | 'editor' | 'approver';
  status: 'pending' | 'accepted' | 'rejected';
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canApprove: boolean;
    canDelete: boolean;
  };
  message?: string;
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  project?: {
    id: string;
    title: string;
    status: string;
  };
  agreement?: {
    id: string;
    title: string;
  };
  folder?: {
    id: string;
    name: string;
    path: string;
  };
  owner?: {
    id: string;
    displayName: string;
    email: string;
    boxCode: string;
  };
  collaborator?: {
    id: string;
    displayName: string;
    email: string;
    boxCode: string;
  };
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  boxCode: string;
  role: string;
}

export interface CollaborationRequest {
  projectId?: string;
  agreementId?: string;
  folderId?: string;
  collaboratorBoxId: string;
  role: 'viewer' | 'editor' | 'approver';
  message?: string;
}
