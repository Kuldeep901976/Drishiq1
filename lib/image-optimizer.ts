export function optimizeImage(url: string, width?: number, height?: number, quality?: number): string {
  if (!url) return '';
  
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality) params.set('q', quality.toString());
  
  return `${url}?${params.toString()}`;
}

export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
}

export class ImageOptimizer {
  static OPTIMIZATION_PROFILES = {
    featured: { width: 800, height: 600, quality: 85 },
    thumbnail: { width: 300, height: 200, quality: 80 },
    avatar: { width: 150, height: 150, quality: 90 }
  };

  static optimize(url: string, width?: number, height?: number, quality?: number): string {
    return optimizeImage(url, width, height, quality);
  }

  static async optimizeImage(file: File, options: { type?: keyof typeof ImageOptimizer['OPTIMIZATION_PROFILES'] } = {}): Promise<File & { width?: number; height?: number; format?: string; blob: Blob }> {
    // Mock implementation - return original file with additional properties
    return Object.assign(file, { width: 800, height: 600, format: 'jpeg', blob: file });
  }

  static isValidImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getAvailableProfiles() {
    return Object.entries(this.OPTIMIZATION_PROFILES).map(([key, value]) => ({
      type: key,
      width: value.width,
      height: value.height,
      quality: value.quality,
      maxWidth: value.width,
      maxHeight: value.height,
      maxSize: `${value.quality}%`,
      maxFileSize: 1000
    })) as any[];
  }
}
