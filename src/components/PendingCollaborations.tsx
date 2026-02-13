import React from 'react';
import { Collaboration } from '../types/collaboration';
import { useCollaborationContext } from '../context/CollaborationContext';

interface PendingCollaborationsProps {
  collaborations: Collaboration[];
}

export default function PendingCollaborations({ collaborations }: PendingCollaborationsProps) {
  const { respondToCollaboration } = useCollaborationContext();

  const handleRespond = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await respondToCollaboration(id, status);
    } catch (err) {
      // Error is handled by the context
    }
  };

  const getItemInfo = (collaboration: Collaboration) => {
    if (collaboration.project) {
      return {
        type: 'Project',
        name: collaboration.project.title,
        status: collaboration.project.status
      };
    }
    if (collaboration.agreement) {
      return {
        type: 'Agreement',
        name: collaboration.agreement.title,
        status: 'document'
      };
    }
    if (collaboration.folder) {
      return {
        type: 'Folder',
        name: collaboration.folder.name,
        status: 'folder'
      };
    }
    return { type: 'Unknown', name: 'Unknown', status: 'unknown' };
  };

  if (collaborations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-theme-muted">No pending collaboration requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-theme-primary mb-4">
        Pending Requests ({collaborations.length})
      </h3>
      
      {collaborations.map((collaboration) => {
        const itemInfo = getItemInfo(collaboration);
        const isExpired = collaboration.expiresAt && new Date(collaboration.expiresAt) < new Date();
        
        return (
          <div key={collaboration.id} className="card p-4 rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 rounded bg-theme-tertiary text-theme-muted">
                    {itemInfo.type}
                  </span>
                  <span className="text-sm font-bold text-theme-primary">
                    {itemInfo.name}
                  </span>
                </div>
                
                <div className="text-sm text-theme-secondary mb-2">
                  <p><strong>From:</strong> {collaboration.owner?.displayName}</p>
                  <p><strong>Role:</strong> {collaboration.role}</p>
                  {collaboration.message && (
                    <p><strong>Message:</strong> {collaboration.message}</p>
                  )}
                </div>
                
                <div className="text-xs text-theme-muted">
                  <p>Requested: {new Date(collaboration.requestedAt).toLocaleDateString()}</p>
                  {collaboration.expiresAt && (
                    <p className={isExpired ? 'text-red-400' : ''}>
                      Expires: {new Date(collaboration.expiresAt).toLocaleDateString()}
                      {isExpired && ' (Expired)'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {!isExpired && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond(collaboration.id, 'rejected')}
                  className="px-3 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleRespond(collaboration.id, 'accepted')}
                  className="px-3 py-1 rounded bg-accent text-accent-contrast hover:bg-accent/90 text-sm"
                >
                  Accept
                </button>
              </div>
            )}
            
            {isExpired && (
              <div className="text-xs text-red-400">
                This request has expired
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
