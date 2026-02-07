"use client";

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { notFound } from "next/navigation";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";
import { getPersonaConfig, isValidPersonaType, type PersonaConfig } from "@/lib/meet-yourself-config";
import { Search, Lightbulb, Sprout, Star, Map, Pause, Scale, Building } from "lucide-react";

const FM: any = motion as any;

interface PageProps {
  params: { type: string };
}

export default function MeetYourselfPage({ params }: PageProps) {
  const { type } = params;
  
  if (!isValidPersonaType(type)) {
    notFound();
  }
  
  const config = getPersonaConfig(type)!;
  const { t, language } = useLanguage([config.namespace]);
  
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // Helper function to safely extract string from translation
  const getString = (key: string, fallback: string = ""): string => {
    const result = t(key);
    if (typeof result === 'string') return result || fallback;
    if (result && typeof result === 'object') {
      if ('label' in result && typeof result.label === 'string') return result.label;
      if ('sentence' in result && typeof result.sentence === 'string') return result.sentence;
      if ('h' in result && typeof result.h === 'string') return result.h;
      if ('d' in result && typeof result.d === 'string') return result.d;
      return fallback;
    }
    return fallback;
  };

  // Helper function to get how card data
  const getHowCard = (index: number, hFallback: string, dFallback: string) => {
    const baseKey = `${config.namespace}.${config.translationKey}.how.${index}`;
    const hKey = `${baseKey}.h`;
    const dKey = `${baseKey}.d`;
    
    const hResult = t(hKey);
    const dResult = t(dKey);
    
    const h = typeof hResult === 'string' && hResult ? hResult : hFallback;
    const d = typeof dResult === 'string' && dResult ? dResult : dFallback;
    
    return { h, d };
  };

  const baseKey = `${config.namespace}.${config.translationKey}`;

  // Stir lines
  const stirLines: string[] = useMemo(() => [
    getString(`${baseKey}.stir.line.0`, "Does this resonate with you?"),
    getString(`${baseKey}.stir.line.1`, "Have you experienced this pattern?"),
    getString(`${baseKey}.stir.line.2`, "Does this feel familiar?"),
    getString(`${baseKey}.stir.line.3`, "Have you noticed this in yourself?"),
    getString(`${baseKey}.stir.line.4`, "What if there's another way?"),
  ], [t, language, baseKey]);

  // Emotion Cards
  const emotionCards = useMemo(() => [
    { t: getString(`${baseKey}.emote.0.title`, "Emotion 1"), s: getString(`${baseKey}.emote.0.subtitle`, "Description") },
    { t: getString(`${baseKey}.emote.1.title`, "Emotion 2"), s: getString(`${baseKey}.emote.1.subtitle`, "Description") },
    { t: getString(`${baseKey}.emote.2.title`, "Emotion 3"), s: getString(`${baseKey}.emote.2.subtitle`, "Description") },
    { t: getString(`${baseKey}.emote.3.title`, "Emotion 4"), s: getString(`${baseKey}.emote.3.subtitle`, "Description") },
    { t: getString(`${baseKey}.emote.4.title`, "Emotion 5"), s: getString(`${baseKey}.emote.4.subtitle`, "Description") },
    { t: getString(`${baseKey}.emote.5.title`, "Emotion 6"), s: getString(`${baseKey}.emote.5.subtitle`, "Description") },
  ], [t, language, baseKey]);

  // Celebrity Ticker
  const celebA = useMemo(() => [
    { img: `/assets/images/meet-yourself/${type}/Slider/celeb1.jpg`, name: getString(`${baseKey}.celeb.0.name`, "Celebrity 1"), profession: getString(`${baseKey}.celeb.0.profession`, "Role"), source: "Quote", quote: getString(`${baseKey}.celeb.0.quote`, "\"Quote here\"") },
    { img: `/assets/images/meet-yourself/${type}/Slider/celeb2.jpg`, name: getString(`${baseKey}.celeb.1.name`, "Celebrity 2"), profession: getString(`${baseKey}.celeb.1.profession`, "Role"), source: "Quote", quote: getString(`${baseKey}.celeb.1.quote`, "\"Quote here\"") },
    { img: `/assets/images/meet-yourself/${type}/Slider/celeb3.jpg`, name: getString(`${baseKey}.celeb.2.name`, "Celebrity 3"), profession: getString(`${baseKey}.celeb.2.profession`, "Role"), source: "Quote", quote: getString(`${baseKey}.celeb.2.quote`, "\"Quote here\"") },
    { img: `/assets/images/meet-yourself/${type}/Slider/celeb4.jpg`, name: getString(`${baseKey}.celeb.3.name`, "Celebrity 4"), profession: getString(`${baseKey}.celeb.3.profession`, "Role"), source: "Quote", quote: getString(`${baseKey}.celeb.3.quote`, "\"Quote here\"") },
    { img: `/assets/images/meet-yourself/${type}/Slider/celeb5.jpg`, name: getString(`${baseKey}.celeb.4.name`, "Celebrity 5"), profession: getString(`${baseKey}.celeb.4.profession`, "Role"), source: "Quote", quote: getString(`${baseKey}.celeb.4.quote`, "\"Quote here\"") },
  ], [t, language, baseKey, type]);
  const celebs = [...celebA, ...celebA];

  // Content Sections
  type Section = {
    icon: React.ReactNode;
    title: string;
    line: string;
    context: { body: string; bullets: string[]; nudge: string };
    frames: { img: string; h: string; p: string }[];
    cta: { label: string; href: string };
  };

  const sectionIcons = [
    <Search key="search" size={20} strokeWidth={1.5} />,
    <Lightbulb key="lightbulb" size={20} strokeWidth={1.5} />,
    <Sprout key="sprout" size={20} strokeWidth={1.5} />,
    <Star key="star" size={20} strokeWidth={1.5} />
  ];

  const sections: Section[] = useMemo(() => [0, 1, 2, 3].map(index => ({
    icon: sectionIcons[index],
    title: getString(`${baseKey}.section.${index}.title`, `Section ${index + 1}`),
    line: getString(`${baseKey}.section.${index}.line`, "Description line"),
    context: {
      body: getString(`${baseKey}.section.${index}.body`, "Content body text"),
      bullets: [
        getString(`${baseKey}.section.${index}.bullet.0`, "Bullet point 1"),
        getString(`${baseKey}.section.${index}.bullet.1`, "Bullet point 2"),
        getString(`${baseKey}.section.${index}.bullet.2`, "Bullet point 3"),
      ],
      nudge: getString(`${baseKey}.section.${index}.nudge`, "Try this exercise"),
    },
    frames: [
      { img: `/assets/images/meet-yourself/${type}/section${index}/frame1.jpg`, h: getString(`${baseKey}.section.${index}.frame.0.h`, "Frame 1"), p: getString(`${baseKey}.section.${index}.frame.0.p`, "Caption") },
      { img: `/assets/images/meet-yourself/${type}/section${index}/frame2.jpg`, h: getString(`${baseKey}.section.${index}.frame.1.h`, "Frame 2"), p: getString(`${baseKey}.section.${index}.frame.1.p`, "Caption") },
      { img: `/assets/images/meet-yourself/${type}/section${index}/frame3.jpg`, h: getString(`${baseKey}.section.${index}.frame.2.h`, "Frame 3"), p: getString(`${baseKey}.section.${index}.frame.2.p`, "Caption") },
    ],
    cta: { label: getString(`${baseKey}.section.${index}.cta`, "Take action →"), href: "/signup" },
  })), [t, language, baseKey, type]);

  // How cards
  const howCards = useMemo(() => [
    { ...getHowCard(0, "Tool 1", "Description"), icon: <Map size={24} strokeWidth={1.5} /> },
    { ...getHowCard(1, "Tool 2", "Description"), icon: <Pause size={24} strokeWidth={1.5} /> },
    { ...getHowCard(2, "Tool 3", "Description"), icon: <Scale size={24} strokeWidth={1.5} /> },
    { ...getHowCard(3, "Tool 4", "Description"), icon: <Building size={24} strokeWidth={1.5} /> },
  ], [t, language]);

  const displayName = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.drishiq.com" },
              { "@type": "ListItem", "position": 2, "name": "Meet Yourself", "item": "https://www.drishiq.com/meet-yourself" },
              { "@type": "ListItem", "position": 3, "name": displayName, "item": `https://www.drishiq.com/meet-yourself/${type}` }
            ]
          })
        }}
      />
      
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200 to-emerald-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-300 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-200 to-purple-300 opacity-20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>
      
      {/* Top band */}
      <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200 relative z-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 py-4 text-sm font-semibold text-gray-600">
            <span className="text-xl">{config.topBandEmoji}</span>
            <span>{getString(`${baseKey}.hero.subtitle`, `${displayName} — stories from known faces`)}</span>
          </div>
        </div>
        <CelebTickerV2 items={celebs} />
      </section>
      
      {/* Hero */}
      <section className="container mx-auto max-w-7xl px-4 pt-16 relative z-10">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-12 lg:col-span-7">
            <FM.h1 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.4 }} 
              className="text-4xl md:text-5xl font-extrabold flex items-center gap-4 text-gray-900"
            >
              <span className="text-5xl" aria-hidden>{config.heroEmoji}</span>
              {getString(`${baseKey}.hero.title`, displayName)}
            </FM.h1>
            <FM.p 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.45, delay: 0.05 }} 
              className="mt-4 text-xl text-gray-600 leading-relaxed"
            >
              {getString(`${baseKey}.hero.description`, "Discover your patterns and find clarity.")}
            </FM.p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <ShinyButton href="/signup" config={config}>{getString(`${baseKey}.hero.cta.primary`, "Explore your patterns →")}</ShinyButton>
              <a 
                href="#how" 
                className="rounded-2xl px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
              >
                {getString(`${baseKey}.hero.cta.secondary`, "How DrishiQ helps?")}
              </a>
            </div>
            <StirTicker lines={stirLines} animationName={config.animationName} />
          </div>
          
          {/* Emotion Cards */}
          <div className="md:col-span-12 lg:col-span-5">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl p-6 shadow-xl">
              <EmotionTiles items={emotionCards} />
            </div>
            <div className="flex items-center gap-3 mt-4 text-sm font-semibold text-gray-600 justify-end">
              <span className="text-xl">{config.topBandEmoji}</span>
              <span>{getString(`${baseKey}.try_this`, "Try this:")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      {sections.map((s, index) => (
        <section key={s.title} className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
          <div className="grid gap-4 md:grid-cols-12 items-start">
            <div className="md:col-span-7">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-emerald-700" aria-hidden>{s.icon}</div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{s.title}</h2>
              </div>
              <p className="text-lg text-gray-600">{s.line}</p>
            </div>
            <div className="md:col-span-5" />
          </div>

          <div className="mt-6 grid gap-8 md:grid-cols-12 items-stretch">
            <FM.div 
              className="md:col-span-7" 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="h-full rounded-3xl bg-white border border-gray-100 p-8 shadow-xl">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">{s.context.body}</p>
                <ul className="space-y-3 list-disc pl-6 text-gray-700 mb-6">
                  {s.context.bullets.map((b, idx) => (
                    <li key={idx} className="text-base">{b}</li>
                  ))}
                </ul>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6">
                  <div className="text-lg font-semibold text-emerald-800 mb-2">{getString(`${baseKey}.try_this`, "Try this:")}</div>
                  <p className="text-emerald-700">{s.context.nudge}</p>
                </div>
              </div>
            </FM.div>

            <div className="md:col-span-5 flex flex-col justify-start">
              <div className="relative rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden w-full max-w-lg">
                <div className="relative h-[350px] w-full">
                  <StreamStrip frames={s.frames} />
                </div>
              </div>
              <div className="mt-6 w-full max-w-lg">
                <a 
                  href="/signup" 
                  className={`block w-full text-center rounded-2xl px-6 py-4 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                >
                  {getString(`${baseKey}.cta.how`, "How DrishiQ helps")}
                </a>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Bridge Section */}
      <section className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
        <div className={`rounded-3xl bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} text-white p-8 md:p-12 shadow-2xl relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">{getString(`${baseKey}.bridge.title`, "Ready to Discover More?")}</h3>
            <p className="text-xl opacity-95 leading-relaxed">{getString(`${baseKey}.bridge.body`, "Drishiq helps you understand your patterns and find clarity.")}</p>
            <div className="mt-8">
              <a 
                href="/signup" 
                className="inline-flex items-center rounded-2xl bg-white text-gray-800 px-8 py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 transform hover:-translate-y-1"
              >
                {getString(`${baseKey}.bridge.cta`, "Begin your clarity check →")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How Drishiq Helps */}
      <section id="how" className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">{getString(`${baseKey}.how.title`, "How Drishiq Makes a Difference")}</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {howCards.map((f, i) => (
            <FM.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.5, delay: i * 0.1 }} 
              className="rounded-3xl bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="text-emerald-700 mb-4">{f.icon}</div>
              <div className="text-xl font-bold text-gray-900 mb-3">{f.h}</div>
              <p className="text-gray-600 leading-relaxed">{f.d}</p>
            </FM.div>
          ))}
        </div>
      </section>

      <Footer />

      <style>{`
        :root { --drishiq-green:#1A3D2D; }
        @keyframes marquee-ltr { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .ticker-container{ overflow:hidden; background:#fff; }
        .ticker-track{ display:flex; will-change:transform; width:200%; }
        .celeb-track{ animation:marquee-ltr 12s linear infinite; }
        .celeb-item{ flex:none; display:flex; align-items:center; margin-right:2.25rem; }
        .celeb-item img{ width:28px; height:28px; border-radius:9999px; object-fit:cover; margin-right:.5rem; background:#e8efe9; }
        .name-meta{ font-size:.92rem; white-space:nowrap; line-height:1.2; }
        .name-meta strong{ font-weight:700; }
        .profession-source{ font-size:.8rem; opacity:.75; }
        .quote{ font-size:.85rem; color:#4b5563; white-space:nowrap; line-height:1.2; }
        @keyframes ${config.animationName} { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: ${config.animationName} 22s linear infinite; }
        @keyframes stream-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stream-wrap { position: absolute; inset: 0; overflow: hidden; }
        .stream-track { display:flex; width:200%; height:100%; animation: stream-rtl 35s linear infinite; }
        .stream-track:hover { animation-play-state: paused; }
        .stream-item { position: relative; height:100%; width: 500px; flex: 0 0 auto; }
        .stream-item img { height:100%; width:100%; object-fit: cover; }
        .stream-cap { position:absolute; inset-inline:0.5rem; bottom:0.5rem; color:white; padding:0.5rem; border-radius:0.75rem; background: linear-gradient(to top, rgba(11,68,34,.9), rgba(11,68,34,.4), transparent); }
      `}</style>
    </div>
  );
}

