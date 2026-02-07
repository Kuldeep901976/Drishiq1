// app/[lang]/page.tsx - URL-based language routing
'use client';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useLanguage } from '@/lib/drishiq-i18n';
import Footer from '../../components/Footer';

// Force dynamic rendering - this route uses dynamic params
// Note: Client components can export route segment config
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Multilingual SEO content
const languageContent: Record<string, {
  h1: string;
  subheadline: string;
  intro: string;
}> = {
  hi: {
    h1: "आपकी भाषा में स्पष्टता, आपकी जिंदगी में दिशा।",
    subheadline: "जब चीज़ें साफ़ नहीं होतीं, Drishiq आपकी भाषा में स्पष्ट दिशा और अगले कदम देता है — आवाज़ या टेक्स्ट के माध्यम से।",
    intro: "Drishiq एक मल्टीलिंगual क्लैरिटी असिस्टेंट है जो आपको सोचने, निर्णय लेने और आत्मविश्वास से आगे बढ़ने में मदद करता है।"
  },
  es: {
    h1: "Claridad en tu idioma, dirección para tu vida.",
    subheadline: "Cuando todo se siente confuso, Drishiq te da claridad y próximos pasos en tu propio idioma — por voz o texto.",
    intro: "Drishiq es un asistente de claridad multilingüe que te ayuda a pensar mejor, decidir mejor y avanzar con confianza."
  },
  ar: {
    h1: "وضوح بلغتك، واتجاه لحياتك.",
    subheadline: "عندما تصبح الأمور غير واضحة، يمنحك Drishiq خطوات واضحة بلغتك — صوتيًا أو نصيًا.",
    intro: "Drishiq هو مساعد وضوح متعدد اللغات يساعدك على التفكير واتخاذ القرارات بثقة."
  },
  zh: {
    h1: "用你的语言获得清晰，用你的方式获得方向。",
    subheadline: "当生活变得不清晰时，Drishiq 用你的语言为你提供方向和下一步行动。",
    intro: "Drishiq 是一款多语言清晰助手，帮助你思考更清楚，自信做决定。"
  },
  pt: {
    h1: "Clareza no seu idioma, direção para a sua vida.",
    subheadline: "Quando tudo parece confuso, o Drishiq oferece passos claros no seu próprio idioma — por voz ou texto.",
    intro: "Drishiq é um assistente de clareza multilíngue que ajuda você a pensar melhor, decidir melhor e avançar com confiança."
  },
  fr: {
    h1: "Clarté dans votre langue, direction pour votre vie.",
    subheadline: "Lorsque tout devient flou, Drishiq vous donne une direction claire dans votre langue — par voix ou texte.",
    intro: "Drishiq est un assistant de clarté multilingue qui vous aide à mieux réfléchir, mieux décider et avancer avec confiance."
  },
  de: {
    h1: "Klarheit in deiner Sprache, Richtung für dein Leben.",
    subheadline: "Wenn alles unklar wirkt, gibt dir Drishiq klare nächsten Schritte — in deiner Sprache.",
    intro: "Drishiq ist ein mehrsprachiger Klarheits-Assistent, der dir hilft, besser zu denken, besser zu entscheiden und mit Vertrauen voranzukommen."
  },
  ru: {
    h1: "Ясность на вашем языке, направление для вашей жизни.",
    subheadline: "Когда всё кажется туманным, Drishiq даёт понятные шаги на вашем языке — голосом или текстом.",
    intro: "Drishiq — это многоязычный помощник для ясности, который помогает вам лучше думать, лучше принимать решения и двигаться вперёд с уверенностью."
  },
  bn: {
    h1: "আপনার ভাষায় স্বচ্ছতা, আপনার জীবনে দিকনির্দেশ।",
    subheadline: "যখন সবকিছু অস্পষ্ট লাগে, Drishiq আপনার ভাষায় পরিষ্কার পরবর্তী পদক্ষেপ দেয়।",
    intro: "Drishiq একটি বহুভাষিক স্বচ্ছতা সহায়ক যা আপনাকে আরও ভালভাবে চিন্তা করতে, আরও ভাল সিদ্ধান্ত নিতে এবং আত্মবিশ্বাসের সাথে এগিয়ে যেতে সহায়তা করে।"
  },
  ta: {
    h1: "உங்கள் மொழியில் தெளிவு, உங்கள் வாழ்க்கைக்கு திசை.",
    subheadline: "வாழ்க்கை குழப்பமாக இருக்கும் போது, Drishiq உங்கள் மொழியில் தெளிவான அடுத்த படிகளை வழங்குகிறது.",
    intro: "Drishiq என்பது பல மொழி தெளிவு உதவியாளர், இது நீங்கள் சிறப்பாக சிந்திக்க, சிறப்பாக முடிவெடுக்க மற்றும் நம்பிக்கையுடன் முன்னேற உதவுகிறது।"
  },
  ja: {
    h1: "あなたの言葉で clarity、あなたの人生に direction。",
    subheadline: "物事が不明確なとき、Drishiq はあなたの言語で次のステップを示します。",
    intro: "Drishiq は、より良く考え、より良く決断し、自信を持って前進するのを助ける多言語の明確性アシスタントです。"
  }
};

export default function LocalizedHomePage() {
  const params = useParams();
  const lang = params.lang as string || 'en';
  
  // Initialize with URL language
  const { t, language, setLanguage, isLoading, translationsLoaded } = useLanguage([
    'home_static', 'home_dynamic', 'areas', 'footer', 'common'
  ]);

  // Set language from URL on mount
  useEffect(() => {
    if (lang && lang !== language) {
      setLanguage(lang);
    }
  }, [lang, language, setLanguage]);

  // Get localized SEO content
  const seoContent = languageContent[lang] || languageContent.hi; // Fallback to Hindi

  if (isLoading || !translationsLoaded) {
    return (
      <div className="loading-container py-24 text-center">
        <div className="loading-spinner mx-auto mb-4" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <main className="flex-grow">
        {/* SEO Hero Section with H1 */}
        <section className="hero-section py-12 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              {seoContent.h1}
            </h1>
            <p className="text-lg mb-4">
              {seoContent.subheadline}
            </p>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="section py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-base leading-relaxed">
              {seoContent.intro}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

