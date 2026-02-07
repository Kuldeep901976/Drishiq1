import { getPageMetadata, buildMetadata } from '@/lib/seo.config';
import { ReactNode } from 'react';

export const metadata = buildMetadata(getPageMetadata('blog'));

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
