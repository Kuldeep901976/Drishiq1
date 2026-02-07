'use client';

import Link from 'next/link';
import { memo } from 'react';

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  prefetch?: boolean;
}

const OptimizedLink = memo(({ href, children, className, onClick, prefetch = true }: OptimizedLinkProps) => {
  const handleClick = (e: React.MouseEvent) => {
    // Optimize click handling
    if (onClick) {
      onClick();
    }
    
    // Preload the target page
    if (prefetch) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  };

  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  );
});

OptimizedLink.displayName = 'OptimizedLink';

export default OptimizedLink;
















