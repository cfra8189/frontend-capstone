import { Collaboration, CollaborationRequest, User } from '../types/collaboration';

const API_BASE = '/api/collaborations';

export const collaborationService = {
  // Get all collaborations for a user (both sent and received)
  async getCollaborations(): Promise<Collaboration[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('Failed to fetch collaborations');
    }
    const data = await response.json();
    return data.collaborations;
  },

  // Get pending collaboration requests for a user
  async getPendingCollaborations(): Promise<Collaboration[]> {
    const response = await fetch(`${API_BASE}/pending`);
    if (!response.ok) {
      throw new Error('Failed to fetch pending collaborations');
    }
    const data = await response.json();
    return data.collaborations;
  },

  // Send collaboration invitation
  async sendCollaboration(request: CollaborationRequest): Promise<Collaboration> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send collaboration request');
    }
    
    const data = await response.json();
    return data.collaboration;
  },

  // Respond to collaboration request
  async respondToCollaboration(id: string, status: 'accepted' | 'rejected'): Promise<Collaboration> {
    const response = await fetch(`${API_BASE}/${id}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to respond to collaboration');
    }
    
    const data = await response.json();
    return data.collaboration;
  },

  // Update collaboration role
  async updateCollaborationRole(id: string, role: 'viewer' | 'editor' | 'approver'): Promise<Collaboration> {
    const response = await fetch(`${API_BASE}/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update collaboration role');
    }
    
    const data = await response.json();
    return data.collaboration;
  },

  // Remove collaboration
  async removeCollaboration(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove collaboration');
    }
  },

  // Search user by BOX ID
  async searchUserByBoxId(boxId: string): Promise<User> {
    const response = await fetch(`${API_BASE}/search/${boxId}`);
    if (!response.ok) {
      throw new Error('User not found');
    }
    const data = await response.json();
    return data.user;
  },
};
