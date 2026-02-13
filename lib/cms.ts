// lib/cms.ts - Real CMS integration for blog posts
export interface BlogPost {
  title: string;
  excerpt: string;
  content?: string;
  featured_image?: string;
  author_name?: string;
  published_at: string;
  updated_at?: string;
  canonical?: string;
  slug: string;
  locale?: string;
  tags?: string[];
  category?: string;
}

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
  // Vercel: use deployment URL so server-side fetch hits this app's API
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Local dev: same-origin so fetch hits this app (e.g. Next dev on 3000)
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

export async function getPostBySlug(slug: string, locale?: string): Promise<BlogPost | null> {
  try {
    const base = getApiBase();
    const apiUrl = `${base}/api/blog/posts/${encodeURIComponent(slug)}${locale ? `?language=${locale}` : ''}`;
    // Use a generous timeout; same-origin fetch in dev can be slow
    const timeoutMs = 20000;
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      console.warn(`CMS API error for slug "${slug}": ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json().catch(() => ({}));

    // Handle different API response formats
    const postData = json?.data || json?.post || json;

    if (!postData || !postData.title) {
      console.warn(`No post data found for slug "${slug}"`);
      return null;
    }

    // Normalize the post data to our interface
    const post: BlogPost = {
      title: postData.title || '',
      excerpt: postData.excerpt || postData.description || '',
      content: postData.content || '',
      featured_image: postData.featured_image || postData.image || postData.thumbnail,
      author_name: postData.author_name || postData.author?.name || postData.author,
      published_at: postData.published_at || postData.publishedAt || postData.created_at || new Date().toISOString(),
      updated_at: postData.updated_at || postData.updatedAt || postData.modified_at,
      canonical: postData.canonical,
      slug: postData.slug || slug,
      locale: postData.locale || locale,
      tags: postData.tags || [],
      category: postData.category || 'Blog'
    };

    return post;
  } catch (error: unknown) {
    // Timeout, abort, and network errors: return null so layout/metadata still render
    const name = error && typeof error === 'object' && 'name' in error ? (error as { name?: string }).name : '';
    const isAbortOrTimeout = name === 'TimeoutError' || name === 'AbortError';
    if (isAbortOrTimeout) {
      console.warn(`CMS fetch timeout/abort for slug "${slug}" – using fallback metadata`);
    } else {
      console.error(`Error fetching post "${slug}":`, error);
    }
    return null;
  }
}

export async function getAllPostSlugs(): Promise<string[]> {
  try {
    // During build time, skip API calls if server is not available
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping blog slug fetch during build phase');
      return [];
    }
    
    const base = getApiBase();
    const apiUrl = `${base}/api/blog/posts/slugs`;
    
    const res = await fetch(apiUrl, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout for build-time fetches
      signal: AbortSignal.timeout(5000)
    });
    
    if (!res.ok) {
      console.warn(`CMS API error for slugs: ${res.status} ${res.statusText}`);
      return [];
    }
    
    const json = await res.json().catch(() => ({}));
    const slugs = json?.data || json?.slugs || json || [];
    
    return Array.isArray(slugs) ? slugs : [];
  } catch (error) {
    // Silently fail during build - pages will be generated on-demand
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Build-time fetch skipped - pages will be generated on-demand');
      return [];
    }
    console.error('Error fetching post slugs:', error);
    return [];
  }
}

export async function getAllBlogSlugs(): Promise<Array<{ slug: string; published_at?: string; updated_at?: string; canonical?: string }>> {
  try {
    const base = getApiBase();
    const apiUrl = `${base}/api/blog/posts?fields=slug,published_at,updated_at,canonical&limit=1000`;
    
    const res = await fetch(apiUrl, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.warn(`CMS API error for blog slugs: ${res.status} ${res.statusText}`);
      return [];
    }
    
    const json = await res.json().catch(() => ({}));
    const items = Array.isArray(json?.data) ? json.data : [];
    
    return items.map((p: any) => ({ 
      slug: p.slug, 
      published_at: p.published_at, 
      updated_at: p.updated_at, 
      canonical: p.canonical 
    }));
  } catch (error) {
    console.error('Error fetching blog slugs:', error);
    return [];
  }
}

export async function getPostsByCategory(category: string, limit: number = 10): Promise<BlogPost[]> {
  try {
    const base = getApiBase();
    const apiUrl = `${base}/api/blog/posts?category=${encodeURIComponent(category)}&limit=${limit}`;
    
    const res = await fetch(apiUrl, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.warn(`CMS API error for category "${category}": ${res.status} ${res.statusText}`);
      return [];
    }
    
    const json = await res.json().catch(() => ({}));
    const posts = json?.data || json?.posts || json || [];
    
    return Array.isArray(posts) ? posts.map((post: any) => ({
      title: post.title || '',
      excerpt: post.excerpt || post.description || '',
      content: post.content || '',
      featured_image: post.featured_image || post.image || post.thumbnail,
      author_name: post.author_name || post.author?.name || post.author,
      published_at: post.published_at || post.publishedAt || post.created_at || new Date().toISOString(),
      updated_at: post.updated_at || post.updatedAt || post.modified_at,
      canonical: post.canonical,
      slug: post.slug || '',
      locale: post.locale,
      tags: post.tags || [],
      category: post.category || 'Blog'
    })) : [];
  } catch (error) {
    console.error(`Error fetching posts for category "${category}":`, error);
    return [];
  }
}
