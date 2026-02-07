import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Supported languages (matching Header component)
const SUPPORTED_LANGUAGES = ['hi', 'bn', 'ar', 'ta', 'zh', 'ja', 'ru', 'es', 'de', 'fr', 'pt'];

// Fields that can be translated for testimonials
const TRANSLATABLE_FIELDS = [
  'title',
  'content',
  'user_name',
  'user_role',
  'user_location',
  'category'
];

// Language labels for display
const LANGUAGE_LABELS = {
  hi: 'हिंदी',
  bn: 'বাংলা',
  ar: 'العربية',
  ta: 'தமிழ்',
  zh: '中文',
  ja: '日本語',
  ru: 'Русский',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  pt: 'Português'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testimonialId = searchParams.get('testimonialId');
    const language = searchParams.get('language');

    if (!testimonialId) {
      return NextResponse.json(
        { success: false, error: 'Testimonial ID is required' },
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

    // Fetch the testimonial
    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', testimonialId)
      .single();

    if (error || !testimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    const translations: Record<string, string> = {};

    if (language === 'all') {
      // For "all" languages, return the original English content
      TRANSLATABLE_FIELDS.forEach(field => {
        translations[field] = testimonial[field] || '';
      });
    } else {
      // For specific language, get translated content
      TRANSLATABLE_FIELDS.forEach(field => {
        const translatedField = `${field}_${language}`;
        translations[field] = testimonial[translatedField] || testimonial[field] || '';
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        testimonialId,
        language,
        languageLabel: language === 'all' 
          ? 'All Languages' 
          : LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS],
        translations,
        originalTestimonial: {
          title: testimonial.title,
          content: testimonial.content,
          user_name: testimonial.user_name,
          user_role: testimonial.user_role,
          user_location: testimonial.user_location,
          category: testimonial.category
        }
      }
    });

  } catch (error) {
    console.error('Error fetching testimonial translation data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testimonialId, language, translations } = body;

    if (!testimonialId || !language || !translations) {
      return NextResponse.json(
        { success: false, error: 'Testimonial ID, language, and translations are required' },
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

    // Prepare update object with language-specific columns
    const updateData: Record<string, any> = {};
    
    if (language === 'all') {
      // For "all" languages, save to all supported languages
      SUPPORTED_LANGUAGES.forEach(lang => {
        Object.entries(translations).forEach(([field, value]) => {
          updateData[`${field}_${lang}`] = value;
        });
      });
    } else {
      // For specific language, save to that language only
      Object.entries(translations).forEach(([field, value]) => {
        updateData[`${field}_${language}`] = value;
      });
    }

    console.log('Updating testimonial with data:', {
      testimonialId,
      language,
      updateDataKeys: Object.keys(updateData),
      sampleData: Object.keys(updateData).slice(0, 5).reduce((acc, key) => {
        acc[key] = updateData[key];
        return acc;
      }, {} as any)
    });

    // First, check if the testimonial exists
    const { data: existingTestimonial, error: fetchError } = await supabase
      .from('testimonials')
      .select('id, title')
      .eq('id', testimonialId)
      .single();

    console.log('Existing testimonial check:', { existingTestimonial, fetchError });

    if (fetchError || !existingTestimonial) {
      console.error('Testimonial not found:', testimonialId);
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Update the testimonial
    const { data, error } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', testimonialId)
      .select();

    console.log('Database update result:', { data, error });

    if (error) {
      console.error('Error updating testimonial:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: language === 'all' 
        ? `Translations for all ${SUPPORTED_LANGUAGES.length} languages updated successfully`
        : `Translations for ${language} updated successfully`,
      data: {
        testimonialId,
        language,
        languageLabel: language === 'all' 
          ? 'All Languages' 
          : LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS],
        updatedFields: Object.keys(translations),
        languagesUpdated: language === 'all' ? SUPPORTED_LANGUAGES : [language]
      }
    });

  } catch (error) {
    console.error('Error updating testimonial translations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testimonialId = searchParams.get('testimonialId');
    const language = searchParams.get('language');
    const fields = searchParams.get('fields')?.split(',') || [];

    if (!testimonialId || !language) {
      return NextResponse.json(
        { success: false, error: 'Testimonial ID and language are required' },
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

    // Prepare update object to clear translations
    const updateData: Record<string, any> = {};
    const fieldsToClear = fields.length > 0 ? fields : TRANSLATABLE_FIELDS;
    
    if (language === 'all') {
      // For "all" languages, clear translations for all supported languages
      SUPPORTED_LANGUAGES.forEach(lang => {
        fieldsToClear.forEach(field => {
          if (TRANSLATABLE_FIELDS.includes(field)) {
            updateData[`${field}_${lang}`] = null;
          }
        });
      });
    } else {
      // For specific language, clear translations for that language only
      fieldsToClear.forEach(field => {
        if (TRANSLATABLE_FIELDS.includes(field)) {
          updateData[`${field}_${language}`] = null;
        }
      });
    }

    console.log('Clearing testimonial translations with data:', {
      testimonialId,
      language,
      updateDataKeys: Object.keys(updateData),
      sampleData: Object.keys(updateData).slice(0, 5).reduce((acc, key) => {
        acc[key] = updateData[key];
        return acc;
      }, {} as any)
    });

    // Update the testimonial
    const { data, error } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', testimonialId)
      .select();

    console.log('Database clear result:', { data, error });

    if (error) {
      console.error('Error clearing testimonial translations:', error);
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
        testimonialId,
        language,
        languageLabel: language === 'all' 
          ? 'All Languages' 
          : LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS],
        clearedFields: fieldsToClear,
        languagesCleared: language === 'all' ? SUPPORTED_LANGUAGES : [language]
      }
    });

  } catch (error) {
    console.error('Error clearing testimonial translations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

