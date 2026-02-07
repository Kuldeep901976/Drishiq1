/**
 * Shared Key Generation Utility
 * Used by both Node and Worker R2 adapters to ensure consistent key format
 */

/**
 * Sanitize file name for safe storage
 */
export function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_');
}

/**
 * Generate storage key for file upload
 * Format: {category}/{userId}/{timestamp}-{sanitizedFileName}
 * 
 * @param category - File category (avatars, blog-images, etc.)
 * @param userId - User ID
 * @param fileName - Original file name
 * @returns Storage key
 */
export function generateStorageKey(
  category: string,
  userId: string,
  fileName: string
): string {
  const sanitized = sanitizeFileName(fileName || 'file');
  const timestamp = Date.now();
  return `${category}/${userId}/${timestamp}-${sanitized}`;
}

/**
 * Validate storage key format
 * Prevents path traversal attacks
 */
export function validateStorageKey(key: string): boolean {
  // Must not contain path traversal
  if (key.includes('..') || key.includes('//')) {
    return false;
  }
  
  // Must match expected format: category/userId/timestamp-filename
  const parts = key.split('/');
  if (parts.length < 3) {
    return false;
  }
  
  // Category must be valid
  const validCategories = ['avatars', 'blog-images', 'reports', 'testimonials', 'media'];
  if (!validCategories.includes(parts[0])) {
    return false;
  }
  
  return true;
}

/**
 * Extract metadata from storage key
 */
export function parseStorageKey(key: string): {
  category: string;
  userId: string;
  fileName: string;
  timestamp: number;
} | null {
  if (!validateStorageKey(key)) {
    return null;
  }
  
  const parts = key.split('/');
  const category = parts[0];
  const userId = parts[1];
  const fileNameWithTimestamp = parts.slice(2).join('/');
  const timestampMatch = fileNameWithTimestamp.match(/^(\d+)-(.+)$/);
  
  if (!timestampMatch) {
    return null;
  }
  
  return {
    category,
    userId,
    timestamp: parseInt(timestampMatch[1], 10),
    fileName: timestampMatch[2],
  };
}






