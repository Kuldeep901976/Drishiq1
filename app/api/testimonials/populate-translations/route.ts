// app/api/testimonials/populate-translations/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SUPPORTED_LANGUAGES = [
  'hi', 'ar', 'bn', 'de', 'es', 'fr', 'ja', 'pt', 'ru', 'ta', 'zh'
];

// Simple translation mappings
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

    // Prepare update object with all language translations
    const updateData: any = {};
    
    SUPPORTED_LANGUAGES.forEach(language => {
      const translatedContent = translateText(originalTestimonial.content, language);
      const translatedRole = translateRole(originalTestimonial.user_role, language);
      
      updateData[`user_name_${language}`] = originalTestimonial.user_name; // Keep original name
      updateData[`user_role_${language}`] = translatedRole;
      updateData[`content_${language}`] = translatedContent;
    });

    // Update the testimonial with all language translations
    const { data: updatedTestimonial, error: updateError } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', testimonial_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating testimonial:', updateError);
      return NextResponse.json({ error: 'Failed to update testimonial with translations' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Populated ${SUPPORTED_LANGUAGES.length} language translations`,
      testimonial_id: testimonial_id
    });

  } catch (error) {
    console.error('Translation population error:', error);
    return NextResponse.json({ error: 'Translation population failed' }, { status: 500 });
  }
}

// Simple translation function
function translateText(text: string, targetLanguage: string): string {
  const translations = TRANSLATIONS[targetLanguage as keyof typeof TRANSLATIONS];
  if (!translations) {
    return text; // Return original if no translation available
  }

  let translatedText = text;
  Object.entries(translations).forEach(([english, translated]) => {
    translatedText = translatedText.replace(new RegExp(english, 'gi'), translated);
  });

  return translatedText;
}

function translateRole(role: string, targetLanguage: string): string {
  const translations = TRANSLATIONS[targetLanguage as keyof typeof TRANSLATIONS];
  return translations?.[role as keyof typeof translations] || role;
}

