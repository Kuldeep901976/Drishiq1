/**
 * Responsive Components
 * 
 * Reusable components for consistent responsive design across all user-facing pages.
 * 
 * @example
 * import { PageContainer, ResponsiveCard, ResponsiveGrid, ResponsiveText } from '@/components/responsive';
 * 
 * export default function MyPage() {
 *   return (
 *     <PageContainer maxWidth="7xl" background="gradient">
 *       <ResponsiveText variant="h1" color="primary" weight="bold">
 *         Welcome
 *       </ResponsiveText>
 *       <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }}>
 *         <ResponsiveCard padding="lg" shadow="xl" hover>
 *           Card Content
 *         </ResponsiveCard>
 *       </ResponsiveGrid>
 *     </PageContainer>
 *   );
 * }
 */

export { default as PageContainer } from './PageContainer';
export { default as ResponsiveCard } from './ResponsiveCard';
export { default as ResponsiveGrid } from './ResponsiveGrid';
export { default as ResponsiveText } from './ResponsiveText';

