'use client';


import { trackEvent } from './GoogleAnalytics';
import { useEffect } from 'react';

interface SEOWrapperProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  structuredData?: any;
  noIndex?: boolean;
  canonical?: string;
  children: React.ReactNode;
}

export default function SEOWrapper({
  title = 'DrishiQ - See Through the Challenge',
  description = 'AI-powered clarity platform',
  keywords = ['AI clarity platform', 'intelligent perception', 'challenge resolution'],
  image = '/assets/logo/og-image.png',
  url = '',
  type = 'website',
  structuredData,
  noIndex = false,
  canonical,
  children
}: SEOWrapperProps) {
  const fullTitle = title.includes('DrishiQ') ? title : `${title} | DrishiQ`;
  const fullUrl = canonical || `https://drishiq.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://drishiq.com${image}`;

  // Track page view for analytics
  useEffect(() => {
    trackEvent('page_view', {
      page_title: fullTitle,
      page_location: fullUrl,
      page_type: type
    });
  }, [fullTitle, fullUrl, type]);

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(', ')} />
        <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={fullUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={type} />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:image" content={fullImage} />
        <meta property="og:site_name" content="DrishiQ" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={fullImage} />
        <meta name="twitter:site" content="@drishiq" />
        <meta name="twitter:creator" content="@drishiq" />
        
        {/* Additional Meta Tags */}
        <meta name="author" content="DrishiQ Team" />
        <meta name="theme-color" content="#0B4422" />
        <meta name="msapplication-TileColor" content="#0B4422" />
        
        {/* Structured Data */}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData)
            }}
          />
        )}
      </Head>
      {children}
    </>
  );
}

// Predefined structured data templates
export const structuredDataTemplates = {
  // Organization data
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DrishiQ",
    "url": "https://drishiq.com",
    "logo": "https://drishiq.com/assets/logo/Logo.png",
    "description": "AI-powered clarity platform with intelligent perception",
    "foundingDate": "2024",
    "sameAs": [
      "https://twitter.com/drishiq",
      "https://linkedin.com/company/drishiq",
      "https://facebook.com/drishiq"
    ]
  },

  // Product data
  product: (name: string, description: string, price?: string) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "brand": {
      "@type": "Brand",
      "name": "DrishiQ"
    },
    "offers": price ? {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock"
    } : undefined
  }),

  // Service data
  service: (name: string, description: string) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": "DrishiQ"
    },
    "areaServed": "Worldwide",
    "serviceType": "AI Platform"
  }),

  // FAQ data
  faq: (questions: Array<{ question: string; answer: string }>) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  }),

  // Breadcrumb data
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  })
};

// SEO optimization utilities
export const seoUtils = {
  // Generate meta description from content
  generateDescription: (content: string, maxLength: number = 160): string => {
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (cleanContent.length <= maxLength) return cleanContent;
    return cleanContent.substring(0, maxLength - 3) + '...';
  },

  // Generate keywords from content
  generateKeywords: (content: string, maxKeywords: number = 10): string[] => {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  },

  // Validate meta description length
  validateDescription: (description: string): boolean => {
    return description.length >= 120 && description.length <= 160;
  },

  // Check for duplicate titles
  checkDuplicateTitles: (titles: string[]): string[] => {
    const duplicates: string[] = [];
    const seen = new Set<string>();
    
    titles.forEach(title => {
      if (seen.has(title)) {
        duplicates.push(title);
      } else {
        seen.add(title);
      }
    });
    
    return duplicates;
  }
};













