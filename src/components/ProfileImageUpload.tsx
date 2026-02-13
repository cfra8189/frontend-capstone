import React, { useState, useRef } from 'react';
import { profileService } from '../lib/profileService';

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate: (imageUrl: string | null) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function ProfileImageUpload({
  currentImageUrl,
  onImageUpdate,
  size = 'medium',
  className = ''
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const result = await profileService.uploadProfileImage(file);
      onImageUpdate(result.profileImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentImageUrl) return;

    try {
      setUploading(true);
      setError('');
      
      await profileService.deleteProfileImage();
      onImageUpdate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-theme-tertiary border-2 border-theme-secondary hover:border-accent transition-colors cursor-pointer group`}>
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            onClick={handleClick}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-theme-muted group-hover:text-accent transition-colors"
            onClick={handleClick}
          >
            <svg
              width="40%"
              height="40%"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
        {currentImageUrl && (
          <button
            onClick={handleDelete}
            disabled={uploading}
            className="w-6 h-6 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-xs"
            title="Remove image"
          >
            ×
          </button>
        )}
        <button
          onClick={handleClick}
          disabled={uploading}
          className="w-6 h-6 rounded-full bg-accent text-accent-contrast hover:bg-accent/90 flex items-center justify-center text-xs"
          title={currentImageUrl ? 'Change image' : 'Add image'}
        >
          {currentImageUrl ? '✏' : '+'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-red-400 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
