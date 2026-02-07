// lib/seo.config.ts
export type MetaProps = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  twitterImage?: string;
  noindex?: boolean;
  locales?: Record<string, Partial<MetaProps>>;
};

const BASE = "https://www.drishiq.com";
const DEFAULT_OG = `${BASE}/og/default.jpg`;

const defaults: MetaProps = {
  title: "Drishiq — Clarity, Connection, Action",
  description:
    "Drishiq helps you find clarity and practical steps to live better — coaching, community, and tools for everyday growth.",
  canonical: BASE,
  ogImage: DEFAULT_OG,
  twitterImage: DEFAULT_OG,
};

const pages: Record<string, MetaProps> = {
  home: {
    title: "Drishiq — Clarity for the life you're building",
    description:
      "Tools, coaching and community to help you find clarity and take aligned action — Drishiq clarity experiences.",
    canonical: `${BASE}/`,
    ogImage: `${BASE}/og/home.jpg`,
    locales: {
      hi: {
        title: "Drishiq — जीवन के लिए स्पष्टता जो आप बना रहे हैं",
        description: "स्पष्टता खोजने और संरेखित कार्रवाई करने में मदद करने के लिए उपकरण, कोचिंग और समुदाय — Drishiq स्पष्टता अनुभव।",
        canonical: `${BASE}/hi/`,
        ogImage: `${BASE}/og/home-hi.jpg`,
      },
      es: {
        title: "Drishiq — Claridad para la vida que estás construyendo",
        description: "Herramientas, coaching y comunidad para ayudarte a encontrar claridad y tomar acción alineada — experiencias de claridad Drishiq.",
        canonical: `${BASE}/es/`,
        ogImage: `${BASE}/og/home-es.jpg`,
      },
      ta: {
        title: "Drishiq — நீங்கள் கட்டும் வாழ்க்கைக்கான தெளிவு",
        description: "தெளிவைக் கண்டறியவும் சீரமைக்கப்பட்ட நடவடிக்கை எடுக்கவும் உதவும் கருவிகள், பயிற்சி மற்றும் சமூகம் — Drishiq தெளிவு அனுபவங்கள்.",
        canonical: `${BASE}/ta/`,
        ogImage: `${BASE}/og/home-ta.jpg`,
      },
      bn: {
        title: "Drishiq — যে জীবন আপনি গড়ছেন তার জন্য স্পষ্টতা",
        description: "স্পষ্টতা খুঁজে পেতে এবং সংযুক্ত পদক্ষেপ নিতে সাহায্য করার জন্য সরঞ্জাম, কোচিং এবং সম্প্রদায় — Drishiq স্পষ্টতা অভিজ্ঞতা।",
        canonical: `${BASE}/bn/`,
        ogImage: `${BASE}/og/home-bn.jpg`,
      },
      ru: {
        title: "Drishiq — Ясность для жизни, которую вы строите",
        description: "Инструменты, коучинг и сообщество, чтобы помочь вам найти ясность и предпринять согласованные действия — опыт ясности Drishiq.",
        canonical: `${BASE}/ru/`,
        ogImage: `${BASE}/og/home-ru.jpg`,
      },
      pt: {
        title: "Drishiq — Clareza para a vida que você está construindo",
        description: "Ferramentas, coaching e comunidade para ajudá-lo a encontrar clareza e tomar ação alinhada — experiências de clareza Drishiq.",
        canonical: `${BASE}/pt/`,
        ogImage: `${BASE}/og/home-pt.jpg`,
      },
      fr: {
        title: "Drishiq — Clarté pour la vie que vous construisez",
        description: "Outils, coaching et communauté pour vous aider à trouver la clarté et agir avec alignement.",
        canonical: `${BASE}/fr/`,
        ogImage: `${BASE}/og/home-fr.jpg`,
      },
      de: {
        title: "Drishiq — Klarheit für das Leben, das Sie aufbauen",
        description: "Tools, Coaching und Community, um Klarheit zu finden und gezielt zu handeln.",
        canonical: `${BASE}/de/`,
        ogImage: `${BASE}/og/home-de.jpg`,
      },
      it: {
        title: "Drishiq — Chiarezza per la vita che stai costruendo",
        description: "Strumenti, coaching e comunità per aiutarti a trovare chiarezza e agire con allineamento.",
        canonical: `${BASE}/it/`,
        ogImage: `${BASE}/og/home-it.jpg`,
      },
      nl: {
        title: "Drishiq — Helderheid voor het leven dat je opbouwt",
        description: "Tools, coaching en community om je te helpen helderheid te vinden en afgestemd te handelen.",
        canonical: `${BASE}/nl/`,
        ogImage: `${BASE}/og/home-nl.jpg`,
      },
      zh: {
        title: "Drishiq — 为你正在构建的生活带来清晰",
        description: "工具、指导和社区帮助你找到清晰并采取一致的行动 — Drishiq清晰体验。",
        canonical: `${BASE}/zh/`,
        ogImage: `${BASE}/og/home-zh.jpg`,
      },
      ja: {
        title: "Drishiq — あなたが築いている人生への明確さ",
        description: "明確さを見つけ、整った行動を取るためのツール、コーチング、コミュニティ — Drishiq明確さ体験。",
        canonical: `${BASE}/ja/`,
        ogImage: `${BASE}/og/home-ja.jpg`,
      },
      ar: {
        title: "Drishiq — وضوح للحياة التي تبنيها",
        description: "أدوات وتوجيه ومجتمع لمساعدتك في العثور على الوضوح واتخاذ إجراءات متسقة — تجارب وضوح Drishiq.",
        canonical: `${BASE}/ar/`,
        ogImage: `${BASE}/og/home-ar.jpg`,
      },
    },
  },
  testimonials: {
    title: "Testimonials — Drishiq",
    description:
      "Real stories from Drishiq users — discover how clarity and support changed lives.",
    canonical: `${BASE}/testimonials`,
    ogImage: `${BASE}/og/testimonials.jpg`,
    locales: {
      hi: {
        title: "प्रशंसापत्र — Drishiq",
        description: "Drishiq उपयोगकर्ताओं की वास्तविक कहानियां — जानें कि कैसे स्पष्टता और सहायता ने जीवन बदल दिया।",
        canonical: `${BASE}/hi/testimonials`,
        ogImage: `${BASE}/og/testimonials-hi.jpg`,
      },
      es: {
        title: "Testimonios — Drishiq",
        description: "Historias reales de usuarios de Drishiq — descubre cómo la claridad y el apoyo cambiaron vidas.",
        canonical: `${BASE}/es/testimonials`,
        ogImage: `${BASE}/og/testimonials-es.jpg`,
      },
      fr: {
        title: "Témoignages — Drishiq",
        description: "Histoires réelles d'utilisateurs de Drishiq — découvrez comment la clarté et le soutien ont changé des vies.",
        canonical: `${BASE}/fr/testimonials`,
        ogImage: `${BASE}/og/testimonials-fr.jpg`,
      },
      de: {
        title: "Erfahrungsberichte — Drishiq",
        description: "Echte Geschichten von Drishiq-Nutzern — entdecken Sie, wie Klarheit und Unterstützung Leben verändert haben.",
        canonical: `${BASE}/de/testimonials`,
        ogImage: `${BASE}/og/testimonials-de.jpg`,
      },
      zh: {
        title: "用户评价 — Drishiq",
        description: "Drishiq用户的真实故事 — 发现清晰和支持如何改变生活。",
        canonical: `${BASE}/zh/testimonials`,
        ogImage: `${BASE}/og/testimonials-zh.jpg`,
      },
      ja: {
        title: "お客様の声 — Drishiq",
        description: "Drishiqユーザーの実話 — 明確さとサポートが人生をどのように変えたかを発見。",
        canonical: `${BASE}/ja/testimonials`,
        ogImage: `${BASE}/og/testimonials-ja.jpg`,
      },
      ar: {
        title: "الشهادات — Drishiq",
        description: "قصص حقيقية من مستخدمي Drishiq — اكتشف كيف غيرت الوضوح والدعم الحياة.",
        canonical: `${BASE}/ar/testimonials`,
        ogImage: `${BASE}/og/testimonials-ar.jpg`,
      },
      ta: {
        title: "வாடிக்கையாளர் கருத்துகள் — Drishiq",
        description: "Drishiq பயனர்களின் உண்மையான கதைகள் — தெளிவு மற்றும் ஆதரவு வாழ்க்கையை எவ்வாறு மாற்றியது என்பதைக் கண்டறியுங்கள்.",
        canonical: `${BASE}/ta/testimonials`,
        ogImage: `${BASE}/og/testimonials-ta.jpg`,
      },
      bn: {
        title: "প্রশংসাপত্র — Drishiq",
        description: "Drishiq ব্যবহারকারীদের বাস্তব গল্প — আবিষ্কার করুন কীভাবে স্পষ্টতা এবং সহায়তা জীবন পরিবর্তন করেছে।",
        canonical: `${BASE}/bn/testimonials`,
        ogImage: `${BASE}/og/testimonials-bn.jpg`,
      },
      ru: {
        title: "Отзывы — Drishiq",
        description: "Реальные истории пользователей Drishiq — узнайте, как ясность и поддержка изменили жизни.",
        canonical: `${BASE}/ru/testimonials`,
        ogImage: `${BASE}/og/testimonials-ru.jpg`,
      },
      pt: {
        title: "Depoimentos — Drishiq",
        description: "Histórias reais de usuários do Drishiq — descubra como clareza e apoio mudaram vidas.",
        canonical: `${BASE}/pt/testimonials`,
        ogImage: `${BASE}/og/testimonials-pt.jpg`,
      },
    },
  },
  pricing: {
    title: "Pricing — Drishiq",
    description: "Clear pricing for Drishiq plans and what you get in each plan.",
    canonical: `${BASE}/pricing`,
    ogImage: `${BASE}/og/pricing.jpg`,
    locales: {
      hi: {
        title: "मूल्य निर्धारण — Drishiq",
        description: "Drishiq योजनाओं के लिए स्पष्ट मूल्य निर्धारण और प्रत्येक योजना में आपको क्या मिलता है।",
        canonical: `${BASE}/hi/pricing`,
        ogImage: `${BASE}/og/pricing-hi.jpg`,
      },
      es: {
        title: "Precios — Drishiq",
        description: "Precios claros para los planes de Drishiq y lo que obtienes en cada plan.",
        canonical: `${BASE}/es/pricing`,
        ogImage: `${BASE}/og/pricing-es.jpg`,
      },
      fr: {
        title: "Tarifs — Drishiq",
        description: "Tarifs clairs pour les plans Drishiq et ce que vous obtenez dans chaque plan.",
        canonical: `${BASE}/fr/pricing`,
        ogImage: `${BASE}/og/pricing-fr.jpg`,
      },
      de: {
        title: "Preise — Drishiq",
        description: "Klare Preise für Drishiq-Pläne und was Sie in jedem Plan erhalten.",
        canonical: `${BASE}/de/pricing`,
        ogImage: `${BASE}/og/pricing-de.jpg`,
      },
      zh: {
        title: "定价 — Drishiq",
        description: "Drishiq计划的清晰定价以及每个计划包含的内容。",
        canonical: `${BASE}/zh/pricing`,
        ogImage: `${BASE}/og/pricing-zh.jpg`,
      },
      ja: {
        title: "料金 — Drishiq",
        description: "Drishiqプランの明確な料金と各プランで得られるもの。",
        canonical: `${BASE}/ja/pricing`,
        ogImage: `${BASE}/og/pricing-ja.jpg`,
      },
      ar: {
        title: "الأسعار — Drishiq",
        description: "أسعار واضحة لخطط Drishiq وما تحصل عليه في كل خطة.",
        canonical: `${BASE}/ar/pricing`,
        ogImage: `${BASE}/og/pricing-ar.jpg`,
      },
      ta: {
        title: "விலை — Drishiq",
        description: "Drishiq திட்டங்களுக்கான தெளிவான விலை மற்றும் ஒவ்வொரு திட்டத்திலும் நீங்கள் பெறுவது.",
        canonical: `${BASE}/ta/pricing`,
        ogImage: `${BASE}/og/pricing-ta.jpg`,
      },
      bn: {
        title: "মূল্য — Drishiq",
        description: "Drishiq প্ল্যানের জন্য স্পষ্ট মূল্য এবং প্রতিটি প্ল্যানে আপনি যা পাবেন।",
        canonical: `${BASE}/bn/pricing`,
        ogImage: `${BASE}/og/pricing-bn.jpg`,
      },
      ru: {
        title: "Цены — Drishiq",
        description: "Четкие цены на планы Drishiq и что вы получаете в каждом плане.",
        canonical: `${BASE}/ru/pricing`,
        ogImage: `${BASE}/og/pricing-ru.jpg`,
      },
      pt: {
        title: "Preços — Drishiq",
        description: "Preços claros para os planos Drishiq e o que você obtém em cada plano.",
        canonical: `${BASE}/pt/pricing`,
        ogImage: `${BASE}/og/pricing-pt.jpg`,
      },
    },
  },
  blog: {
    title: "Drishiq Blog — Articles on clarity & growth",
    description: "Guides, stories and insights to support your clarity journey.",
    canonical: `${BASE}/blog`,
    ogImage: `${BASE}/og/blog.jpg`,
    locales: {
      hi: {
        title: "Drishiq ब्लॉग — स्पष्टता और विकास पर लेख",
        description: "आपकी स्पष्टता यात्रा का समर्थन करने के लिए गाइड, कहानियां और अंतर्दृष्टि।",
        canonical: `${BASE}/hi/blog`,
        ogImage: `${BASE}/og/blog-hi.jpg`,
      },
      es: {
        title: "Blog de Drishiq — Artículos sobre claridad y crecimiento",
        description: "Guías, historias e ideas para apoyar tu viaje hacia la claridad.",
        canonical: `${BASE}/es/blog`,
        ogImage: `${BASE}/og/blog-es.jpg`,
      },
      ta: {
        title: "Drishiq வலைப்பதிவு — தெளிவு மற்றும் வளர்ச்சி குறித்த கட்டுரைகள்",
        description: "உங்கள் தெளிவு பயணத்தை ஆதரிக்க வழிகாட்டிகள், கதைகள் மற்றும் நுண்ணறிவு.",
        canonical: `${BASE}/ta/blog`,
        ogImage: `${BASE}/og/blog-ta.jpg`,
      },
      bn: {
        title: "Drishiq ব্লগ — স্পষ্টতা এবং বৃদ্ধি সম্পর্কে নিবন্ধ",
        description: "আপনার স্পষ্টতা যাত্রাকে সমর্থন করার জন্য গাইড, গল্প এবং অন্তর্দৃষ্টি।",
        canonical: `${BASE}/bn/blog`,
        ogImage: `${BASE}/og/blog-bn.jpg`,
      },
      ru: {
        title: "Блог Drishiq — Статьи о ясности и росте",
        description: "Руководства, истории и идеи для поддержки вашего путешествия к ясности.",
        canonical: `${BASE}/ru/blog`,
        ogImage: `${BASE}/og/blog-ru.jpg`,
      },
      pt: {
        title: "Blog Drishiq — Artigos sobre clareza e crescimento",
        description: "Guias, histórias e ideias para apoiar sua jornada de clareza.",
        canonical: `${BASE}/pt/blog`,
        ogImage: `${BASE}/og/blog-pt.jpg`,
      },
      fr: {
        title: "Blog Drishiq — Articles sur la clarté et la croissance",
        description: "Guides, histoires et idées pour soutenir votre voyage vers la clarté.",
        canonical: `${BASE}/fr/blog`,
        ogImage: `${BASE}/og/blog-fr.jpg`,
      },
      de: {
        title: "Drishiq Blog — Artikel über Klarheit und Wachstum",
        description: "Leitfäden, Geschichten und Einblicke zur Unterstützung Ihrer Klarheitsreise.",
        canonical: `${BASE}/de/blog`,
        ogImage: `${BASE}/og/blog-de.jpg`,
      },
      it: {
        title: "Blog Drishiq — Articoli su chiarezza e crescita",
        description: "Guide, storie e idee per supportare il tuo viaggio verso la chiarezza.",
        canonical: `${BASE}/it/blog`,
        ogImage: `${BASE}/og/blog-it.jpg`,
      },
      nl: {
        title: "Drishiq Blog — Artikelen over helderheid en groei",
        description: "Gidsen, verhalen en inzichten om je helderheidsreis te ondersteunen.",
        canonical: `${BASE}/nl/blog`,
        ogImage: `${BASE}/og/blog-nl.jpg`,
      },
      zh: {
        title: "Drishiq博客 — 关于清晰和成长的文章",
        description: "指南、故事和见解支持您的清晰之旅。",
        canonical: `${BASE}/zh/blog`,
        ogImage: `${BASE}/og/blog-zh.jpg`,
      },
      ja: {
        title: "Drishiqブログ — 明確さと成長に関する記事",
        description: "あなたの明確さの旅をサポートするガイド、ストーリー、洞察。",
        canonical: `${BASE}/ja/blog`,
        ogImage: `${BASE}/og/blog-ja.jpg`,
      },
      ar: {
        title: "مدونة Drishiq — مقالات حول الوضوح والنمو",
        description: "أدلة وقصص ورؤى لدعم رحلتك نحو الوضوح.",
        canonical: `${BASE}/ar/blog`,
        ogImage: `${BASE}/og/blog-ar.jpg`,
      },
    },
  },
  "meet-yourself": {
    title: "Meet Yourself — Drishiq",
    description: "Reflection and guided clarity exercises to understand yourself better.",
    canonical: `${BASE}/meet-yourself`,
    ogImage: `${BASE}/og/meet-yourself.jpg`,
    locales: {
      hi: {
        title: "अपने आप से मिलें — Drishiq",
        description: "खुद को बेहतर समझने के लिए चिंतन और निर्देशित स्पष्टता अभ्यास।",
        canonical: `${BASE}/hi/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-hi.jpg`,
      },
      es: {
        title: "Conócete a ti mismo — Drishiq",
        description: "Ejercicios de reflexión y claridad guiada para conocerte mejor a ti mismo.",
        canonical: `${BASE}/es/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-es.jpg`,
      },
      ta: {
        title: "உங்களை நீங்களே சந்தியுங்கள் — Drishiq",
        description: "உங்களை நன்றாகப் புரிந்துகொள்ள சிந்தனை மற்றும் வழிகாட்டப்பட்ட தெளிவு பயிற்சிகள்.",
        canonical: `${BASE}/ta/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-ta.jpg`,
      },
      bn: {
        title: "নিজেকে জানুন — Drishiq",
        description: "নিজেকে আরও ভালোভাবে বুঝতে চিন্তা এবং নির্দেশিত স্পষ্টতা অনুশীলন।",
        canonical: `${BASE}/bn/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-bn.jpg`,
      },
      ru: {
        title: "Познайте себя — Drishiq",
        description: "Упражнения на размышления и направленную ясность, чтобы лучше понять себя.",
        canonical: `${BASE}/ru/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-ru.jpg`,
      },
      pt: {
        title: "Conheça a si mesmo — Drishiq",
        description: "Exercícios de reflexão e clareza guiada para se conhecer melhor.",
        canonical: `${BASE}/pt/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-pt.jpg`,
      },
      fr: {
        title: "Rencontrez-vous — Drishiq",
        description: "Exercices de réflexion et de clarté guidée pour mieux vous comprendre.",
        canonical: `${BASE}/fr/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-fr.jpg`,
      },
      de: {
        title: "Lerne dich selbst kennen — Drishiq",
        description: "Reflexions- und geführte Klarheitsübungen, um dich besser zu verstehen.",
        canonical: `${BASE}/de/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-de.jpg`,
      },
      it: {
        title: "Conosci te stesso — Drishiq",
        description: "Esercizi di riflessione e chiarezza guidata per conoscerti meglio.",
        canonical: `${BASE}/it/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-it.jpg`,
      },
      nl: {
        title: "Ontmoet jezelf — Drishiq",
        description: "Reflectie- en begeleide helderheidsoefeningen om jezelf beter te begrijpen.",
        canonical: `${BASE}/nl/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-nl.jpg`,
      },
      zh: {
        title: "认识自己 — Drishiq",
        description: "反思和引导清晰练习，更好地了解自己。",
        canonical: `${BASE}/zh/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-zh.jpg`,
      },
      ja: {
        title: "自分と出会う — Drishiq",
        description: "自分をより良く理解するための内省とガイドされた明確さの練習。",
        canonical: `${BASE}/ja/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-ja.jpg`,
      },
      ar: {
        title: "تعرف على نفسك — Drishiq",
        description: "تمارين التأمل والوضوح الموجهة لفهم نفسك بشكل أفضل.",
        canonical: `${BASE}/ar/meet-yourself`,
        ogImage: `${BASE}/og/meet-yourself-ar.jpg`,
      },
    },
  },
  community: {
    title: "Community — Drishiq",
    description: "Join the Drishiq community to share experiences, get support, and grow together.",
    canonical: `${BASE}/community`,
    ogImage: `${BASE}/og/community.jpg`,
    locales: {
      hi: {
        title: "समुदाय — Drishiq",
        description: "Drishiq समुदाय में शामिल हों अनुभव साझा करने, सहायता पाने और एक साथ बढ़ने के लिए।",
        canonical: `${BASE}/hi/community`,
        ogImage: `${BASE}/og/community-hi.jpg`,
      },
      es: {
        title: "Comunidad — Drishiq",
        description: "Únete a la comunidad Drishiq para compartir experiencias, obtener apoyo y crecer juntos.",
        canonical: `${BASE}/es/community`,
        ogImage: `${BASE}/og/community-es.jpg`,
      },
      fr: {
        title: "Communauté — Drishiq",
        description: "Rejoignez la communauté Drishiq pour partager des expériences, obtenir du soutien et grandir ensemble.",
        canonical: `${BASE}/fr/community`,
        ogImage: `${BASE}/og/community-fr.jpg`,
      },
      de: {
        title: "Gemeinschaft — Drishiq",
        description: "Treten Sie der Drishiq-Gemeinschaft bei, um Erfahrungen zu teilen, Unterstützung zu erhalten und gemeinsam zu wachsen.",
        canonical: `${BASE}/de/community`,
        ogImage: `${BASE}/og/community-de.jpg`,
      },
      zh: {
        title: "社区 — Drishiq",
        description: "加入Drishiq社区分享经验、获得支持并共同成长。",
        canonical: `${BASE}/zh/community`,
        ogImage: `${BASE}/og/community-zh.jpg`,
      },
      ja: {
        title: "コミュニティ — Drishiq",
        description: "Drishiqコミュニティに参加して、経験を共有し、サポートを受け、一緒に成長しましょう。",
        canonical: `${BASE}/ja/community`,
        ogImage: `${BASE}/og/community-ja.jpg`,
      },
      ar: {
        title: "المجتمع — Drishiq",
        description: "انضم إلى مجتمع Drishiq لمشاركة التجارب والحصول على الدعم والنمو معًا.",
        canonical: `${BASE}/ar/community`,
        ogImage: `${BASE}/og/community-ar.jpg`,
      },
      ta: {
        title: "சமூகம் — Drishiq",
        description: "Drishiq சமூகத்தில் சேர்ந்து அனுபவங்களை பகிர்ந்து, ஆதரவு பெற்று ஒன்றாக வளரவும்।",
        canonical: `${BASE}/ta/community`,
        ogImage: `${BASE}/og/community-ta.jpg`,
      },
      bn: {
        title: "সম্প্রদায় — Drishiq",
        description: "Drishiq সম্প্রদায়ে যোগ দিন অভিজ্ঞতা ভাগ করে নেওয়ার জন্য, সহায়তা পেতে এবং একসাথে বেড়ে ওঠার জন্য।",
        canonical: `${BASE}/bn/community`,
        ogImage: `${BASE}/og/community-bn.jpg`,
      },
      ru: {
        title: "Сообщество — Drishiq",
        description: "Присоединяйтесь к сообществу Drishiq, чтобы делиться опытом, получать поддержку и расти вместе.",
        canonical: `${BASE}/ru/community`,
        ogImage: `${BASE}/og/community-ru.jpg`,
      },
      pt: {
        title: "Comunidade — Drishiq",
        description: "Junte-se à comunidade Drishiq para compartilhar experiências, obter apoio e crescer juntos.",
        canonical: `${BASE}/pt/community`,
        ogImage: `${BASE}/og/community-pt.jpg`,
      },
    },
  },
  support: {
    title: "Support — Drishiq",
    description: "Get help and support from the Drishiq community or contribute to help others.",
    canonical: `${BASE}/support`,
    ogImage: `${BASE}/og/support.jpg`,
    locales: {
      hi: {
        title: "सहायता — Drishiq",
        description: "Drishiq समुदाय से सहायता और समर्थन प्राप्त करें या दूसरों की मदद करने में योगदान दें।",
        canonical: `${BASE}/hi/support`,
        ogImage: `${BASE}/og/support-hi.jpg`,
      },
      es: {
        title: "Soporte — Drishiq",
        description: "Obtén ayuda y soporte de la comunidad Drishiq o contribuye para ayudar a otros.",
        canonical: `${BASE}/es/support`,
        ogImage: `${BASE}/og/support-es.jpg`,
      },
      fr: {
        title: "Support — Drishiq",
        description: "Obtenez de l'aide et du soutien de la communauté Drishiq ou contribuez à aider les autres.",
        canonical: `${BASE}/fr/support`,
        ogImage: `${BASE}/og/support-fr.jpg`,
      },
      de: {
        title: "Support — Drishiq",
        description: "Erhalten Sie Hilfe und Unterstützung von der Drishiq-Gemeinschaft oder tragen Sie dazu bei, anderen zu helfen.",
        canonical: `${BASE}/de/support`,
        ogImage: `${BASE}/og/support-de.jpg`,
      },
      zh: {
        title: "支持 — Drishiq",
        description: "从Drishiq社区获得帮助和支持，或为帮助他人做出贡献。",
        canonical: `${BASE}/zh/support`,
        ogImage: `${BASE}/og/support-zh.jpg`,
      },
      ja: {
        title: "サポート — Drishiq",
        description: "Drishiqコミュニティからヘルプとサポートを得るか、他の人を助けるために貢献してください。",
        canonical: `${BASE}/ja/support`,
        ogImage: `${BASE}/og/support-ja.jpg`,
      },
      ar: {
        title: "الدعم — Drishiq",
        description: "احصل على المساعدة والدعم من مجتمع Drishiq أو ساهم في مساعدة الآخرين.",
        canonical: `${BASE}/ar/support`,
        ogImage: `${BASE}/og/support-ar.jpg`,
      },
      ta: {
        title: "ஆதரவு — Drishiq",
        description: "Drishiq சமூகத்திலிருந்து உதவி மற்றும் ஆதரவைப் பெறுங்கள் அல்லது மற்றவர்களுக்கு உதவுவதற்கு பங்களிக்கவும்।",
        canonical: `${BASE}/ta/support`,
        ogImage: `${BASE}/og/support-ta.jpg`,
      },
      bn: {
        title: "সহায়তা — Drishiq",
        description: "Drishiq সম্প্রদায় থেকে সাহায্য এবং সহায়তা পান বা অন্যদের সাহায্য করতে অবদান রাখুন।",
        canonical: `${BASE}/bn/support`,
        ogImage: `${BASE}/og/support-bn.jpg`,
      },
      ru: {
        title: "Поддержка — Drishiq",
        description: "Получите помощь и поддержку от сообщества Drishiq или внесите вклад в помощь другим.",
        canonical: `${BASE}/ru/support`,
        ogImage: `${BASE}/og/support-ru.jpg`,
      },
      pt: {
        title: "Suporte — Drishiq",
        description: "Obtenha ajuda e suporte da comunidade Drishiq ou contribua para ajudar outros.",
        canonical: `${BASE}/pt/support`,
        ogImage: `${BASE}/og/support-pt.jpg`,
      },
    },
  },
  terms: {
    title: "Terms & Privacy — Drishiq",
    description: "Terms of service, privacy policy, and cookies policy for Drishiq platform.",
    canonical: `${BASE}/terms`,
    ogImage: `${BASE}/og/terms.jpg`,
    locales: {
      hi: {
        title: "नियम और गोपनीयता — Drishiq",
        description: "Drishiq प्लेटफॉर्म के लिए सेवा की शर्तें, गोपनीयता नीति और कुकीज़ नीति।",
        canonical: `${BASE}/hi/terms`,
        ogImage: `${BASE}/og/terms-hi.jpg`,
      },
      es: {
        title: "Términos y Privacidad — Drishiq",
        description: "Términos de servicio, política de privacidad y política de cookies para la plataforma Drishiq.",
        canonical: `${BASE}/es/terms`,
        ogImage: `${BASE}/og/terms-es.jpg`,
      },
      fr: {
        title: "Conditions et Confidentialité — Drishiq",
        description: "Conditions d'utilisation, politique de confidentialité et politique de cookies pour la plateforme Drishiq.",
        canonical: `${BASE}/fr/terms`,
        ogImage: `${BASE}/og/terms-fr.jpg`,
      },
      de: {
        title: "Bedingungen und Datenschutz — Drishiq",
        description: "Nutzungsbedingungen, Datenschutzrichtlinie und Cookie-Richtlinie für die Drishiq-Plattform.",
        canonical: `${BASE}/de/terms`,
        ogImage: `${BASE}/og/terms-de.jpg`,
      },
      zh: {
        title: "条款和隐私 — Drishiq",
        description: "Drishiq平台的服务条款、隐私政策和Cookie政策。",
        canonical: `${BASE}/zh/terms`,
        ogImage: `${BASE}/og/terms-zh.jpg`,
      },
      ja: {
        title: "利用規約とプライバシー — Drishiq",
        description: "Drishiqプラットフォームの利用規約、プライバシーポリシー、Cookieポリシー。",
        canonical: `${BASE}/ja/terms`,
        ogImage: `${BASE}/og/terms-ja.jpg`,
      },
      ar: {
        title: "الشروط والخصوصية — Drishiq",
        description: "شروط الخدمة وسياسة الخصوصية وسياسة ملفات تعريف الارتباط لمنصة Drishiq.",
        canonical: `${BASE}/ar/terms`,
        ogImage: `${BASE}/og/terms-ar.jpg`,
      },
      ta: {
        title: "விதிமுறைகள் மற்றும் தனியுரிமை — Drishiq",
        description: "Drishiq தளத்திற்கான சேவை விதிமுறைகள், தனியுரிமை கொள்கை மற்றும் குக்கி கொள்கை.",
        canonical: `${BASE}/ta/terms`,
        ogImage: `${BASE}/og/terms-ta.jpg`,
      },
      bn: {
        title: "শর্তাবলী এবং গোপনীয়তা — Drishiq",
        description: "Drishiq প্ল্যাটফর্মের জন্য পরিষেবার শর্তাবলী, গোপনীয়তা নীতি এবং কুকি নীতি।",
        canonical: `${BASE}/bn/terms`,
        ogImage: `${BASE}/og/terms-bn.jpg`,
      },
      ru: {
        title: "Условия и Конфиденциальность — Drishiq",
        description: "Условия обслуживания, политика конфиденциальности и политика файлов cookie для платформы Drishiq.",
        canonical: `${BASE}/ru/terms`,
        ogImage: `${BASE}/og/terms-ru.jpg`,
      },
      pt: {
        title: "Termos e Privacidade — Drishiq",
        description: "Termos de serviço, política de privacidade e política de cookies para a plataforma Drishiq.",
        canonical: `${BASE}/pt/terms`,
        ogImage: `${BASE}/og/terms-pt.jpg`,
      },
    },
  },
  "grow-with-us": {
    title: "Grow With Us — Drishiq",
    description: "Partner with Drishiq: affiliates, ambassadors, collaborators, investors, and more.",
    canonical: `${BASE}/grow-with-us`,
    ogImage: `${BASE}/og/grow-with-us.jpg`,
    locales: {
      hi: {
        title: "हमारे साथ बढ़ें — Drishiq",
        description: "Drishiq के साथ साझेदारी करें: सहयोगी, राजदूत, सहयोगी, निवेशक और बहुत कुछ।",
        canonical: `${BASE}/hi/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-hi.jpg`,
      },
      es: {
        title: "Crece Con Nosotros — Drishiq",
        description: "Asóciate con Drishiq: afiliados, embajadores, colaboradores, inversores y más.",
        canonical: `${BASE}/es/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-es.jpg`,
      },
      fr: {
        title: "Grandissez Avec Nous — Drishiq",
        description: "Partenariat avec Drishiq : affiliés, ambassadeurs, collaborateurs, investisseurs et plus.",
        canonical: `${BASE}/fr/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-fr.jpg`,
      },
      de: {
        title: "Wachsen Sie Mit Uns — Drishiq",
        description: "Partnerschaft mit Drishiq: Partner, Botschafter, Mitarbeiter, Investoren und mehr.",
        canonical: `${BASE}/de/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-de.jpg`,
      },
      zh: {
        title: "与我们一起成长 — Drishiq",
        description: "与Drishiq合作：联盟伙伴、大使、协作者、投资者等。",
        canonical: `${BASE}/zh/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-zh.jpg`,
      },
      ja: {
        title: "私たちと一緒に成長 — Drishiq",
        description: "Drishiqとパートナーシップ：アフィリエイト、アンバサダー、コラボレーター、投資家など。",
        canonical: `${BASE}/ja/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-ja.jpg`,
      },
      ar: {
        title: "انمو معنا — Drishiq",
        description: "شراكة مع Drishiq: شركاء، سفراء، متعاونون، مستثمرون والمزيد.",
        canonical: `${BASE}/ar/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-ar.jpg`,
      },
      ta: {
        title: "எங்களுடன் வளருங்கள் — Drishiq",
        description: "Drishiq உடன் கூட்டாளியாகுங்கள்: இணைவாளர்கள், தூதர்கள், ஒத்துழைப்பாளர்கள், முதலீட்டாளர்கள் மற்றும் பல.",
        canonical: `${BASE}/ta/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-ta.jpg`,
      },
      bn: {
        title: "আমাদের সাথে বেড়ে উঠুন — Drishiq",
        description: "Drishiq এর সাথে অংশীদারিত্ব করুন: সহযোগী, রাষ্ট্রদূত, সহযোগী, বিনিয়োগকারী এবং আরও অনেক কিছু।",
        canonical: `${BASE}/bn/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-bn.jpg`,
      },
      ru: {
        title: "Растите С Нами — Drishiq",
        description: "Партнерство с Drishiq: партнеры, послы, сотрудники, инвесторы и многое другое.",
        canonical: `${BASE}/ru/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-ru.jpg`,
      },
      pt: {
        title: "Cresça Conosco — Drishiq",
        description: "Parceria com Drishiq: afiliados, embaixadores, colaboradores, investidores e muito mais.",
        canonical: `${BASE}/pt/grow-with-us`,
        ogImage: `${BASE}/og/grow-with-us-pt.jpg`,
      },
    },
  },
};

export function getPageMetadata(key: string): MetaProps {
  return { ...defaults, ...(pages[key] || {}) };
}

export function buildMetadata(meta: Partial<MetaProps>) {
  const merged = { ...defaults, ...meta };
  return {
    title: merged.title,
    description: merged.description,
    alternates: { canonical: merged.canonical },
    openGraph: {
      title: merged.title,
      description: merged.description,
      url: merged.canonical,
      siteName: "Drishiq",
      images: [{ url: merged.ogImage }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: merged.title,
      description: merged.description,
      images: [merged.twitterImage || merged.ogImage],
    },
    // keep other fields (authors, keywords) available if needed
  };
}

export function buildMetadataForLocale(key: string, locale?: string) {
  const baseMeta = getPageMetadata(key);
  
  // If locale is provided and the page has locale overrides, merge them
  if (locale && baseMeta.locales && baseMeta.locales[locale]) {
    const localeOverrides = baseMeta.locales[locale];
    const mergedMeta = { ...baseMeta, ...localeOverrides };
    return buildMetadata(mergedMeta);
  }
  
  // Otherwise, return the base metadata
  return buildMetadata(baseMeta);
}
