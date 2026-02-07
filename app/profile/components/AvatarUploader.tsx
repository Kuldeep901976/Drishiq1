'use client';

import React from 'react';

interface AvatarUploaderProps {
  avatarUrl?: string | null;
  avatarPreview: string | null;
  firstName: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAvatarChange: (file: File | null) => void;
}

export default function AvatarUploader({
  avatarUrl,
  avatarPreview,
  firstName,
  fileInputRef,
  onAvatarChange,
}: AvatarUploaderProps) {
  const displayImage = avatarPreview || avatarUrl;
  const initials = firstName ? firstName.charAt(0).toUpperCase() : '?';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onAvatarChange(file || null);
  };

  const handleRemove = () => {
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-6">
      {/* Avatar Circle */}
      <div 
        className="w-48 h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-teal-500 text-white text-6xl font-bold shadow-lg overflow-hidden border-4 border-white"
        role="img"
        aria-label={`Avatar for ${firstName || 'user'}`}
      >
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={`${firstName}'s avatar`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#1a5f3a] transition-colors font-medium"
        >
          Upload avatar
        </button>
        
        {displayImage && (
          <button
            type="button"
            onClick={handleRemove}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Remove avatar
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload avatar image"
        />
        
        <p className="text-xs text-gray-500 mt-1">
          Accepts JPG/PNG, max 5MB
        </p>
      </div>
    </div>
  );
}

