export const profileService = {
  // Upload profile image
  async uploadProfileImage(file: File): Promise<{ profileImageUrl: string }> {
    const formData = new FormData();
    formData.append('profileImage', file);

    const response = await fetch('/api/profile/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload profile image');
    }

    return response.json();
  },

  // Get profile image
  async getProfileImage(): Promise<{ profileImageUrl: string | null }> {
    const response = await fetch('/api/profile/image');
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile image');
    }
    
    return response.json();
  },

  // Delete profile image
  async deleteProfileImage(): Promise<void> {
    const response = await fetch('/api/profile/image', {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete profile image');
    }
  },
};
