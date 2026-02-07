// app/api/testimonials/translate/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { testimonial_id, target_language } = await request.json();
    
    // Get original testimonial
    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', testimonial_id)
      .single();

    if (error || !testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    // Simple auto-translation (you can integrate with Google Translate API, DeepL, etc.)
    const translatedContent = await translateText(testimonial.content, target_language);
    
    // Store translated version
    const { error: insertError } = await supabase
      .from('testimonials_translations')
      .upsert({
        testimonial_id,
        language: target_language,
        content: translatedContent,
        user_name: testimonial.user_name,
        user_role: testimonial.user_role
      });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save translation' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      translated_content: translatedContent 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

// Simple translation function (replace with real translation service)
async function translateText(text: string, targetLanguage: string): Promise<string> {
  // For now, return the same text (you can integrate with Google Translate, DeepL, etc.)
  // Example: return await googleTranslate(text, targetLanguage);
  return text;
}

