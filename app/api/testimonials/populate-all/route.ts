// app/api/testimonials/populate-all/route.ts
// This API will populate all existing testimonials with translations

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SUPPORTED_LANGUAGES = [
  'hi', 'ar', 'bn', 'de', 'es', 'fr', 'ja', 'pt', 'ru', 'ta', 'zh'
];

// Sample translations for the 3 testimonials
const SAMPLE_TRANSLATIONS = {
  'hi': {
    'Raina': 'रैना',
    'Sanjay': 'संजय', 
    'Bheen': 'भीन',
    'Marketing Manager': 'मार्केटिंग मैनेजर',
    'Entrepreneur': 'उद्यमी',
    'Life Coach': 'लाइफ कोच',
    'DrishiQ helped me find clarity in my career path. I was stuck in a role that paid well but left me unfulfilled. Through their coaching sessions, I discovered my passion for strategic thinking and team leadership. Within 6 months, I transitioned to a Senior Marketing Manager role with a 40% salary increase and now lead a team of 8 people. The confidence I gained has been life-changing.': 'DrishiQ ने मुझे मेरे करियर पथ में स्पष्टता खोजने में मदद की। मैं एक ऐसी भूमिका में फंसा हुआ था जो अच्छी तनख्वाह देती थी लेकिन मुझे असंतुष्ट छोड़ती थी। उनके कोचिंग सत्रों के माध्यम से, मैंने रणनीतिक सोच और टीम नेतृत्व के लिए अपने जुनून की खोज की। 6 महीनों के भीतर, मैं 40% वेतन वृद्धि के साथ एक सीनियर मार्केटिंग मैनेजर की भूमिका में स्थानांतरित हो गया और अब 8 लोगों की टीम का नेतृत्व करता हूं। जो आत्मविश्वास मुझे मिला वह जीवन बदलने वाला रहा है।',
    'As a startup founder, I was overwhelmed with operational details and struggling to scale my business. DrishiQ\'s business coaching helped me implement proper systems and delegate effectively. In 8 months, we increased revenue by 300%, expanded from 5 to 25 employees, and secured $2M Series A funding. Most importantly, I reduced my working hours from 80 to 50 per week while improving performance.': 'एक स्टार्टअप संस्थापक के रूप में, मैं परिचालन विवरणों से अभिभूत था और अपने व्यवसाय को बढ़ाने के लिए संघर्ष कर रहा था। DrishiQ के व्यावसायिक कोचिंग ने मुझे उचित सिस्टम लागू करने और प्रभावी ढंग से प्रतिनिधि बनाने में मदद की। 8 महीनों में, हमने राजस्व में 300% की वृद्धि की, 5 से 25 कर्मचारियों तक विस्तार किया, और $2M सीरीज़ A फंडिंग सुरक्षित की। सबसे महत्वपूर्ण बात, मैंने अपने काम के घंटे 80 से 50 प्रति सप्ताह तक कम कर दिए जबकि प्रदर्शन में सुधार किया।',
    'Being a working mother, I was constantly juggling responsibilities and feeling like I was failing at everything. DrishiQ helped me find balance and pursue my passion for wellness coaching. I now work 30 hours instead of 50, earn 20% more, and have time for my children. The boundaries I learned to set have transformed both my career and family life.': 'एक कामकाजी मां होने के नाते, मैं लगातार जिम्मेदारियों को संभाल रही थी और महसूस कर रही थी कि मैं हर चीज में असफल हो रही हूं। DrishiQ ने मुझे संतुलन खोजने और वेलनेस कोचिंग के लिए अपने जुनून को आगे बढ़ाने में मदद की। मैं अब 50 के बजाय 30 घंटे काम करती हूं, 20% अधिक कमाती हूं, और मेरे बच्चों के लिए समय है। जो सीमाएं मैंने सीखीं उन्होंने मेरे करियर और पारिवारिक जीवन दोनों को बदल दिया है।'
  },
  'ar': {
    'Raina': 'رينا',
    'Sanjay': 'سانجاي',
    'Bheen': 'بين',
    'Marketing Manager': 'مدير التسويق',
    'Entrepreneur': 'رائد أعمال',
    'Life Coach': 'مدرب حياة',
    'DrishiQ helped me find clarity in my career path. I was stuck in a role that paid well but left me unfulfilled. Through their coaching sessions, I discovered my passion for strategic thinking and team leadership. Within 6 months, I transitioned to a Senior Marketing Manager role with a 40% salary increase and now lead a team of 8 people. The confidence I gained has been life-changing.': 'ساعدني DrishiQ في العثور على الوضوح في مساري المهني. كنت عالقاً في دور يدفع جيداً لكنه تركني غير راضٍ. من خلال جلسات التدريب الخاصة بهم، اكتشفت شغفي بالتفكير الاستراتيجي وقيادة الفريق. في غضون 6 أشهر، انتقلت إلى دور مدير تسويق أول مع زيادة في الراتب بنسبة 40% وأقود الآن فريقاً من 8 أشخاص. الثقة التي اكتسبتها كانت تغييراً للحياة.',
    'As a startup founder, I was overwhelmed with operational details and struggling to scale my business. DrishiQ\'s business coaching helped me implement proper systems and delegate effectively. In 8 months, we increased revenue by 300%, expanded from 5 to 25 employees, and secured $2M Series A funding. Most importantly, I reduced my working hours from 80 to 50 per week while improving performance.': 'كمؤسس شركة ناشئة، كنت غارقاً في التفاصيل التشغيلية وأكافح لتوسيع أعمالي. ساعدني التدريب التجاري لـ DrishiQ في تنفيذ أنظمة مناسبة والتفويض بفعالية. في 8 أشهر، زدنا الإيرادات بنسبة 300%، وتوسعنا من 5 إلى 25 موظفاً، وحصلنا على تمويل Series A بقيمة 2 مليون دولار. الأهم من ذلك، قللت ساعات عملي من 80 إلى 50 في الأسبوع مع تحسين الأداء.',
    'Being a working mother, I was constantly juggling responsibilities and feeling like I was failing at everything. DrishiQ helped me find balance and pursue my passion for wellness coaching. I now work 30 hours instead of 50, earn 20% more, and have time for my children. The boundaries I learned to set have transformed both my career and family life.': 'كأم عاملة، كنت أتنقل باستمرار بين المسؤوليات وأشعر وكأنني أفشل في كل شيء. ساعدني DrishiQ في العثور على التوازن ومتابعة شغفي بتدريب الرفاهية. أعمل الآن 30 ساعة بدلاً من 50، وأكسب 20% أكثر، ولدي وقت لأطفالي. الحدود التي تعلمت وضعها حولت حياتي المهنية والعائلية.'
  }
  // Add more languages as needed
};

