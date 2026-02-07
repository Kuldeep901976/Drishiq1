'use client';

import { useState, useRef, useCallback } from 'react';
import { MEDIA_CATEGORIES } from '../lib/media-manager';

const MEDIA_TYPE_ICONS = {
  image: '🖼️',
  video: '🎥',
  audio: '🎵',
  document: '📄'
};

const MEDIA_TYPE_COLORS = {
  image: 'bg-blue-100 text-blue-800',
  video: 'bg-purple-100 text-purple-800',
  audio: 'bg-green-100 text-green-800',
  document: 'bg-orange-100 text-orange-800'
};

export default function MediaUploader({ 
  onUploadSuccess, 
  onUploadError,
  category = MEDIA_CATEGORIES.USER_UPLOADS,
  allowedTypes = ['image', 'video', 'audio', 'document'],
  maxFiles = 5,
  showPreview = true,
  className = ''
}) {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files).slice(0, maxFiles);
    
    // Initialize upload tracking
    const initialUploads = fileArray.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'uploading',
      preview: null,
      result: null,
      error: null
    }));

    setUploadingFiles(prev => [...prev, ...initialUploads]);

    // Generate previews for images
    initialUploads.forEach(async (upload) => {
      if (upload.file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            setUploadingFiles(prev => 
              prev.map(u => 
                u.id === upload.id 
                  ? { ...u, preview: e.target.result }
                  : u
              )
            );
          };
          reader.readAsDataURL(upload.file);
        } catch (error) {
          console.error('Error generating preview:', error);
        }
      }
    });

    // Upload files
    for (const upload of initialUploads) {
      try {
        await uploadSingleFile(upload);
      } catch (error) {
        console.error(`Failed to upload ${upload.file.name}:`, error);
        setUploadingFiles(prev =>
          prev.map(u =>
            u.id === upload.id
              ? { ...u, status: 'error', error: error.message }
              : u
          )
        );
        onUploadError?.(error, upload.file);
      }
    }
  }, [maxFiles, onUploadSuccess, onUploadError]);

  const uploadSingleFile = async (upload) => {
    const formData = new FormData();
    formData.append('file', upload.file);
    formData.append('category', category);

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update upload status
      setUploadingFiles(prev =>
        prev.map(u =>
          u.id === upload.id
            ? { ...u, status: 'completed', progress: 100, result: result.media }
            : u
        )
      );

      onUploadSuccess?.(result.media, upload.file);

      // Remove from upload list after delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
      }, 2000);

    } catch (error) {
      setUploadingFiles(prev =>
        prev.map(u =>
          u.id === upload.id
            ? { ...u, status: 'error', error: error.message }
            : u
        )
      );
      throw error;
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    e.target.value = '';
  }, [handleFiles]);

  const getMediaType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeUpload = (uploadId) => {
    setUploadingFiles(prev => prev.filter(u => u.id !== uploadId));
  };

  return (
    <div className={`media-uploader ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={allowedTypes.includes('image') ? 'image/*,' : ''}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              Drop files here or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports: {allowedTypes.join(', ')} • Max {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Uploading Files ({uploadingFiles.length})
          </h3>
          <div className="space-y-3">
            {uploadingFiles.map((upload) => {
              const mediaType = getMediaType(upload.file);
              return (
                <div
                  key={upload.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  {/* Preview or Icon */}
                  <div className="flex-shrink-0">
                    {showPreview && upload.preview ? (
                      <img
                        src={upload.preview}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded flex items-center justify-center text-xl ${MEDIA_TYPE_COLORS[mediaType]}`}>
                        {MEDIA_TYPE_ICONS[mediaType]}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(upload.file.size)} • {mediaType}
                    </p>
                    
                    {/* Progress Bar */}
                    {upload.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Status Messages */}
                    {upload.status === 'completed' && (
                      <p className="text-xs text-green-600 mt-1">✓ Upload completed</p>
                    )}
                    {upload.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">✗ {upload.error}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {upload.status === 'completed' && (
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                    {upload.status === 'error' && (
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}






