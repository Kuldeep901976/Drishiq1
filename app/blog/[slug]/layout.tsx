import { ReactNode } from 'react';
import { buildMetadataForLocale } from '@/lib/seo.config';
import { getCanonicalFor, getAlternatesFor } from '@/lib/getAlternateUrl';
import { getPostBySlug, getAllPostSlugs } from '@/lib/cms';

// Enable ISR (Incremental Static Regeneration) for better SEO
// Revalidate blog posts every hour (3600 seconds)
export const revalidate = 3600;

// Generate static params for popular blog posts at build time
export async function generateStaticParams() {
  try {
    // During build, skip fetching if API is not available
    // This allows the build to complete and pages will be generated on-demand
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping blog slug fetch during build - pages will be generated on-demand');
      return [];
    }
    
    const slugs = await getAllPostSlugs();
    // Limit to first 100 posts for build time, rest will be generated on-demand
    return slugs.slice(0, 100).map((slug) => ({
      slug: slug,
    }));
  } catch (error) {
    console.warn('Error generating static params for blog posts:', error);
    // Return empty array to allow on-demand generation
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // ✅ Use await instead of use()
  
  // Try to detect locale from the URL or use English as default
  // This could be enhanced with Next.js i18n routing if implemented
  const locale = 'en'; // TODO: Implement proper locale detection from URL or headers
  
  // Use CMS to fetch post data with locale
  const post = await getPostBySlug(slug, locale);

  if (!post) {
    return {
      title: 'Post Not Found — Drishiq',
      description: 'The requested blog post could not be found.',
      robots: { index: false, follow: false }
    };
  }

  // Use the post's locale if available, otherwise fall back to detected locale
  const postLocale = post.locale || locale;
  
  // Build base metadata by calling buildMetadataForLocale
  const base = buildMetadataForLocale('blog', postLocale);

  // Use helper functions for canonical and alternates
  const canonical = (post.canonical && post.canonical.replace(/\/+$/, '')) || `${getCanonicalFor('blog', postLocale).replace(/\/+$/, '')}/${encodeURIComponent(slug)}`;
  const alternates = getAlternatesFor('blog');
  
  // Add this specific post to alternates (create new object to avoid mutation)
  const postAlternates = { ...alternates };
  Object.keys(postAlternates).forEach(loc => {
    postAlternates[loc] = postAlternates[loc].replace(/\/+$/, '') + `/${encodeURIComponent(slug)}`;
  });

  // Use CMS data for title and description
  const title = post.title ? `${post.title} — Drishiq` : 'Blog Post — Drishiq';
  const description = post.excerpt || post.content?.substring(0, 160) + '...' || 'Read this article on Drishiq';

  // Prepare featured image with fallback
  const featuredImage = post.featured_image || base.openGraph?.images?.[0]?.url;
  
  // Prepare author information
  const authorName = post.author_name || 'Drishiq';
  
  // Prepare keywords from post tags and category
  const keywords = [
    'Drishiq', 
    'blog', 
    'clarity', 
    'growth', 
    'personal development',
    ...(post.tags || []),
    ...(post.category ? [post.category] : [])
  ].filter(Boolean);

  // Article JSON-LD structured data
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
    "headline": post.title,
    "description": description,
    "image": featuredImage ? [featuredImage] : [],
    "author": [{ "@type": "Person", "name": authorName }],
    "publisher": { 
      "@type": "Organization", 
      "name": "Drishiq", 
      "logo": { 
        "@type": "ImageObject", 
        "url": "https://www.drishiq.com/assets/logo/Logo.png" 
      } 
    },
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "articleSection": post.category || 'Blog',
    "keywords": keywords.join(', ')
  };

  // Return metadata merging base and post-specific values
  return {
    ...base,
    title,
    description,
    alternates: {
      canonical,
      languages: postAlternates
    },
    openGraph: {
      ...base.openGraph,
      type: 'article',
      title: post.title,
      description,
      url: canonical,
      images: featuredImage ? [{ 
        url: featuredImage,
        width: 1200,
        height: 630,
        alt: post.title
      }] : base.openGraph?.images || [],
      authors: authorName ? [{ name: authorName }] : undefined,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      section: post.category || 'Blog',
      tags: post.tags || []
    },
    twitter: {
      ...base.twitter,
      title,
      description,
      images: featuredImage ? [featuredImage] : (base.twitter?.images || base.openGraph?.images || []),
      creator: '@drishiq',
      site: '@drishiq'
    },
    // Additional SEO metadata from CMS
    keywords: keywords,
    category: post.category || 'Blog',
    authors: authorName ? [{ name: authorName }] : undefined,
    other: {
      'article:author': authorName,
      'article:section': post.category || 'Blog',
      'article:tag': post.tags ? post.tags.join(', ') : 'clarity, growth, personal development',
      'article:published_time': post.published_at,
      'article:modified_time': post.updated_at || post.published_at,
      'ld+json': JSON.stringify(articleLd)
    }
  };
}

// ✅ Make the layout async and use await
export default async function BlogLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params; // ✅ Use await instead of use()
  
  // Fetch post data to generate structured data for HTML body
  const locale = 'en';
  const post = await getPostBySlug(slug, locale);
  
  // Generate structured data for HTML body (in addition to metadata)
  let articleLd = null;
  if (post) {
    const canonical = (post.canonical && post.canonical.replace(/\/+$/, '')) || `${getCanonicalFor('blog', locale).replace(/\/+$/, '')}/${encodeURIComponent(slug)}`;
    const description = post.excerpt || post.content?.substring(0, 160) + '...' || 'Read this article on Drishiq';
    const featuredImage = post.featured_image;
    const authorName = post.author_name || 'Drishiq';
    const keywords = [
      'Drishiq', 
      'blog', 
      'clarity', 
      'growth', 
      'personal development',
      ...(post.tags || []),
      ...(post.category ? [post.category] : [])
    ].filter(Boolean);
    
    articleLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
      "headline": post.title,
      "description": description,
      "image": featuredImage ? [featuredImage] : [],
      "author": [{ "@type": "Person", "name": authorName }],
      "publisher": { 
        "@type": "Organization", 
        "name": "Drishiq", 
        "logo": { 
          "@type": "ImageObject", 
          "url": "https://www.drishiq.com/assets/logo/Logo.png" 
        } 
      },
      "datePublished": post.published_at,
      "dateModified": post.updated_at || post.published_at,
      "articleSection": post.category || 'Blog',
      "keywords": keywords.join(', ')
    };
  }
  
  return (
    <>
      {/* Structured Data JSON-LD in HTML body for SEO */}
      {articleLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleLd, null, 2)
          }}
        />
      )}
      {children}
    </>
  );
}