// app/api/testimonials/auto-translate/route.ts
// This API is called automatically when a testimonial is published

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SUPPORTED_LANGUAGES = [
  'hi', 'ar', 'bn', 'de', 'es', 'fr', 'ja', 'pt', 'ru', 'ta', 'zh'
];

// Translation service (replace with real translation API)
const TRANSLATION_SERVICE = {
  async translate(text: string, targetLanguage: string): Promise<string> {
    // For now, return the original text
    // Replace with Google Translate, DeepL, or other translation service
    return text;
  }
};

export async function POST(request: Request) {
  try {
    const { testimonial_id } = await request.json();
    
    if (!testimonial_id) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 });
    }

    // Get the published testimonial
    const { data: testimonial, error: fetchError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', testimonial_id)
      .eq('is_published', true) // Only translate published testimonials
      .single();

    if (fetchError || !testimonial) {
      return NextResponse.json({ error: 'Published testimonial not found' }, { status: 404 });
    }

    // Prepare update data with translations
    const updateData: any = {};
    
    // Process each language
    for (const language of SUPPORTED_LANGUAGES) {
      try {
        // Translate all 6 fields
        const translatedName = await TRANSLATION_SERVICE.translate(
          testimonial.user_name || '', 
          language
        );
        const translatedRole = await TRANSLATION_SERVICE.translate(
          testimonial.user_role || '', 
          language
        );
        const translatedLocation = await TRANSLATION_SERVICE.translate(
          testimonial.user_location || '', 
          language
        );
        const translatedContent = await TRANSLATION_SERVICE.translate(
          testimonial.content || '', 
          language
        );
        const translatedTitle = await TRANSLATION_SERVICE.translate(
          testimonial.title || '', 
          language
        );
        const translatedCategory = await TRANSLATION_SERVICE.translate(
          testimonial.category || '', 
          language
        );
        
        // Store translations
        updateData[`user_name_${language}`] = translatedName;
        updateData[`user_role_${language}`] = translatedRole;
        updateData[`user_location_${language}`] = translatedLocation;
        updateData[`content_${language}`] = translatedContent;
        updateData[`title_${language}`] = translatedTitle;
        updateData[`category_${language}`] = translatedCategory;
        
      } catch (translationError) {
        console.error(`Translation failed for ${language}:`, translationError);
        // Fallback to original text if translation fails
        updateData[`user_name_${language}`] = testimonial.user_name;
        updateData[`user_role_${language}`] = testimonial.user_role;
        updateData[`user_location_${language}`] = testimonial.user_location;
        updateData[`content_${language}`] = testimonial.content;
        updateData[`title_${language}`] = testimonial.title;
        updateData[`category_${language}`] = testimonial.category;
      }
    }

    // Update the testimonial with all translations
    const { data: updatedTestimonial, error: updateError } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', testimonial_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating testimonial with translations:', updateError);
      return NextResponse.json({ error: 'Failed to update testimonial with translations' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Auto-translated testimonial ${testimonial_id} into ${SUPPORTED_LANGUAGES.length} languages`,
      testimonial_id: testimonial_id
    });

  } catch (error) {
    console.error('Auto-translation error:', error);
    return NextResponse.json({ error: 'Auto-translation failed' }, { status: 500 });
  }
}
