import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Supported languages (matching Header component)
const SUPPORTED_LANGUAGES = ['hi', 'bn', 'ar', 'ta', 'zh', 'ja', 'ru', 'es', 'de', 'fr', 'pt'];

// Fields that can be translated (chunked version)
const TRANSLATABLE_FIELDS = [
  'title',
  'content', // Will be split into content, content_2, content_3
  'excerpt',
  'category',
  'author',
  'seo_title',
  'seo_description', // Will be split into seo_description, seo_description_2
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

// Helper function to split content into chunks
function splitContent(content: string, maxChunkSize: number = 4000): string[] {
  if (!content || content.length <= maxChunkSize) {
    return [content || ''];
  }
  
  const chunks: string[] = [];
  let remaining = content;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxChunkSize) {
      chunks.push(remaining);
      break;
    }
    
    // Find the last space within the chunk size to avoid breaking words
    let chunkEnd = maxChunkSize;
    const lastSpace = remaining.lastIndexOf(' ', maxChunkSize);
    if (lastSpace > maxChunkSize * 0.8) { // Only use space break if it's not too far back
      chunkEnd = lastSpace;
    }
    
    chunks.push(remaining.substring(0, chunkEnd));
    remaining = remaining.substring(chunkEnd).trim();
  }
  
  return chunks;
}

