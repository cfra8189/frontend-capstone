import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Collaboration, CollaborationRequest, User } from '../types/collaboration';
import { collaborationService } from '../lib/collaborationService';

interface CollaborationContextType {
  collaborations: Collaboration[];
  pendingCollaborations: Collaboration[];
  loading: boolean;
  error: string | null;
  refreshCollaborations: () => void;
  sendCollaboration: (request: CollaborationRequest) => Promise<Collaboration>;
  respondToCollaboration: (id: string, status: 'accepted' | 'rejected') => Promise<void>;
  updateCollaborationRole: (id: string, role: 'viewer' | 'editor' | 'approver') => Promise<void>;
  removeCollaboration: (id: string) => Promise<void>;
  searchUser: (boxId: string) => Promise<User>;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({ children }: { children: ReactNode }) {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [pendingCollaborations, setPendingCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCollaborations = async () => {
    try {
      setLoading(true);
      setError(null);
      const [collaborationsData, pendingData] = await Promise.all([
        collaborationService.getCollaborations(),
        collaborationService.getPendingCollaborations()
      ]);
      setCollaborations(collaborationsData);
      setPendingCollaborations(pendingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaborations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborations();
  }, []);

  const sendCollaboration = async (request: CollaborationRequest): Promise<Collaboration> => {
    try {
      const collaboration = await collaborationService.sendCollaboration(request);
      await loadCollaborations();
      return collaboration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send collaboration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const respondToCollaboration = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await collaborationService.respondToCollaboration(id, status);
      await loadCollaborations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to respond to collaboration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateCollaborationRole = async (id: string, role: 'viewer' | 'editor' | 'approver') => {
    try {
      await collaborationService.updateCollaborationRole(id, role);
      await loadCollaborations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update collaboration role';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const removeCollaboration = async (id: string) => {
    try {
      await collaborationService.removeCollaboration(id);
      await loadCollaborations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove collaboration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const searchUser = async (boxId: string): Promise<User> => {
    try {
      const user = await collaborationService.searchUserByBoxId(boxId);
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'User not found';
      throw new Error(errorMessage);
    }
  };

  const refreshCollaborations = () => {
    loadCollaborations();
  };

  const value: CollaborationContextType = {
    collaborations,
    pendingCollaborations,
    loading,
    error,
    refreshCollaborations,
    sendCollaboration,
    respondToCollaboration,
    updateCollaborationRole,
    removeCollaboration,
    searchUser
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaborationContext() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaborationContext must be used within a CollaborationProvider');
  }
  return context;
}