// ---- Components ----
function EmotionTiles({ items }: { items: { t: string; s: string }[] }) {
  const colorSchemes = [
    'from-blue-50 to-indigo-100 border-blue-200 text-blue-800',
    'from-emerald-50 to-green-100 border-emerald-200 text-emerald-800',
    'from-purple-50 to-violet-100 border-purple-200 text-purple-800',
    'from-orange-50 to-amber-100 border-orange-200 text-orange-800',
    'from-pink-50 to-rose-100 border-pink-200 text-pink-800',
    'from-cyan-50 to-teal-100 border-cyan-200 text-cyan-800'
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((x, i) => (
        <FM.div 
          key={i} 
          initial={{ opacity: 0, y: 8 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.35, delay: i * 0.04 }} 
          className={`rounded-2xl bg-gradient-to-br border p-4 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${colorSchemes[i % colorSchemes.length]}`}
        >
          <div className="text-lg md:text-xl font-bold mb-1">{x.t}</div>
          <div className="text-sm opacity-80">{x.s}</div>
        </FM.div>
      ))}
    </div>
  );
}

function CelebTickerV2({ items }: { items: any[] }) {
  const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="%23e6efe9"/></svg>';
  return (
    <section className="ticker-container border-t border-b border-gray-200 py-4 bg-white/80 backdrop-blur-sm">
      <div className="ticker-track celeb-track">
        {items.map((c, i) => (
          <div key={i} className="celeb-item">
            <img src={c.img} alt={c.name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback; }} />
            <div>
              <div className="name-meta"><strong>{c.name}</strong> <span className="profession-source">– {c.profession} — {c.source}</span></div>
              <div className="quote">{c.quote}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StirTicker({ lines, animationName }: { lines: string[]; animationName: string }) {
  const doubled = [...lines, ...lines];
  return (
    <div className="mt-8 border-y border-dashed border-gray-200 bg-white/60 rounded-2xl py-4">
      <div className="flex overflow-hidden">
        <div className="flex whitespace-nowrap stir-track">
          {doubled.map((text, i) => (
            <span key={i} className="m-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">✦ {text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShinyButton({ href, children, config }: { href: string; children: React.ReactNode; config: PersonaConfig }) {
  return (
    <a 
      href={href} 
      className={`relative inline-block rounded-2xl px-8 py-4 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group`}
    >
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shine_3.6s_infinite] group-hover:animate-[shine_2s_infinite]" />
      <style>{`@keyframes shine{0%{transform:translateX(-120%)}60%{transform:translateX(120%)}100%{transform:translateX(120%)}}`}</style>
    </a>
  );
}

function StreamStrip({ frames }: { frames: any[] }) {
  const doubled = [...frames, ...frames];
  return (
    <div className="stream-wrap">
      <div className="stream-track">
        {doubled.map((f, idx) => (
          <figure key={idx} className="stream-item">
            <img src={f.img} alt={f.h} />
            <figcaption className="stream-cap">
              <div className="text-lg font-bold leading-tight">{f.p}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