// Helper function to combine chunks
function combineChunks(chunks: string[]): string {
  return chunks.filter(chunk => chunk && chunk.trim()).join('');
}

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

    if (!language || (language !== 'all' && !SUPPORTED_LANGUAGES.includes(language))) {
      return NextResponse.json(
        { success: false, error: 'Valid language is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

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

    // Extract current translations for the language (combining chunks)
    const translations: Record<string, string> = {};
    
    if (language === 'all') {
      // For "all" languages, return the original English content
      TRANSLATABLE_FIELDS.forEach(field => {
        translations[field] = post[field] || '';
      });
    } else {
      // For specific language, get translated content
      TRANSLATABLE_FIELDS.forEach(field => {
        if (field === 'content') {
          // Combine content chunks
          const chunks = [
            post[`${field}_${language}`] || '',
            post[`${field}_${language}_2`] || '',
            post[`${field}_${language}_3`] || ''
          ];
          translations[field] = combineChunks(chunks);
        } else if (field === 'seo_description') {
          // Combine seo_description chunks
          const chunks = [
            post[`${field}_${language}`] || '',
            post[`${field}_${language}_2`] || ''
          ];
          translations[field] = combineChunks(chunks);
        } else {
          // Regular single-column fields
          translations[field] = post[`${field}_${language}`] || '';
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        postId: post.id,
        title: post.title,
        language,
        languageLabel: LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS],
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

    if (language !== 'all' && !SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

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

    // Prepare update object with language-specific columns (chunked)
    const updateData: Record<string, any> = {};
    
    if (language === 'all') {
      // For "all" languages, save to all supported languages
      SUPPORTED_LANGUAGES.forEach(lang => {
        Object.entries(translations).forEach(([field, value]) => {
          if (field === 'content') {
            // Split content into chunks
            const chunks = splitContent(value as string, 4000);
            updateData[`${field}_${lang}`] = chunks[0] || '';
            updateData[`${field}_${lang}_2`] = chunks[1] || '';
            updateData[`${field}_${lang}_3`] = chunks[2] || '';
          } else if (field === 'seo_description') {
            // Split seo_description into chunks
            const chunks = splitContent(value as string, 2000);
            updateData[`${field}_${lang}`] = chunks[0] || '';
            updateData[`${field}_${lang}_2`] = chunks[1] || '';
          } else {
            // Regular single-column fields
            updateData[`${field}_${lang}`] = value;
          }
        });
      });
    } else {
      // For specific language, save to that language only
      Object.entries(translations).forEach(([field, value]) => {
        if (field === 'content') {
          // Split content into chunks
          const chunks = splitContent(value as string, 4000);
          updateData[`${field}_${language}`] = chunks[0] || '';
          updateData[`${field}_${language}_2`] = chunks[1] || '';
          updateData[`${field}_${language}_3`] = chunks[2] || '';
        } else if (field === 'seo_description') {
          // Split seo_description into chunks
          const chunks = splitContent(value as string, 2000);
          updateData[`${field}_${language}`] = chunks[0] || '';
          updateData[`${field}_${language}_2`] = chunks[1] || '';
        } else {
          // Regular single-column fields
          updateData[`${field}_${language}`] = value;
        }
      });
    }

    // Add metadata (only if these fields exist in the schema)
    // updateData.updated_at = new Date().toISOString();
    // updateData.updated_by = 'admin'; // TODO: Get from auth context

    console.log('Updating blog post with data:', {
      postId,
      language,
      updateDataKeys: Object.keys(updateData),
      sampleData: Object.keys(updateData).slice(0, 5).reduce((acc, key) => {
        acc[key] = updateData[key];
        return acc;
      }, {} as any)
    });

    // First, check if the post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title')
      .eq('id', postId)
      .single();

    console.log('Existing post check:', { existingPost, fetchError });

    if (fetchError || !existingPost) {
      console.error('Post not found:', postId);
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Update the blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select();

    console.log('Database update result:', { data, error });

    if (error) {
      console.error('Error updating translations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update translations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: language === 'all' 
        ? `Translations for all ${SUPPORTED_LANGUAGES.length} languages updated successfully`
        : `Translations for ${language} updated successfully`,
      data: {
        postId,
        language,
        languageLabel: language === 'all' 
          ? 'All Languages' 
          : LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS],
        updatedFields: Object.keys(translations),
        languagesUpdated: language === 'all' ? SUPPORTED_LANGUAGES : [language]
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

    if (language !== 'all' && !SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Prepare update object to clear translations (including chunks)
    const updateData: Record<string, any> = {};
    const fieldsToClear = fields.length > 0 ? fields : TRANSLATABLE_FIELDS;
    
    if (language === 'all') {
      // For "all" languages, clear translations for all supported languages
      SUPPORTED_LANGUAGES.forEach(lang => {
        fieldsToClear.forEach(field => {
          if (TRANSLATABLE_FIELDS.includes(field)) {
            if (field === 'content') {
              // Clear all content chunks
              updateData[`${field}_${lang}`] = null;
              updateData[`${field}_${lang}_2`] = null;
              updateData[`${field}_${lang}_3`] = null;
            } else if (field === 'seo_description') {
              // Clear all seo_description chunks
              updateData[`${field}_${lang}`] = null;
              updateData[`${field}_${lang}_2`] = null;
            } else {
              // Regular single-column fields
              updateData[`${field}_${lang}`] = null;
            }
          }
        });
      });
    } else {
      // For specific language, clear translations for that language only
      fieldsToClear.forEach(field => {
        if (TRANSLATABLE_FIELDS.includes(field)) {
          if (field === 'content') {
            // Clear all content chunks
            updateData[`${field}_${language}`] = null;
            updateData[`${field}_${language}_2`] = null;
            updateData[`${field}_${language}_3`] = null;
          } else if (field === 'seo_description') {
            // Clear all seo_description chunks
            updateData[`${field}_${language}`] = null;
            updateData[`${field}_${language}_2`] = null;
          } else {
            // Regular single-column fields
            updateData[`${field}_${language}`] = null;
          }
        }
      });
    }

    // updateData.updated_at = new Date().toISOString();
    // updateData.updated_by = 'admin';

    console.log('Clearing translations with data:', {
      postId,
      language,
      updateDataKeys: Object.keys(updateData),
      sampleData: Object.keys(updateData).slice(0, 5).reduce((acc, key) => {
        acc[key] = updateData[key];
        return acc;
      }, {} as any)
    });

    // Update the blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select();

    console.log('Database clear result:', { data, error });

    if (error) {
      console.error('Error clearing translations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to clear translations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: language === 'all' 
        ? `Translations for all ${SUPPORTED_LANGUAGES.length} languages cleared successfully`
        : `Translations for ${language} cleared successfully`,
      data: {
        postId,
        language,
        languageLabel: language === 'all' 
          ? 'All Languages' 
          : LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS],
        clearedFields: fieldsToClear,
        languagesCleared: language === 'all' ? SUPPORTED_LANGUAGES : [language]
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