export async function POST(request: Request) {
  try {
    // Get all existing testimonials
    const { data: testimonials, error: fetchError } = await supabase
      .from('testimonials')
      .select('*');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
    }

    if (!testimonials || testimonials.length === 0) {
      return NextResponse.json({ error: 'No testimonials found' }, { status: 404 });
    }

    // Update each testimonial with translations
    const updatePromises = testimonials.map(async (testimonial) => {
      const updateData: any = {};
      
      SUPPORTED_LANGUAGES.forEach(language => {
        const translations = SAMPLE_TRANSLATIONS[language as keyof typeof SAMPLE_TRANSLATIONS];
        if (translations) {
          updateData[`user_name_${language}`] = translations[testimonial.user_name as keyof typeof translations] || testimonial.user_name;
          updateData[`user_role_${language}`] = translations[testimonial.user_role as keyof typeof translations] || testimonial.user_role;
          updateData[`content_${language}`] = translations[testimonial.content as keyof typeof translations] || testimonial.content;
        }
      });

      return supabase
        .from('testimonials')
        .update(updateData)
        .eq('id', testimonial.id);
    });

    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      console.error('Some updates failed:', errors);
      return NextResponse.json({ 
        error: 'Some translations failed to update',
        details: errors
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${testimonials.length} testimonials with ${SUPPORTED_LANGUAGES.length} language translations`,
      testimonials_updated: testimonials.length
    });

  } catch (error) {
    console.error('Translation population error:', error);
    return NextResponse.json({ error: 'Translation population failed' }, { status: 500 });
  }
}

