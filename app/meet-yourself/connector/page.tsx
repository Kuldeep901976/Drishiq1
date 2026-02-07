"use client";

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";
import { Users, Link2, GitBranch, Layers, HeartHandshake, Flame, Map, Shield, Scale, Target, Sparkle, Check, type LucideIcon } from 'lucide-react';

// Icon mappings for dynamic rendering
const sectionIconMap: Record<string, LucideIcon> = {
  "🌉": GitBranch,
  "🧵": Layers,
  "🫶": HeartHandshake,
  "🕯️": Flame,
};

const howIconMap: Record<string, LucideIcon> = {
  "🗺️": Map,
  "🛡️": Shield,
  "⚖️": Scale,
  "🎯": Target,
};

// Safe fallback: if framer-motion isn't installed, FM renders plain elements
const FM: any = motion as any;

/**
 * CONNECTOR — React + TypeScript + Tailwind
 * Matches your persona pattern (FM fallback, tiles, celeb ticker, stir ticker),
 * with Connector copy and content.
 */

export default function ConnectorPage() {
  const { t, language } = useLanguage(['meetyourself1']);
  
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // === Stir lines under headline ===
  const stirLines: string[] = [
    t("meetyourself1.connector.stir.line.0") || "Do you often know everyone's story but rarely share your own?",
    t("meetyourself1.connector.stir.line.1") || "Are you the first person people call for 'who to talk to'?",
    t("meetyourself1.connector.stir.line.2") || "Do you feel responsible for holding communities together?",
    t("meetyourself1.connector.stir.line.3") || "Have you felt lonely in the middle of your own network?",
    t("meetyourself1.connector.stir.line.4") || "What would it be like to connect inward before outward?",
  ];

  // === Quick Emotion Cards (6) ===
  const emotionCards = [
    { t: t("meetyourself1.connector.emote.0.title") || "Warm", s: t("meetyourself1.connector.emote.0.subtitle") || "At home in any crowd" },
    { t: t("meetyourself1.connector.emote.1.title") || "Overextended", s: t("meetyourself1.connector.emote.1.subtitle") || "Too many threads to hold" },
    { t: t("meetyourself1.connector.emote.2.title") || "Valued", s: t("meetyourself1.connector.emote.2.subtitle") || "Others rely on you" },
    { t: t("meetyourself1.connector.emote.3.title") || "Invisible", s: t("meetyourself1.connector.emote.3.subtitle") || "Your story takes a backseat" },
    { t: t("meetyourself1.connector.emote.4.title") || "Proud", s: t("meetyourself1.connector.emote.4.subtitle") || "Building bridges others needed" },
    { t: t("meetyourself1.connector.emote.5.title") || "Drained", s: t("meetyourself1.connector.emote.5.subtitle") || "Energy spread too thin" },
  ];

  // === Celebrity Ticker ===
  const celebA = t("meetyourself1.connector.celeb.items", { returnObjects: true }) || [
    { img: "/assets/images/meet-yourself/connector/celebs/maya_angelou.jpg", name: "Maya Angelou", profession: "Poet", source: "Quote", quote: "\"We are more alike, my friends, than we are unalike.\"" },
    { img: "/assets/images/meet-yourself/connector/celebs/Howard_Schultz.jpg", name: "Howard Schultz", profession: "Business Leader", source: "Quote", quote: "\"In life, you can't have everything. But you can have the things that really matter.\"" },
    { img: "/assets/images/meet-yourself/connector/celebs/Malala_Yousafzai.jpg", name: "Malala Yousafzai", profession: "Activist", source: "Quote", quote: "\"When the whole world is silent, even one voice becomes powerful.\"" },
    { img: "/assets/images/meet-yourself/connector/celebs/Desmond_Tutu.jpg", name: "Desmond Tutu", profession: "Leader", source: "Quote", quote: "\"Do your little bit of good where you are; those little bits overwhelm the world.\"" },
    { img: "/assets/images/meet-yourself/connector/celebs/Fred_Rogers.jpg", name: "Fred Rogers", profession: "Educator", source: "Quote", quote: "\"Mutual caring relationships require kindness, patience, and understanding.\"" },
  ];
  const celebs = Array.isArray(celebA) ? [...celebA, ...celebA] : [];

  // === How Drishiq Makes a Difference Section ===
  const howDifferenceMakes = [
    { icon: "🗺️", h: t("meetyourself1.connector.how.0.h") || "Connection Map", d: t("meetyourself1.connector.how.0.d") || "See where your energy is going." },
    { icon: "🛡️", h: t("meetyourself1.connector.how.1.h") || "Boundary Tools", d: t("meetyourself1.connector.how.1.d") || "Learn to say yes without overextending." },
    { icon: "⚖️", h: t("meetyourself1.connector.how.2.h") || "Mutuality Practices", d: t("meetyourself1.connector.how.2.d") || "Create balanced relationships." },
    { icon: "🎯", h: t("meetyourself1.connector.how.3.h") || "Purpose Paths", d: t("meetyourself1.connector.how.3.d") || "Align connections with what matters most to you." },
  ];

  // === Content Sections ===
  type Section = {
    emoji: string;
    title: string;
    line: string;
    context: { body: string; bullets: string[]; nudge: string };
    frames: { img: string; h: string; p: string }[];
    cta: { label: string; href: string };
  };

  const sections: Section[] = useMemo(() => [
    {
      emoji: "🌉",
      title: t("meetyourself1.connector.section.0.title") || "The Gift of Bridges",
      line: t("meetyourself1.connector.section.0.line") || "You see where people should meet before they do.",
      context: {
        body: t("meetyourself1.connector.section.0.body") || "You're the thread between stories, the link between isolated ideas, the spark that makes things possible. The world needs your openness — and your ability to bring worlds together.",
        bullets: [
          t("meetyourself1.connector.section.0.bullet.0") || "You instinctively introduce people who might help each other.",
          t("meetyourself1.connector.section.0.bullet.1") || "You can't stand to see someone left out.",
          t("meetyourself1.connector.section.0.bullet.2") || "You're energized by watching relationships form.",
        ],
        nudge: t("meetyourself1.connector.section.0.nudge") || "List three connections you've recently made that truly felt meaningful — not just convenient.",
      },
      frames: [
        { img: t("meetyourself1.connector.section.0.frame.0.img") || "/assets/images/meet-yourself/connector/right slider/top/Connecting people..jpeg", h: t("meetyourself1.connector.section.0.frame.0.h") || "Connecting people.", p: t("meetyourself1.connector.section.0.frame.0.p") || "Connecting people." },
        { img: t("meetyourself1.connector.section.0.frame.1.img") || "/assets/images/meet-yourself/connector/right slider/top/Holding groups together..jpg", h: t("meetyourself1.connector.section.0.frame.1.h") || "Holding groups together.", p: t("meetyourself1.connector.section.0.frame.1.p") || "Holding groups together." },
        { img: t("meetyourself1.connector.section.0.frame.2.img") || "/assets/images/meet-yourself/connector/right slider/top/Connecting people..jpeg", h: t("meetyourself1.connector.section.0.frame.2.h") || "Connecting people.", p: t("meetyourself1.connector.section.0.frame.2.p") || "Connecting people." },
      ],
      cta: { label: t("meetyourself1.connector.section.0.cta") || "Connect where it matters most →", href: "/signup" },
    },
    {
      emoji: "🧵",
      title: t("meetyourself1.connector.section.1.title") || "Holding Too Many Threads",
      line: t("meetyourself1.connector.section.1.line") || "Even the strongest net can fray under strain.",
      context: {
        body: t("meetyourself1.connector.section.1.body") || "When you're the glue in everyone's lives, it can feel like nothing moves without you — and that can quietly exhaust you.",
        bullets: [
          t("meetyourself1.connector.section.1.bullet.0") || "You feel guilty if you can't attend every event.",
          t("meetyourself1.connector.section.1.bullet.1") || "Your inbox or messages are always full of requests.",
          t("meetyourself1.connector.section.1.bullet.2") || "You find it hard to say 'no' without explanation.",
        ],
        nudge: t("meetyourself1.connector.section.1.nudge") || "Pause before responding to a request. Ask: 'Is this mine to hold?'",
      },
      frames: [
        { img: t("meetyourself1.connector.section.1.frame.0.img") || "/assets/images/meet-yourself/connector/right slider/medium/Breaking the ice..jpeg", h: t("meetyourself1.connector.section.1.frame.0.h") || "Breaking the ice.", p: t("meetyourself1.connector.section.1.frame.0.p") || "Breaking the ice." },
        { img: t("meetyourself1.connector.section.1.frame.1.img") || "/assets/images/meet-yourself/connector/right slider/medium/Bringing teams together..jpg", h: t("meetyourself1.connector.section.1.frame.1.h") || "Bringing teams together.", p: t("meetyourself1.connector.section.1.frame.1.p") || "Bringing teams together." },
        { img: t("meetyourself1.connector.section.1.frame.2.img") || "/assets/images/meet-yourself/connector/right slider/medium/Breaking the ice..jpeg", h: t("meetyourself1.connector.section.1.frame.2.h") || "Breaking the ice.", p: t("meetyourself1.connector.section.1.frame.2.p") || "Breaking the ice." },
      ],
      cta: { label: t("meetyourself1.connector.section.1.cta") || "Protect your space without breaking connections →", href: "/signup" },
    },
    {
      emoji: "🫶",
      title: t("meetyourself1.connector.section.2.title") || "Finding Your Own Place in the Network",
      line: t("meetyourself1.connector.section.2.line") || "Connection is strongest when you're part of it too.",
      context: {
        body: t("meetyourself1.connector.section.2.body") || "It's easy to become the quiet center that no one notices — because you're busy making sure others are noticed. But your voice and needs deserve equal space.",
        bullets: [
          t("meetyourself1.connector.section.2.bullet.0") || "People know you as 'the connector' but not deeply as a person.",
          t("meetyourself1.connector.section.2.bullet.1") || "Your own milestones often go uncelebrated.",
          t("meetyourself1.connector.section.2.bullet.2") || "You're hesitant to ask for help.",
        ],
        nudge: t("meetyourself1.connector.section.2.nudge") || "Share one personal goal or challenge with someone you trust this week.",
      },
      frames: [
        { img: t("meetyourself1.connector.section.2.frame.0.img") || "/assets/images/meet-yourself/connector/right slider/lower/Building harmony.jpg", h: t("meetyourself1.connector.section.2.frame.0.h") || "Building harmony", p: t("meetyourself1.connector.section.2.frame.0.p") || "Building harmony" },
        { img: t("meetyourself1.connector.section.2.frame.1.img") || "/assets/images/meet-yourself/connector/right slider/lower/Creating safe spaces..jpg", h: t("meetyourself1.connector.section.2.frame.1.h") || "Creating safe spaces.", p: t("meetyourself1.connector.section.2.frame.1.p") || "Creating safe spaces." },
        { img: t("meetyourself1.connector.section.2.frame.2.img") || "/assets/images/meet-yourself/connector/right slider/lower/Building harmony.jpg", h: t("meetyourself1.connector.section.2.frame.2.h") || "Building harmony", p: t("meetyourself1.connector.section.2.frame.2.p") || "Building harmony" },
      ],
      cta: { label: t("meetyourself1.connector.section.2.cta") || "Step into the circle you've created →", href: "/signup" },
    },
    {
      emoji: "🕯️",
      title: t("meetyourself1.connector.section.3.title") || "Connecting for Change",
      line: t("meetyourself1.connector.section.3.line") || "The most powerful bridges don't just link people — they change lives.",
      context: {
        body: t("meetyourself1.connector.section.3.body") || "When your connections are built with intention and care, they ripple outward, shaping communities and creating impact that lasts beyond you.",
        bullets: [
          t("meetyourself1.connector.section.3.bullet.0") || "You want your network to have purpose beyond social links.",
          t("meetyourself1.connector.section.3.bullet.1") || "You dream of starting initiatives that help more people.",
          t("meetyourself1.connector.section.3.bullet.2") || "You see potential in people others overlook.",
        ],
        nudge: t("meetyourself1.connector.section.3.nudge") || "Choose one relationship or group to invest deeper time in — not more breadth, but more depth.",
      },
      frames: [
        { img: t("meetyourself1.connector.section.3.frame.0.img") || "/assets/images/meet-yourself/connector/right slider/lowest/Creating lasting bonds..jpg", h: t("meetyourself1.connector.section.3.frame.0.h") || "Creating lasting bonds.", p: t("meetyourself1.connector.section.3.frame.0.p") || "Creating lasting bonds." },
        { img: t("meetyourself1.connector.section.3.frame.1.img") || "/assets/images/meet-yourself/connector/right slider/lowest/Everyone belongs..jpg", h: t("meetyourself1.connector.section.3.frame.1.h") || "Everyone belongs.", p: t("meetyourself1.connector.section.3.frame.1.p") || "Everyone belongs." },
        { img: t("meetyourself1.connector.section.3.frame.2.img") || "/assets/images/meet-yourself/connector/right slider/lowest/Creating lasting bonds..jpg", h: t("meetyourself1.connector.section.3.frame.2.h") || "Creating lasting bonds.", p: t("meetyourself1.connector.section.3.frame.2.p") || "Creating lasting bonds." },
      ],
      cta: { label: t("meetyourself1.connector.section.3.cta") || "Make your connections count →", href: "/signup" },
    },
  ], [t, language]);

  return (
    <div className="min-h-screen bg-[#F5FAF6] text-[#0B4422]">
      
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.drishiq.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Meet Yourself",
                "item": "https://www.drishiq.com/meet-yourself"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Connector",
                "item": "https://www.drishiq.com/meet-yourself/connector"
              }
            ]
          })
        }}
      />
      
      <main className="relative z-10">
        {/* Top band: celeb ticker */}
      <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200 relative z-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center gap-3 py-4 text-sm font-semibold text-gray-600">
              <Users size={20} className="text-emerald-600" />
              <span>{t("meetyourself1.connector.topband.label") || "Connector, not just networker — stories from known faces"}</span>
            </div>
            <div className="py-4">
              {/* Emotion tiles moved to hero section */}
            </div>
          </div>
          <CelebTickerV2 items={celebs} />
        </section>

      {/* Hero */}
      <section className="container mx-auto max-w-7xl px-4 pt-10">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-12 lg:col-span-7">
            <FM.h1 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.4 }} 
              className="text-4xl md:text-5xl font-extrabold flex items-center gap-4 text-gray-900"
            >
              <Users size={48} className="text-emerald-600" aria-hidden />
              {t("meetyourself1.connector.hero.title") || "Holding Voices Together"}
            </FM.h1>
            <FM.p 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.45, delay: 0.05 }} 
              className="mt-4 text-xl text-gray-600 leading-relaxed"
            >
              {t("meetyourself1.connector.hero.subtitle") || "You link people, spark opportunities, and turn strangers into allies. But in making sure everyone is connected, do you still feel seen yourself?"}
            </FM.p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ShinyButton href="/signup">{t("meetyourself1.connector.cta.early_access") || "Discover your connection patterns →"}</ShinyButton>
              <a 
                href="#how" 
                className="rounded-2xl px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
              >
                <div>{t("meetyourself1.connector.cta.how.label") || "How Drishiq helps"}</div>
                <div className="text-xs opacity-75 mt-1">{t("meetyourself1.connector.cta.how.sentence") || "See what works for connectors like you."}</div>
              </a>
            </div>
            <StirTicker lines={stirLines} />
          </div>
          
          {/* Emotion Cards on the Right */}
          <div className="md:col-span-12 lg:col-span-5">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl p-6 shadow-xl">
              <div className="py-2">
                <EmotionTiles items={emotionCards} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 text-sm font-semibold text-gray-600 justify-end">
              <Link2 size={20} className="text-blue-500" />
              <span>{t("meetyourself1.connector.emote.header") || "What connecting can feel like:"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sections loop */}
      {sections.map((s, index) => (
        <section key={s.title} className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
          {/* Headline row */}
          <div className="grid gap-4 md:grid-cols-12 items-start">
            <div className="md:col-span-7">
              <div className="flex items-baseline gap-4 mb-4">
                {(() => {
                  const IconComponent = sectionIconMap[s.emoji];
                  return IconComponent ? <IconComponent size={40} className="text-emerald-600" aria-hidden /> : <div className="text-4xl" aria-hidden>{s.emoji}</div>;
                })()}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{s.title}</h2>
              </div>
              <p className="text-lg text-gray-600">{s.line}</p>
            </div>
            <div className="md:col-span-5" />
          </div>

          {/* Content row: equal heights so right matches left box top & bottom */}
          <div className="mt-6 grid gap-8 md:grid-cols-12 items-stretch">
            {/* Left white box */}
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
                  <div className="text-lg font-semibold text-emerald-800 mb-2">{t("meetyourself1.connector.try_this") || t("meetyourself1.builder.try_this") || "Try this:"}</div>
                  <p className="text-emerald-700">{s.context.nudge}</p>
                </div>
              </div>
            </FM.div>

            {/* Right visual container: moving slider + separate button like builder page */}
            <div className="md:col-span-5 flex flex-col justify-start">
              {/* Moving image stream */}
              <div className="relative rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden w-full max-w-lg">
                <div className="relative h-[350px] w-full">
                  <StreamStrip frames={s.frames} />
                </div>
              </div>
              <div className="mt-6 w-full max-w-lg">
                <a 
                  href={s.cta.href} 
                  className="block w-full text-center rounded-2xl px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800 transform hover:-translate-y-1"
                >
                  {s.cta.label}
                </a>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Bridge / Invitation */}
      <section className="container mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 to-emerald-700 text-white p-6 md:p-8">
          <h3 className="text-2xl md:text-3xl font-bold">{t("meetyourself1.connector.bridge.title") || "You can connect without disappearing in the crowd."}</h3>
          <p className="mt-2 opacity-95">{t("meetyourself1.connector.bridge.body") || "Drishiq helps connectors honor their own presence while continuing to weave the bonds that strengthen others."}</p>
          <div className="mt-4">
            <a href="/signup" className="inline-flex items-center rounded-2xl bg-white text-[#0B4422] px-5 py-3 font-semibold shadow hover:shadow-md">{t("meetyourself1.connector.bridge.cta") || "Begin your clarity check →"}</a>
          </div>
        </div>
      </section>

      {/* How Drishiq Helps */}
      <section id="how" className="container mx-auto max-w-7xl px-4 py-8">
        <h3 className="text-2xl md:text-3xl font-semibold">{t("meetyourself1.connector.how.title") || "How Drishiq Makes a Difference"}</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {howDifferenceMakes.map((f, i) => {
            const IconComponent = howIconMap[f.icon];
            return (
            <FM.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.05 }} className="rounded-2xl bg-white border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              {IconComponent ? <IconComponent size={32} className="text-emerald-600 mb-3" /> : <div className="text-3xl mb-3">{f.icon}</div>}
              <div className="text-lg font-semibold text-gray-900 mb-2">{f.h}</div>
              <p className="text-sm text-gray-600 leading-relaxed">{f.d}</p>
            </FM.div>
          );
          })}
        </div>
      </section>

      </main>
      <Footer />

      {/* Local styles for ticker & stir ticker */}
      <style>{`
        :root { --drishiq-green:#0B4422; }
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
        @keyframes connector-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: connector-rtl 22s linear infinite; }
        
        /* StreamStrip styles */
        .stream-wrap { position: absolute; inset: 0; overflow: hidden; }
        .stream-track { display: flex; width: 200%; height: 100%; animation: stream-rtl 35s linear infinite; }
        .stream-track:hover { animation-play-state: paused; }
        .stream-item { position: relative; height: 100%; width: 500px; flex: 0 0 auto; }
        .stream-item img { height: 100%; width: 100%; object-fit: cover; }
        .stream-cap { position: absolute; inset-inline: 0.5rem; bottom: 0.5rem; color: white; padding: 0.5rem; border-radius: 0.75rem; background: linear-gradient(to top, rgba(11,68,34,.9), rgba(11,68,34,.4), transparent); }
        @keyframes stream-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}

// ---- Components ----
// Horizontal stream of images (R→L), duplicates frames for seamless loop
function StreamStrip({ frames }: { frames: any[] }) {
  const doubled = [...frames, ...frames];
  

  
  return (
    <div className="stream-wrap">
      <div className="stream-track">
        {doubled.map((f, idx) => (
          <figure key={idx} className="stream-item">
            <img 
              src={f.img} 
              alt={f.h}
            />
            <figcaption className="stream-cap">
              <div className="text-lg font-bold leading-tight">{f.p}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

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
    <section className="ticker-container border-t border-b border-gray-200 py-3">
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

function StirTicker({ lines }: { lines: string[] }) {
  const doubled = [...lines, ...lines];
  return (
    <div className="mt-8 border-y border-dashed border-gray-200 bg-white/60 rounded-2xl py-4">
      <div className="flex overflow-hidden">
        <div className="flex whitespace-nowrap w-[200%] animate-[solo-rtl_22s_linear_infinite]">
          {doubled.map((text, i) => (
            <span key={i} className="m-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm"><Sparkle size={14} className="text-amber-500" /> {text}</span>
          ))}
        </div>
      </div>
      <style>{`@keyframes solo-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function ShinyButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="relative inline-block rounded-2xl px-5 py-2.5 bg-[#0B4422] text-white shadow hover:shadow-xl transition overflow-hidden">
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shine_3.6s_infinite]" />
      <style>{`@keyframes shine{0%{transform:translateX(-120%)}60%{transform:translateX(120%)}100%{transform:translateX(120%)}}`}</style>
    </a>
  );
}