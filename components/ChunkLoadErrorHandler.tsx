'use client';

import { useEffect } from 'react';

/**
 * ChunkLoadErrorHandler
 * Handles webpack chunk loading errors with automatic retry
 * This prevents the app from breaking when chunks fail to load
 */
export default function ChunkLoadErrorHandler() {
  useEffect(() => {
    // Handle chunk loading errors globally
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Check if it's a chunk loading error
      if (
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('ChunkLoadError') ||
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Failed to fetch dynamically imported module')
      ) {
        event.preventDefault(); // Prevent default error handling
        
        console.warn('⚠️ Chunk loading error detected, attempting recovery...', {
          error: error.message,
          chunk: error.message.match(/chunk[^\s]+/)?.[0] || 'unknown'
        });
        
        // Extract chunk name from error if possible
        const chunkMatch = error.message.match(/chunk[^\s]+/);
        const chunkName = chunkMatch ? chunkMatch[0] : null;
        
        // Retry loading the chunk
        const retryChunkLoad = async () => {
          try {
            // Clear the failed chunk from cache
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(
                cacheNames.map(name => caches.delete(name))
              );
            }
            
            // Reload the page after a short delay
            setTimeout(() => {
              console.log('🔄 Reloading page to recover from chunk error...');
              window.location.reload();
            }, 1000);
          } catch (retryError) {
            console.error('❌ Failed to recover from chunk error:', retryError);
            // Last resort: reload immediately
            window.location.reload();
          }
        };
        
        retryChunkLoad();
      }
    };
    
    // Handle unhandled promise rejections (chunk loading can fail as promises)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      
      if (
        reason?.message?.includes('Loading chunk') ||
        reason?.message?.includes('ChunkLoadError') ||
        reason?.name === 'ChunkLoadError' ||
        reason?.message?.includes('Failed to fetch dynamically imported module')
      ) {
        event.preventDefault(); // Prevent default error handling
        
        console.warn('⚠️ Chunk loading promise rejection detected, attempting recovery...', {
          error: reason.message
        });
        
        // Retry by reloading
        setTimeout(() => {
          console.log('🔄 Reloading page to recover from chunk promise rejection...');
          window.location.reload();
        }, 1000);
      }
    };
    
    // Add event listeners
    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Cleanup
    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return null; // This component doesn't render anything
}



