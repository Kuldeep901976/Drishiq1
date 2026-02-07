// app/api/testimonials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

type Testimonial = Record<string, any>;

export async function GET(request: NextRequest) {
  try {
    const urlObj = new URL(request.url);
    let language = urlObj.searchParams.get('language') || 'en';
    
    // Normalize language code (handle short form)
    const langCode = language.split('-')[0].toLowerCase();
    // Supported languages
    const SUPPORTED_LANGUAGES = ['en', 'hi', 'bn', 'ar', 'ta', 'zh', 'ja', 'ru', 'es', 'de', 'fr', 'pt'];
    const finalLang = SUPPORTED_LANGUAGES.includes(langCode) ? langCode : 'en';

    // Use service client to bypass RLS (graceful if env missing)
    let supabase;
    try {
      supabase = createServiceClient();
    } catch (clientErr: any) {
      console.error('Testimonials API: Supabase service client failed:', clientErr?.message);
      return NextResponse.json(
        { success: false, testimonials: [], error: 'Service unavailable' },
        { status: 503 }
      );
    }
    
    // Check if featured filter is requested (for homepage)
    const featured = urlObj.searchParams.get('featured');
    
    // Build query - try with users join first, fallback to testimonials-only if join fails
    let queryWithJoin = supabase
      .from('testimonials')
      .select(`
        *,
        users:user_id (
          id,
          first_name,
          last_name,
          email,
          profile_image,
          avatar_selection
        )
      `);
    
    if (featured === 'true') {
      queryWithJoin = queryWithJoin.eq('is_featured', true);
    } else {
      queryWithJoin = queryWithJoin.eq('is_published', true);
    }
    queryWithJoin = queryWithJoin.order('created_at', { ascending: false });

    let { data: testimonials, error } = await queryWithJoin;

    // If join fails (e.g. users table missing or FK not set), fallback to testimonials-only
    if (error) {
      console.warn('Testimonials API: query with users join failed, falling back to testimonials-only:', error.message);
      let fallbackQuery = supabase
        .from('testimonials')
        .select('*');
      if (featured === 'true') {
        fallbackQuery = fallbackQuery.eq('is_featured', true);
      } else {
        fallbackQuery = fallbackQuery.eq('is_published', true);
      }
      fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
      const fallback = await fallbackQuery;
      if (fallback.error) {
        console.error('Error fetching testimonials from Supabase:', {
          message: fallback.error.message,
          code: fallback.error.code,
          details: fallback.error.details,
          hint: fallback.error.hint
        });
        return NextResponse.json(
          { success: false, testimonials: [], error: `Database error: ${fallback.error.message}`, errorCode: fallback.error.code },
          { status: 500 }
        );
      }
      testimonials = fallback.data;
      error = null;
    }

    let all: Testimonial[] = testimonials || [];

    // Transform testimonials to use language-specific fields with fallback to English
    all = all.map(testimonial => {
      // Helper function to get translated field with fallback
      const getTranslatedField = (fieldName: string): string => {
        if (finalLang === 'en') {
          // For English, use the base field
          return testimonial[fieldName] || '';
        }
        // For other languages, try language-specific field first, then fallback to English
        const translatedField = `${fieldName}_${finalLang}`;
        return testimonial[translatedField] || testimonial[fieldName] || '';
      };

      // Get user info from joined users table or from testimonial fields
      const userInfo = testimonial.users || null;
      const userName = testimonial.user_name || 
        (userInfo ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() : '') ||
        'Anonymous User';
      const userImage = testimonial.user_image || 
        testimonial.selected_avatar ||
        (userInfo ? (userInfo.profile_image || userInfo.avatar_selection) : null);

      return {
        ...testimonial,
        // Use translated fields with fallback to English
        title: getTranslatedField('title') || 'Testimonial',
        content: getTranslatedField('content') || '',
        user_name: userName,
        user_role: getTranslatedField('user_role') || 'User',
        user_location: getTranslatedField('user_location') || '',
        user_image: userImage,
        selected_avatar: userImage,
        category: getTranslatedField('category') || testimonial.status || 'general',
        // Add default values for fields that don't exist in database yet
        is_featured: testimonial.is_featured || false,
        is_anonymous: testimonial.is_anonymous || false,
        likes_count: testimonial.likes_count || 0,
        comments_count: testimonial.comments_count || 0
      };
    });

    // Query params
    const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(urlObj.searchParams.get('limit') || '12', 10));
    const sortBy = urlObj.searchParams.get('sortBy') || 'created_at';
    const sortOrder = (urlObj.searchParams.get('sortOrder') || 'desc').toLowerCase();
    const category = urlObj.searchParams.get('category') || '';
    const rating = urlObj.searchParams.get('rating') || '';
    const search = urlObj.searchParams.get('search') || '';

    let items = all.slice();

    // Filtering with better validation
    if (category && category.trim()) {
      items = items.filter((i) => 
        ((i?.category || i?.status || '') + '').toLowerCase() === category.toLowerCase()
      );
    }
    if (rating && !isNaN(Number(rating))) {
      const min = Number(rating);
      items = items.filter((i) => Number(i?.rating || 0) >= min);
    }
    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      items = items.filter((i) => {
        const searchableText = [
          i?.content || '',
          i?.admin_notes || '',
          i?.user_name || '',
          i?.title || ''
        ].join(' ').toLowerCase();
        return searchableText.includes(s);
      });
    }

    // Sorting
    items.sort((a: any, b: any) => {
      const A = a?.[sortBy] ?? a?.created_at ?? '';
      const B = b?.[sortBy] ?? b?.created_at ?? '';

      if (['rating', 'likes', 'comments'].includes(sortBy)) {
        const numA = Number(A || 0);
        const numB = Number(B || 0);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      const dateA = new Date(A).getTime() || 0;
      const dateB = new Date(B).getTime() || 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Pagination
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.min(Math.max(1, page), totalPages);
    const start = (pageSafe - 1) * limit;
    const paged = items.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      testimonials: paged,
      pagination: {
        page: pageSafe,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error('API /api/testimonials GET handler error:', err);
    return NextResponse.json(
      { success: false, testimonials: [], error: err?.message || 'internal error' },
      { status: 500 }
    );
  }
}
