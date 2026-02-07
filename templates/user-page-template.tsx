'use client';

/**
 * User-Facing Page Template
 * 
 * This template demonstrates the responsive design patterns that should be used
 * for all new user-facing pages. Copy this template when creating new pages.
 * 
 * Key Features:
 * - Responsive container with proper max-width
 * - Mobile-first responsive text sizing
 * - Flexible grid layouts
 * - Proper overflow handling
 * - Consistent spacing
 */

import { PageContainer, ResponsiveCard, ResponsiveGrid, ResponsiveText } from '@/components/responsive';

export default function UserPageTemplate() {
  return (
    <PageContainer maxWidth="7xl" background="gradient" padding="md">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0B4422] to-[#166534] rounded-3xl p-6 sm:p-8 lg:p-12 mb-8 shadow-2xl relative overflow-visible w-full">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center relative z-10 w-full overflow-visible flex-wrap">
          {/* Content */}
          <div className="flex-1 text-white flex flex-col justify-center text-center sm:text-left w-full order-2">
            <div className="w-full overflow-visible">
              <ResponsiveText variant="h1" color="white" weight="bold" align="center" className="sm:text-left">
                Page Title
              </ResponsiveText>
              <ResponsiveText variant="body" color="white" className="mt-4 opacity-90">
                Page description goes here
              </ResponsiveText>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg min-h-[500px]">
        <ResponsiveText variant="h2" color="primary" weight="bold" className="mb-6 sm:mb-8">
          Section Title
        </ResponsiveText>

        {/* Responsive Grid Example */}
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <ResponsiveCard
              key={item}
              padding="md"
              shadow="lg"
              hover
              onClick={() => console.log('Clicked', item)}
            >
              <ResponsiveText variant="h3" color="primary" weight="semibold" className="mb-2">
                Card {item}
              </ResponsiveText>
              <ResponsiveText variant="body" color="secondary">
                Card content description
              </ResponsiveText>
            </ResponsiveCard>
          ))}
        </ResponsiveGrid>

        {/* Responsive Button Example */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#0B4422] hover:bg-[#0a3a1e] text-white rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl">
            Primary Action
          </button>
          <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-gray-50 text-[#0B4422] border-2 border-[#0B4422] rounded-xl text-sm sm:text-base font-semibold transition-all">
            Secondary Action
          </button>
        </div>
      </div>
    </PageContainer>
  );
}

