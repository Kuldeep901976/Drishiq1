export async function getPostBySlug(slug: string, locale?: string) {
  // Example stub. Replace with your real CMS or API call.
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || '';
    const q = `${base}/api/blog/posts/${encodeURIComponent(slug)}${locale ? `?locale=${locale}` : ''}`;
    const res = await fetch(q, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    // Expect shape: { data: { title, excerpt, featured_image, author_name, published_at, updated_at, canonical } }
    return json?.data || null;
  } catch (e) {
    return null;
  }
}






