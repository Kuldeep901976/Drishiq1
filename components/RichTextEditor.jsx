'use client';

import { useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import MediaUploader from './MediaUploader';
import { MEDIA_CATEGORIES } from '../lib/media-manager';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start writing your blog post...',
  className = ''
}) {
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const quillRef = useRef(null);

  // Custom toolbar options
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        [{ 'align': [] }],
        ['clean'],
        ['media-upload'] // Custom button
      ],
      handlers: {
        'media-upload': handleMediaUpload
      }
    },
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'code-block'
  ];

  function handleMediaUpload() {
    setShowMediaUploader(true);
  }

  const handleMediaUploadSuccess = useCallback((media, file) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection();
    const index = range ? range.index : quill.getLength();

    // Insert media based on type
    if (media.mediaType === 'image') {
      quill.insertEmbed(index, 'image', media.url, 'user');
      
      // Add caption option
      quill.insertText(index + 1, '\n', 'user');
      quill.insertText(index + 2, `📷 ${file.name}`, 'user');
      quill.insertText(index + 2 + file.name.length + 2, '\n\n', 'user');
      
    } else if (media.mediaType === 'video') {
      // Create video embed
      const videoEmbed = `
        <div class="video-container" style="margin: 20px 0; text-align: center;">
          <video controls style="max-width: 100%; border-radius: 8px;">
            <source src="${media.url}" type="${file.type}">
            Your browser does not support the video tag.
          </video>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">🎥 ${file.name}</p>
        </div>
      `;
      quill.clipboard.dangerouslyPasteHTML(index, videoEmbed);
      
    } else if (media.mediaType === 'audio') {
      // Create audio embed
      const audioEmbed = `
        <div class="audio-container" style="margin: 20px 0;">
          <audio controls style="width: 100%;">
            <source src="${media.url}" type="${file.type}">
            Your browser does not support the audio element.
          </audio>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">🎵 ${file.name}</p>
        </div>
      `;
      quill.clipboard.dangerouslyPasteHTML(index, audioEmbed);
      
    } else if (media.mediaType === 'document') {
      // Create document link
      quill.insertText(index, `📄 `, 'user');
      quill.insertText(index + 2, file.name, 'user', { link: media.url });
      quill.insertText(index + 2 + file.name.length, '\n\n', 'user');
    }

    // Close uploader
    setShowMediaUploader(false);
    setIsUploading(false);
  }, []);

  const handleMediaUploadError = useCallback((error, file) => {
    console.error('Media upload failed:', error);
    alert(`Failed to upload ${file.name}: ${error.message}`);
    setIsUploading(false);
  }, []);

  return (
    <div className={`rich-text-editor ${className}`}>
      <style jsx global>{`
        .ql-toolbar {
          border-radius: 12px 12px 0 0 !important;
          border: 1px solid #e2e8f0 !important;
          background: #f8fafc;
        }
        
        .ql-container {
          border-radius: 0 0 12px 12px !important;
          border: 1px solid #e2e8f0 !important;
          border-top: none !important;
          font-family: inherit;
        }
        
        .ql-editor {
          min-height: 300px;
          font-size: 16px;
          line-height: 1.6;
        }
        
        .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        
        .ql-toolbar .ql-formats {
          margin-right: 8px;
        }
        
        .video-container video,
        .audio-container audio {
          margin: 10px 0;
        }
        
        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 10px 0;
        }
        
        .ql-editor blockquote {
          border-left: 4px solid #0b4422;
          background: #f0fdf4;
          margin: 16px 0;
          padding: 16px;
          border-radius: 0 8px 8px 0;
        }
        
        .ql-editor code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }
        
        .ql-editor pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
        }
        
        .ql-editor h1, .ql-editor h2, .ql-editor h3 {
          margin-top: 24px;
          margin-bottom: 16px;
        }
        
        .ql-editor h1 { font-size: 2em; }
        .ql-editor h2 { font-size: 1.5em; }
        .ql-editor h3 { font-size: 1.25em; }
      `}</style>

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />

      {/* Media Upload Modal */}
      {showMediaUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Add Media to Your Post</h2>
                <button
                  onClick={() => setShowMediaUploader(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isUploading}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <MediaUploader
                category={MEDIA_CATEGORIES.BLOG_CONTENT}
                allowedTypes={['image', 'video', 'audio', 'document']}
                maxFiles={1}
                onUploadSuccess={handleMediaUploadSuccess}
                onUploadError={handleMediaUploadError}
                className="mb-4"
              />

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowMediaUploader(false)}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






