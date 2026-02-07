'use client';

import Image, { ImageProps } from 'next/image';
import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  /** Show blur placeholder while loading */
  showBlur?: boolean;
  /** Fallback image URL if loading fails */
  fallbackSrc?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** Observer threshold for lazy loading (0-1) */
  lazyThreshold?: number;
  /** Root margin for intersection observer */
  lazyRootMargin?: string;
}

const defaultFallback = '/assets/images/placeholder.png';

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  showBlur = true,
  fallbackSrc = defaultFallback,
  loadingComponent,
  errorComponent,
  lazyThreshold = 0.1,
  lazyRootMargin = '100px',
  className = '',
  style,
  priority = false,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imageRef = useRef<HTMLDivElement>(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (priority) return; // Skip lazy loading for priority images

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: lazyThreshold,
        rootMargin: lazyRootMargin,
      }
    );

    const currentRef = imageRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [priority, lazyThreshold, lazyRootMargin]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Determine the actual src to use
  const actualSrc = hasError ? fallbackSrc : src;

  // Default loading state
  const defaultLoadingState = (
    <div 
      className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center"
      style={style}
    >
      <div className="w-8 h-8 border-2 border-gray-300 border-t-[#0B4422] rounded-full animate-spin" />
    </div>
  );

  // Default error state
  const defaultErrorState = (
    <div 
      className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400"
      style={style}
    >
      <svg 
        className="w-8 h-8" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
    </div>
  );

  return (
    <div 
      ref={imageRef} 
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {isVisible ? (
        <>
          {isLoading && (loadingComponent || defaultLoadingState)}
          {hasError && !fallbackSrc && (errorComponent || defaultErrorState)}
          <Image
            src={actualSrc}
            alt={alt}
            className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            placeholder={showBlur && typeof src === 'string' ? 'blur' : undefined}
            blurDataURL={showBlur ? 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQDEUgAH/9k=' : undefined}
            {...props}
          />
        </>
      ) : (
        // Placeholder while waiting to become visible
        <div 
          className="bg-gray-100 animate-pulse" 
          style={{ 
            width: props.width || '100%', 
            height: props.height || '100%',
            ...style 
          }} 
        />
      )}
    </div>
  );
};

export default OptimizedImage;

// Hook for lazy loading multiple images efficiently
export function useImagePreload(urls: string[]) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const preloadImage = (url: string) => {
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        setLoaded(prev => ({ ...prev, [url]: true }));
      };
      img.onerror = () => {
        setLoaded(prev => ({ ...prev, [url]: false }));
      };
    };

    urls.forEach(url => {
      if (!loaded[url]) {
        preloadImage(url);
      }
    });
  }, [urls, loaded]);

  return loaded;
}
