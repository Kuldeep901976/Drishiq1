'use client';

import { memo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface OptimizedButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const OptimizedButton = memo(({ 
  href, 
  onClick, 
  children, 
  className = '', 
  disabled = false,
  type = 'button'
}: OptimizedButtonProps) => {
  const router = useRouter();
  const isNavigating = useRef(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Prevent multiple clicks
    if (isNavigating.current || disabled) {
      e.preventDefault();
      return;
    }

    // Immediate visual feedback
    const target = e.currentTarget as HTMLButtonElement;
    target.style.transform = 'scale(0.98)';
    target.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
      target.style.transform = 'scale(1)';
    }, 100);

    // Execute onClick immediately (non-blocking)
    if (onClick) {
      onClick();
    }

    // Handle navigation
    if (href) {
      isNavigating.current = true;
      
      // Use requestAnimationFrame for smooth navigation
      requestAnimationFrame(() => {
        router.push(href);
        // Reset navigation flag after a short delay
        setTimeout(() => {
          isNavigating.current = false;
        }, 1000);
      });
    }
  }, [href, onClick, router, disabled]);

  return (
    <button
      type={type}
      onClick={handleClick}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={disabled}
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {children}
    </button>
  );
});

OptimizedButton.displayName = 'OptimizedButton';

export default OptimizedButton;
















