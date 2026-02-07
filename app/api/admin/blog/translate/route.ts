import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supported languages (matching Header component)
const SUPPORTED_LANGUAGES = ['hi', 'bn', 'ar', 'ta', 'zh', 'ja', 'ru', 'es', 'de', 'fr', 'pt'];

// Fields that can be translated (based on current schema analysis)
const TRANSLATABLE_FIELDS = [
  'title',
  'content', 
  'excerpt',
  'category',
  'author',
  'seo_title',
  'seo_description',
  'seo_keywords'
];

// Language labels for display
const LANGUAGE_LABELS = {
  'hi': '🇮🇳 हिंदी',
  'bn': '🇧🇩 বাংলা',
  'ar': '🇸🇦 العربية',
  'ta': '🇮🇳 தமிழ்',
  'zh': '🇨🇳 中文',
  'ja': '🇯🇵 日本語',
  'ru': '🇷🇺 Русский',
  'es': '🇪🇸 Español',
  'de': '🇩🇪 Deutsch',
  'fr': '🇫🇷 Français',
  'pt': '🇵🇹 Português'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const language = searchParams.get('language');
    
    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Valid language is required' },
        { status: 400 }
      );
    }

    // Fetch the blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Extract current translations for the language
    const translations: Record<string, string> = {};
    TRANSLATABLE_FIELDS.forEach(field => {
      const translatedField = `${field}_${language}`;
      translations[field] = post[translatedField] || '';
    });

    return NextResponse.json({
      success: true,
      data: {
        postId: post.id,
        title: post.title,
        language,
        translations,
        originalFields: {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          category: post.category,
          author: post.author,
          seo_title: post.seo_title,
          seo_description: post.seo_description,
          seo_keywords: post.seo_keywords
        }
      }
    });

  } catch (error) {
    console.error('Error fetching translation data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, language, translations } = body;

    if (!postId || !language || !translations) {
      return NextResponse.json(
        { success: false, error: 'Post ID, language, and translations are required' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    // Validate that all fields are in the translatable fields list
    const invalidFields = Object.keys(translations).filter(
      field => !TRANSLATABLE_FIELDS.includes(field)
    );
    
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid fields: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare update object with language-specific columns
    const updateData: Record<string, any> = {};
    Object.entries(translations).forEach(([field, value]) => {
      updateData[`${field}_${language}`] = value;
    });

    // Add metadata
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = 'admin'; // TODO: Get from auth context

    // Update the blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select();

    if (error) {
      console.error('Error updating translations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update translations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Translations for ${language} updated successfully`,
      data: {
        postId,
        language,
        updatedFields: Object.keys(translations)
      }
    });

  } catch (error) {
    console.error('Error updating translations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const language = searchParams.get('language');
    const fields = searchParams.get('fields')?.split(',') || [];

    if (!postId || !language) {
      return NextResponse.json(
        { success: false, error: 'Post ID and language are required' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    // Prepare update object to clear translations
    const updateData: Record<string, any> = {};
    const fieldsToClear = fields.length > 0 ? fields : TRANSLATABLE_FIELDS;
    
    fieldsToClear.forEach(field => {
      if (TRANSLATABLE_FIELDS.includes(field)) {
        updateData[`${field}_${language}`] = null;
      }
    });

    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = 'admin';

    // Update the blog post
    const { error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId);

    if (error) {
      console.error('Error clearing translations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to clear translations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Translations for ${language} cleared successfully`,
      data: {
        postId,
        language,
        clearedFields: fieldsToClear
      }
    });

  } catch (error) {
    console.error('Error clearing translations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
