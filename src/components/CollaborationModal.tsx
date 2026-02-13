import React, { useState } from 'react';
import { CollaborationRequest, User } from '../types/collaboration';
import { useCollaborationContext } from '../context/CollaborationContext';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  agreementId?: string;
  folderId?: string;
  itemType: 'project' | 'agreement' | 'folder';
  itemName: string;
}

export default function CollaborationModal({
  isOpen,
  onClose,
  projectId,
  agreementId,
  folderId,
  itemType,
  itemName
}: CollaborationModalProps) {
  const { sendCollaboration, searchUser } = useCollaborationContext();
  const [collaboratorBoxId, setCollaboratorBoxId] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor' | 'approver'>('viewer');
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [sending, setSending] = useState(false);

  const handleSearchUser = async () => {
    if (!collaboratorBoxId.trim()) {
      setSearchError('Please enter a BOX ID');
      return;
    }

    try {
      setSearching(true);
      setSearchError('');
      const user = await searchUser(collaboratorBoxId.trim());
      setFoundUser(user);
    } catch (err) {
      setSearchError('User not found');
      setFoundUser(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSendCollaboration = async () => {
    if (!foundUser) {
      setSearchError('Please search for a valid user');
      return;
    }

    try {
      setSending(true);
      const request: CollaborationRequest = {
        projectId,
        agreementId,
        folderId,
        collaboratorBoxId: foundUser.boxCode,
        role,
        message: message.trim() || undefined
      };

      await sendCollaboration(request);
      onClose();
      // Reset form
      setCollaboratorBoxId('');
      setRole('viewer');
      setMessage('');
      setFoundUser(null);
      setSearchError('');
    } catch (err) {
      // Error is handled by the context
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
      // Reset form
      setCollaboratorBoxId('');
      setRole('viewer');
      setMessage('');
      setFoundUser(null);
      setSearchError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="card p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-accent">
            Add Collaborator to {itemType}
          </h3>
          <button
            onClick={handleClose}
            className="text-theme-muted hover:text-theme-primary text-xl"
            disabled={sending}
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-theme-secondary mb-2">
            <strong>{itemName}</strong>
          </p>
        </div>

        <div className="space-y-4">
          {/* BOX ID Search */}
          <div>
            <label className="block text-sm text-theme-secondary mb-1">
              Collaborator BOX ID *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={collaboratorBoxId}
                onChange={(e) => setCollaboratorBoxId(e.target.value.toUpperCase())}
                placeholder="BOX-XXXXXX"
                className="input-field flex-1 p-2 rounded font-mono"
                disabled={sending}
              />
              <button
                onClick={handleSearchUser}
                disabled={searching || sending || !collaboratorBoxId.trim()}
                className="btn-primary px-4 py-2 rounded text-sm"
              >
                {searching ? '...' : 'Search'}
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-red-400 mt-1">{searchError}</p>
            )}
          </div>

          {/* Found User Display */}
          {foundUser && (
            <div className="p-3 bg-theme-tertiary rounded-lg">
              <p className="text-sm font-bold text-theme-primary">
                {foundUser.displayName}
              </p>
              <p className="text-xs text-theme-muted">
                {foundUser.email} • {foundUser.boxCode}
              </p>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm text-theme-secondary mb-1">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'viewer' | 'editor' | 'approver')}
              className="input-field w-full p-2 rounded"
              disabled={sending}
            >
              <option value="viewer">Viewer - Can view only</option>
              <option value="editor">Editor - Can view and edit</option>
              <option value="approver">Approver - Can view, edit, and approve</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm text-theme-secondary mb-1">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message for the collaborator..."
              rows={3}
              className="input-field w-full p-2 rounded"
              disabled={sending}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              disabled={sending}
              className="flex-1 px-4 py-2 rounded border border-theme-tertiary text-theme-secondary hover:bg-theme-tertiary"
            >
              Cancel
            </button>
            <button
              onClick={handleSendCollaboration}
              disabled={sending || !foundUser}
              className="flex-1 btn-primary font-bold py-2 rounded"
            >
              {sending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
