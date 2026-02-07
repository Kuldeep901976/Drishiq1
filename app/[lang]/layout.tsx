import { Metadata } from 'next';

// Multilingual SEO metadata for language pages
const languageMetadata: Record<string, {
  title: string;
  description: string;
  h1: string;
  subheadline: string;
  intro: string;
}> = {
  hi: {
    title: "Drishiq — आपकी भाषा में स्पष्टता, आपकी जिंदगी में दिशा।",
    description: "जब चीज़ें साफ़ नहीं होतीं, Drishiq आपकी भाषा में स्पष्ट दिशा और अगले कदम देता है — आवाज़ या टेक्स्ट के माध्यम से।",
    h1: "आपकी भाषा में स्पष्टता, आपकी जिंदगी में दिशा।",
    subheadline: "जब चीज़ें साफ़ नहीं होतीं, Drishiq आपकी भाषा में स्पष्ट दिशा और अगले कदम देता है — आवाज़ या टेक्स्ट के माध्यम से।",
    intro: "Drishiq एक मल्टीलिंगual क्लैरिटी असिस्टेंट है जो आपको सोचने, निर्णय लेने और आत्मविश्वास से आगे बढ़ने में मदद करता है।"
  },
  es: {
    title: "Drishiq — Claridad en tu idioma, dirección para tu vida.",
    description: "Cuando todo se siente confuso, Drishiq te da claridad y próximos pasos en tu propio idioma — por voz o texto.",
    h1: "Claridad en tu idioma, dirección para tu vida.",
    subheadline: "Cuando todo se siente confuso, Drishiq te da claridad y próximos pasos en tu propio idioma — por voz o texto.",
    intro: "Drishiq es un asistente de claridad multilingüe que te ayuda a pensar mejor, decidir mejor y avanzar con confianza."
  },
  ar: {
    title: "Drishiq — وضوح بلغتك، واتجاه لحياتك.",
    description: "عندما تصبح الأمور غير واضحة، يمنحك Drishiq خطوات واضحة بلغتك — صوتيًا أو نصيًا.",
    h1: "وضوح بلغتك، واتجاه لحياتك.",
    subheadline: "عندما تصبح الأمور غير واضحة، يمنحك Drishiq خطوات واضحة بلغتك — صوتيًا أو نصيًا.",
    intro: "Drishiq هو مساعد وضوح متعدد اللغات يساعدك على التفكير واتخاذ القرارات بثقة."
  },
  zh: {
    title: "Drishiq — 用你的语言获得清晰，用你的方式获得方向。",
    description: "当生活变得不清晰时，Drishiq 用你的语言为你提供方向和下一步行动。",
    h1: "用你的语言获得清晰，用你的方式获得方向。",
    subheadline: "当生活变得不清晰时，Drishiq 用你的语言为你提供方向和下一步行动。",
    intro: "Drishiq 是一款多语言清晰助手，帮助你思考更清楚，自信做决定。"
  },
  pt: {
    title: "Drishiq — Clareza no seu idioma, direção para a sua vida.",
    description: "Quando tudo parece confuso, o Drishiq oferece passos claros no seu próprio idioma — por voz ou texto.",
    h1: "Clareza no seu idioma, direção para a sua vida.",
    subheadline: "Quando tudo parece confuso, o Drishiq oferece passos claros no seu próprio idioma — por voz ou texto.",
    intro: "Drishiq é um assistente de clareza multilíngue que ajuda você a pensar melhor, decidir melhor e avançar com confiança."
  },
  fr: {
    title: "Drishiq — Clarté dans votre langue, direction pour votre vie.",
    description: "Lorsque tout devient flou, Drishiq vous donne une direction claire dans votre langue — par voix ou texte.",
    h1: "Clarté dans votre langue, direction pour votre vie.",
    subheadline: "Lorsque tout devient flou, Drishiq vous donne une direction claire dans votre langue — par voix ou texte.",
    intro: "Drishiq est un assistant de clarté multilingue qui vous aide à mieux réfléchir, mieux décider et avancer avec confiance."
  },
  de: {
    title: "Drishiq — Klarheit in deiner Sprache, Richtung für dein Leben.",
    description: "Wenn alles unklar wirkt, gibt dir Drishiq klare nächsten Schritte — in deiner Sprache.",
    h1: "Klarheit in deiner Sprache, Richtung für dein Leben.",
    subheadline: "Wenn alles unklar wirkt, gibt dir Drishiq klare nächsten Schritte — in deiner Sprache.",
    intro: "Drishiq ist ein mehrsprachiger Klarheits-Assistent, der dir hilft, besser zu denken, besser zu entscheiden und mit Vertrauen voranzukommen."
  },
  ru: {
    title: "Drishiq — Ясность на вашем языке, направление для вашей жизни.",
    description: "Когда всё кажется туманным, Drishiq даёт понятные шаги на вашем языке — голосом или текстом.",
    h1: "Ясность на вашем языке, направление для вашей жизни.",
    subheadline: "Когда всё кажется туманным, Drishiq даёт понятные шаги на вашем языке — голосом или текстом.",
    intro: "Drishiq — это многоязычный помощник для ясности, который помогает вам лучше думать, лучше принимать решения и двигаться вперёд с уверенностью."
  },
  bn: {
    title: "Drishiq — আপনার ভাষায় স্বচ্ছতা, আপনার জীবনে দিকনির্দেশ।",
    description: "যখন সবকিছু অস্পষ্ট লাগে, Drishiq আপনার ভাষায় পরিষ্কার পরবর্তী পদক্ষেপ দেয়।",
    h1: "আপনার ভাষায় স্বচ্ছতা, আপনার জীবনে দিকনির্দেশ।",
    subheadline: "যখন সবকিছু অস্পষ্ট লাগে, Drishiq আপনার ভাষায় পরিষ্কার পরবর্তী পদক্ষেপ দেয়।",
    intro: "Drishiq একটি বহুভাষিক স্বচ্ছতা সহায়ক যা আপনাকে আরও ভালভাবে চিন্তা করতে, আরও ভাল সিদ্ধান্ত নিতে এবং আত্মবিশ্বাসের সাথে এগিয়ে যেতে সহায়তা করে।"
  },
  ta: {
    title: "Drishiq — உங்கள் மொழியில் தெளிவு, உங்கள் வாழ்க்கைக்கு திசை.",
    description: "வாழ்க்கை குழப்பமாக இருக்கும் போது, Drishiq உங்கள் மொழியில் தெளிவான அடுத்த படிகளை வழங்குகிறது.",
    h1: "உங்கள் மொழியில் தெளிவு, உங்கள் வாழ்க்கைக்கு திசை.",
    subheadline: "வாழ்க்கை குழப்பமாக இருக்கும் போது, Drishiq உங்கள் மொழியில் தெளிவான அடுத்த படிகளை வழங்குகிறது.",
    intro: "Drishiq என்பது பல மொழி தெளிவு உதவியாளர், இது நீங்கள் சிறப்பாக சிந்திக்க, சிறப்பாக முடிவெடுக்க மற்றும் நம்பிக்கையுடன் முன்னேற உதவுகிறது।"
  },
  ja: {
    title: "Drishiq — あなたの言葉で clarity、あなたの人生に direction。",
    description: "物事が不明確なとき、Drishiq はあなたの言語で次のステップを示します。",
    h1: "あなたの言葉で clarity、あなたの人生に direction。",
    subheadline: "物事が不明確なとき、Drishiq はあなたの言語で次のステップを示します。",
    intro: "Drishiq は、より良く考え、より良く決断し、自信を持って前進するのを助ける多言語の明確性アシスタントです。"
  }
};

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> }
): Promise<Metadata> {
  const { lang } = await params;
  const meta = languageMetadata[lang] || languageMetadata.hi; // Fallback to Hindi if language not found
  
  const baseUrl = 'https://www.drishiq.com';
  const canonicalUrl = `${baseUrl}/${lang}`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonicalUrl,
      siteName: 'Drishiq',
      type: 'website',
      images: [
        {
          url: 'https://www.drishiq.com/assets/logo/og-image.png',
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: ['https://www.drishiq.com/assets/logo/og-image.png'],
      creator: '@drishiq',
      site: '@drishiq',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function LangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


