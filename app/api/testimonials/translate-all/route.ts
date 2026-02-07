// app/api/testimonials/translate-all/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'ar', 'bn', 'de', 'es', 'fr', 'ja', 'pt', 'ru', 'ta', 'zh'
];

// Simple translation mappings (you can replace with real translation service)
const TRANSLATIONS = {
  'hi': {
    'Marketing Manager': 'मार्केटिंग मैनेजर',
    'Entrepreneur': 'उद्यमी',
    'Life Coach': 'लाइफ कोच',
    'helped me find clarity': 'मुझे स्पष्टता खोजने में मदद की',
    'career path': 'करियर पथ',
    'coaching sessions': 'कोचिंग सत्र',
    'transformed my business': 'मेरे व्यवसाय को बदल दिया',
    'startup founder': 'स्टार्टअप संस्थापक',
    'work-life balance': 'कार्य-जीवन संतुलन'
  },
  'ar': {
    'Marketing Manager': 'مدير التسويق',
    'Entrepreneur': 'رائد أعمال',
    'Life Coach': 'مدرب حياة',
    'helped me find clarity': 'ساعدني في العثور على الوضوح',
    'career path': 'المسار المهني',
    'coaching sessions': 'جلسات التدريب',
    'transformed my business': 'حولت عملي',
    'startup founder': 'مؤسس شركة ناشئة',
    'work-life balance': 'التوازن بين العمل والحياة'
  },
  'bn': {
    'Marketing Manager': 'মার্কেটিং ম্যানেজার',
    'Entrepreneur': 'উদ্যোক্তা',
    'Life Coach': 'লাইফ কোচ',
    'helped me find clarity': 'আমাকে স্পষ্টতা খুঁজে পেতে সাহায্য করেছে',
    'career path': 'ক্যারিয়ার পথ',
    'coaching sessions': 'কোচিং সেশন',
    'transformed my business': 'আমার ব্যবসাকে রূপান্তরিত করেছে',
    'startup founder': 'স্টার্টআপ প্রতিষ্ঠাতা',
    'work-life balance': 'কাজ-জীবনের ভারসাম্য'
  }
  // Add more languages as needed
};

export async function POST(request: Request) {
  try {
    const { testimonial_id } = await request.json();
    
    if (!testimonial_id) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 });
    }

    // Get original testimonial
    const { data: originalTestimonial, error: fetchError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', testimonial_id)
      .single();

    if (fetchError || !originalTestimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    // Create translation rows for all languages
    const translationPromises = SUPPORTED_LANGUAGES.map(async (language) => {
      const translatedContent = await translateTestimonial(originalTestimonial.content, language);
      const translatedRole = translateRole(originalTestimonial.user_role, language);
      
      return {
        original_id: testimonial_id,
        language: language,
        user_name: originalTestimonial.user_name, // Keep original name
        user_role: translatedRole,
        content: translatedContent,
        featured: originalTestimonial.featured,
        rating: originalTestimonial.rating,
        created_at: new Date().toISOString()
      };
    });

    const translationRows = await Promise.all(translationPromises);

    // Insert all translations
    const { data: insertedRows, error: insertError } = await supabase
      .from('testimonials_translations')
      .insert(translationRows);

    if (insertError) {
      console.error('Error inserting translations:', insertError);
      return NextResponse.json({ error: 'Failed to create translations' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${SUPPORTED_LANGUAGES.length} translation rows`,
      translations_created: (insertedRows as any)?.length || translationRows.length
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

// Simple translation function (replace with real translation service)
async function translateTestimonial(content: string, targetLanguage: string): Promise<string> {
  if (targetLanguage === 'en') {
    return content; // Return original for English
  }

  // Simple word replacement (replace with Google Translate, DeepL, etc.)
  const translations = TRANSLATIONS[targetLanguage as keyof typeof TRANSLATIONS];
  if (!translations) {
    return content; // Return original if no translation available
  }

  let translatedContent = content;
  Object.entries(translations).forEach(([english, translated]) => {
    translatedContent = translatedContent.replace(new RegExp(english, 'gi'), translated);
  });

  return translatedContent;
}

function translateRole(role: string, targetLanguage: string): string {
  if (targetLanguage === 'en') {
    return role;
  }

  const translations = TRANSLATIONS[targetLanguage as keyof typeof TRANSLATIONS];
  return translations?.[role as keyof typeof translations] || role;
}

