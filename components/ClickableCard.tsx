'use client';
import React, { useCallback, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';

interface ClickableCardProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  preventDoubleClick?: boolean;
  doubleClickDelay?: number;
}

const ClickableCard: React.FC<ClickableCardProps> = memo(({
  href,
  onClick,
  children,
  className = '',
  disabled = false,
  preventDoubleClick = true,
  doubleClickDelay = 1000
}) => {
  const router = useRouter();
  const lastClickTime = useRef<number>(0);
  const isProcessing = useRef<boolean>(false);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Prevent default if disabled
    if (disabled) {
      e.preventDefault();
      return;
    }

    // Prevent double-click if enabled
    if (preventDoubleClick) {
      const now = Date.now();
      if (now - lastClickTime.current < doubleClickDelay || isProcessing.current) {
        e.preventDefault();
        return;
      }
      lastClickTime.current = now;
    }

    // Set processing flag
    isProcessing.current = true;

    // Immediate visual feedback
    const target = e.currentTarget as HTMLElement;
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
      // Use requestAnimationFrame for smooth navigation
      requestAnimationFrame(() => {
        router.push(href);
        // Reset processing flag after navigation
        setTimeout(() => {
          isProcessing.current = false;
        }, 1000);
      });
    } else {
      // Reset processing flag if no navigation
      setTimeout(() => {
        isProcessing.current = false;
      }, 500);
    }
  }, [href, onClick, router, disabled, preventDoubleClick, doubleClickDelay]);

  return (
    <div
      onClick={handleCardClick}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} transition-all duration-200 hover:shadow-lg`}
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
      role={href ? 'link' : 'button'}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e as any);
        }
      }}
    >
      {children}
    </div>
  );
});

ClickableCard.displayName = 'ClickableCard';

export default ClickableCard;
















