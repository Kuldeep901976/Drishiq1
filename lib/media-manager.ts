export class MediaManager {
  static async uploadImage(file: File): Promise<string> {
    // Mock implementation
    return 'https://example.com/image.jpg';
  }

  static async uploadVideo(file: File): Promise<string> {
    // Mock implementation
    return 'https://example.com/video.mp4';
  }

  static async deleteMedia(url: string): Promise<boolean> {
    // Mock implementation
    return true;
  }
}

export const MEDIA_CATEGORIES = {
  image: { id: 'image', name: 'Image', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  video: { id: 'video', name: 'Video', extensions: ['.mp4', '.mov', '.avi', '.webm'] },
  document: { id: 'document', name: 'Document', extensions: ['.pdf', '.doc', '.docx', '.txt'] },
  BLOG_FEATURED: 'image'
};
