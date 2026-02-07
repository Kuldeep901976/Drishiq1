"use client";

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";
import { DoorOpen, Theater, Zap, Compass, Map, Sprout, Search, Dumbbell, Sparkle, Check, type LucideIcon } from 'lucide-react';

// Icon mappings for dynamic rendering
const sectionIconMap: Record<string, LucideIcon> = {
  "🚪": DoorOpen,
  "🎭": Theater,
  "⚡": Zap,
  "🧭": Compass,
};

const howIconMap: Record<string, LucideIcon> = {
  "🗺️": Map,
  "🌱": Sprout,
  "🔍": Search,
  "💪": Dumbbell,
};

const FM: any = motion as any;

export default function EscaperPage() {
  const { t, language } = useLanguage(['meetyourself2']);
  
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // Helper function to safely extract string from translation (handles objects)
  const getString = useMemo(() => (key: string, fallback: string = ""): string => {
    const result = t(key);
    // If it's already a string, return it (or fallback if empty)
    if (typeof result === 'string') {
      return result || fallback;
    }
    // If it's an object, try to extract string from common properties
    if (result && typeof result === 'object') {
      if ('label' in result && typeof result.label === 'string') return result.label;
      if ('sentence' in result && typeof result.sentence === 'string') return result.sentence;
      if ('h' in result && typeof result.h === 'string') return result.h;
      if ('d' in result && typeof result.d === 'string') return result.d;
      // If it's an object but we can't extract a string, return fallback
      return fallback;
    }
    // If result is undefined, null, or empty, return fallback
    return fallback;
  }, [t, language]);

  // === Stir lines under headline ===
  const stirLines: string[] = useMemo(() => [
    t("meetyourself2.escaper.stir.line.0") || "Do you change jobs, relationships, or cities when things get tough?",
    t("meetyourself2.escaper.stir.line.1") || "Do you fill your days with noise to avoid certain thoughts?",
    t("meetyourself2.escaper.stir.line.2") || "Do you often feel relief now, but dread later?",
    t("meetyourself2.escaper.stir.line.3") || "Patterns keep repeating no matter where you go?",
    t("meetyourself2.escaper.stir.line.4") || "What would happen if you stopped running for a moment?",
  ], [t, language]);

  // === Quick Emotion Cards (6) ===
  const emotionCards = useMemo(() => [
    { t: t("meetyourself2.escaper.emote.0.title") || "Relieved", s: t("meetyourself2.escaper.emote.0.subtitle") || "The rush of being away" },
    { t: t("meetyourself2.escaper.emote.1.title") || "Anxious", s: t("meetyourself2.escaper.emote.1.subtitle") || "Fear of being pulled back" },
    { t: t("meetyourself2.escaper.emote.2.title") || "Restless", s: t("meetyourself2.escaper.emote.2.subtitle") || "Always scanning for the next exit" },
    { t: t("meetyourself2.escaper.emote.3.title") || "Exhausted", s: t("meetyourself2.escaper.emote.3.subtitle") || "From constant change" },
    { t: t("meetyourself2.escaper.emote.4.title") || "Numb", s: t("meetyourself2.escaper.emote.4.subtitle") || "Avoiding feelings altogether" },
    { t: t("meetyourself2.escaper.emote.5.title") || "Hopeful", s: t("meetyourself2.escaper.emote.5.subtitle") || "Wishing the next place will be different" },
  ], [t, language]);

  // === Celebrity Ticker ===
  const celebs = useMemo(() => {
    const celebItems = [];
    for (let i = 0; i < 5; i++) {
      const name = t(`meetyourself2.escaper.celeb.${i}.name`);
      const profession = t(`meetyourself2.escaper.celeb.${i}.profession`);
      const quote = t(`meetyourself2.escaper.celeb.${i}.quote`);
      
      const defaultNames = ["Cheryl Strayed", "Nelson Mandela", "Elizabeth Gilbert", "Anthony Bourdain", "Brené Brown"];
      const defaultProfessions = ["Author", "Leader", "Author", "Chef & Traveler", "Researcher"];
      const defaultQuotes = [
        "\"You can't ride to the fair unless you get on the pony.\"",
        "\"Courage is not the absence of fear — it's inspiring others to move beyond it.\"",
        "\"Select your thoughts like you select your clothes.\"",
        "\"Travel isn't always pretty... The journey changes you.\"",
        "\"Choose courage or comfort — not both.\""
      ];
      const imageNames = ['Cheryl_Strayed', 'Nelson_Mandela', 'Elizabeth_Gilbert', 'Anthony_Bourdain', 'Brené_Brown'];
      
      celebItems.push({
        img: `/assets/images/meet-yourself/escaper/celebs/${imageNames[i]}.jpg`,
        name: (typeof name === 'string' && name.trim() !== '') ? name : defaultNames[i],
        profession: (typeof profession === 'string' && profession.trim() !== '') ? profession : defaultProfessions[i],
        source: "Quote",
        quote: (typeof quote === 'string' && quote.trim() !== '') ? quote : defaultQuotes[i]
      });
    }
    
    return [...celebItems, ...celebItems];
  }, [t, language]);

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
      emoji: "🚪",
      title: t("meetyourself2.escaper.section.0.title") || "The Comfort of the Exit",
      line: t("meetyourself2.escaper.section.0.line") || "Leaving feels like winning — until it doesn't.",
      context: {
        body: t("meetyourself2.escaper.section.0.body") || "There's a lightness in walking away. You convince yourself the problem was 'there,' not 'here.' But without facing it, it quietly follows you.",
        bullets: [
          t("meetyourself2.escaper.section.0.bullet.0") || "You avoid conflict by disappearing from situations.",
          t("meetyourself2.escaper.section.0.bullet.1") || "You cut off relationships without explanation.",
          t("meetyourself2.escaper.section.0.bullet.2") || "You change your environment often to feel better.",
        ],
        nudge: t("meetyourself2.escaper.section.0.nudge") || "Write down the last three big changes you made — and note what you were avoiding at the time.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/escaper/right slider/top/The easy way out..jpg", h: t("meetyourself2.escaper.section.0.frame.0.h") || "The easy way out", p: t("meetyourself2.escaper.section.0.frame.0.p") || "The easy way out" },
        { img: "/assets/images/meet-yourself/escaper/right slider/top/Ready to go..jpeg", h: t("meetyourself2.escaper.section.0.frame.1.h") || "Ready to go", p: t("meetyourself2.escaper.section.0.frame.1.p") || "Ready to go" },
        { img: "/assets/images/meet-yourself/escaper/right slider/top/The easy way out..jpg", h: t("meetyourself2.escaper.section.0.frame.2.h") || "The easy way out", p: t("meetyourself2.escaper.section.0.frame.2.p") || "The easy way out" },
      ],
      cta: (() => {
        const ctaResult = t("meetyourself2.escaper.section.0.cta");
        const label = typeof ctaResult === 'object' && ctaResult && 'label' in ctaResult 
          ? String(ctaResult.label) 
          : (typeof ctaResult === 'string' ? ctaResult : "Spot your escape triggers →");
        return { label, href: "/signup" };
      })(),
    },
    {
      emoji: "🎭",
      title: t("meetyourself2.escaper.section.1.title") || "Escaping in Disguise",
      line: t("meetyourself2.escaper.section.1.line") || "Sometimes running looks like chasing.",
      context: {
        body: t("meetyourself2.escaper.section.1.body") || "Not all escapes are obvious. You might 'pursue opportunity' or 'seek adventure,' but deep down it's about avoiding the hard thing.",
        bullets: [
          t("meetyourself2.escaper.section.1.bullet.0") || "You constantly change focus when things get uncomfortable.",
          t("meetyourself2.escaper.section.1.bullet.1") || "You dive into new hobbies or work to distract from personal issues.",
          t("meetyourself2.escaper.section.1.bullet.2") || "You hide your avoidance behind ambition.",
        ],
        nudge: t("meetyourself2.escaper.section.1.nudge") || "Ask yourself: 'If I couldn't leave or distract myself, what would I have to face?'",
      },
      frames: [
        { img: "/assets/images/meet-yourself/escaper/right slider/medium/Disguised as options..png", h: t("meetyourself2.escaper.section.1.frame.0.h") || "Disguised as options", p: t("meetyourself2.escaper.section.1.frame.0.p") || "Disguised as options" },
        { img: "/assets/images/meet-yourself/escaper/right slider/medium/Busyness as shield..jpg", h: t("meetyourself2.escaper.section.1.frame.1.h") || "Busyness as shield", p: t("meetyourself2.escaper.section.1.frame.1.p") || "Busyness as shield" },
        { img: "/assets/images/meet-yourself/escaper/right slider/medium/Disguised as options..png", h: t("meetyourself2.escaper.section.1.frame.2.h") || "Disguised as options", p: t("meetyourself2.escaper.section.1.frame.2.p") || "Disguised as options" },
      ],
      cta: (() => {
        const ctaResult = t("meetyourself2.escaper.section.1.cta");
        const label = typeof ctaResult === 'object' && ctaResult && 'label' in ctaResult 
          ? String(ctaResult.label) 
          : (typeof ctaResult === 'string' ? ctaResult : "Tell the truth about your moves →");
        return { label, href: "/signup" };
      })(),
    },
    {
      emoji: "⚡",
      title: t("meetyourself2.escaper.section.2.title") || "The High Cost of Constant Motion",
      line: t("meetyourself2.escaper.section.2.line") || "Running drains more than it saves.",
      context: {
        body: t("meetyourself2.escaper.section.2.body") || "Each escape takes energy — packing, planning, adjusting. You leave behind not just problems, but roots, relationships, and growth.",
        bullets: [
          t("meetyourself2.escaper.section.2.bullet.0") || "You feel exhausted despite 'starting fresh.'",
          t("meetyourself2.escaper.section.2.bullet.1") || "You miss people or opportunities you left.",
          t("meetyourself2.escaper.section.2.bullet.2") || "You sense you're always in the beginning phase of life.",
        ],
        nudge: t("meetyourself2.escaper.section.2.nudge") || "List one thing you've lost from each escape — and ask if it was worth the relief.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/escaper/right slider/lower/Missing connections..jpg", h: t("meetyourself2.escaper.section.2.frame.0.h") || "Missing connections", p: t("meetyourself2.escaper.section.2.frame.0.p") || "Missing connections" },
        { img: "/assets/images/meet-yourself/escaper/right slider/lower/Growth interrupted..jpg", h: t("meetyourself2.escaper.section.2.frame.1.h") || "Growth interrupted", p: t("meetyourself2.escaper.section.2.frame.1.p") || "Growth interrupted" },
        { img: "/assets/images/meet-yourself/escaper/right slider/lower/Missing connections..jpg", h: t("meetyourself2.escaper.section.2.frame.2.h") || "Missing connections", p: t("meetyourself2.escaper.section.2.frame.2.p") || "Missing connections" },
      ],
      cta: (() => {
        const ctaResult = t("meetyourself2.escaper.section.2.cta");
        const label = typeof ctaResult === 'object' && ctaResult && 'label' in ctaResult 
          ? String(ctaResult.label) 
          : (typeof ctaResult === 'string' ? ctaResult : "Keep what matters →");
        return { label, href: "/signup" };
      })(),
    },
    {
      emoji: "🧭",
      title: t("meetyourself2.escaper.section.3.title") || "Facing Instead of Fleeing",
      line: t("meetyourself2.escaper.section.3.line") || "Freedom comes from resolution, not relocation.",
      context: {
        body: t("meetyourself2.escaper.section.3.body") || "Sometimes the only way forward is through. Facing discomfort, naming the truth, and choosing to stay can break the loop.",
        bullets: [
          t("meetyourself2.escaper.section.3.bullet.0") || "You've begun to see patterns in your escapes.",
          t("meetyourself2.escaper.section.3.bullet.1") || "You're tired of starting over.",
          t("meetyourself2.escaper.section.3.bullet.2") || "You're curious what would happen if you stayed.",
        ],
        nudge: t("meetyourself2.escaper.section.3.nudge") || "Commit to facing one small discomfort this week without leaving.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/escaper/right slider/lowest/New perspective..jpg", h: t("meetyourself2.escaper.section.3.frame.0.h") || "New perspective", p: t("meetyourself2.escaper.section.3.frame.0.p") || "New perspective" },
        { img: "/assets/images/meet-yourself/escaper/right slider/lowest/Roots in place..jpeg", h: t("meetyourself2.escaper.section.3.frame.1.h") || "Roots in place", p: t("meetyourself2.escaper.section.3.frame.1.p") || "Roots in place" },
        { img: "/assets/images/meet-yourself/escaper/right slider/lowest/New perspective..jpg", h: t("meetyourself2.escaper.section.3.frame.2.h") || "New perspective", p: t("meetyourself2.escaper.section.3.frame.2.p") || "New perspective" },
      ],
      cta: (() => {
        const ctaResult = t("meetyourself2.escaper.section.3.cta");
        const label = typeof ctaResult === 'object' && ctaResult && 'label' in ctaResult 
          ? String(ctaResult.label) 
          : (typeof ctaResult === 'string' ? ctaResult : "Choose courage over comfort →");
        return { label, href: "/signup" };
      })(),
    },
  ], [t, language]);

  return (
    <div className="min-h-screen bg-[#F5FAF6] text-[#0B4422]">
      <main>
        {/* Top Band */}
        <div className="container mx-auto max-w-7xl px-4 py-4 text-center">
          <p className="text-sm md:text-base font-semibold text-[#0B4422]">
            {t("meetyourself2.escaper.topband.label") || "Escapers, Not Just Runners — Stories of Known Faces"}
          </p>
        </div>

        {/* Hero */}
        <section className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {t("meetyourself2.escaper.hero.title") || "Escaping the Storm"}
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
              {t("meetyourself2.escaper.hero.subtitle") || "You leave, avoid, switch, scroll — anything to not face the heavy stuff. But every exit door seems to lead back to the same room."}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <ShinyButton href="/signup">
                {t("meetyourself2.escaper.cta.early_access") || "See your escape patterns →"}
              </ShinyButton>
              <a href="#how" className="inline-block rounded-2xl px-5 py-2.5 bg-white border border-gray-300 text-[#0B4422] hover:bg-gray-50 transition">
                {t("meetyourself2.escaper.cta.how.label") || "How Drishiq Helps"}
              </a>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {t("meetyourself2.escaper.cta.how.sentence") || "Understand your patterns. Build your courage."}
            </p>
          </div>
        </section>

        {/* Stir Ticker */}
        <StirTicker lines={stirLines} />

        {/* Emotion Cards */}
        <section className="container mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">
            {t("meetyourself2.escaper.emote_header") || "How Escaping Might Feel"}
          </h2>
          <EmotionTiles items={emotionCards} />
        </section>

        {/* Celebrity Ticker */}
        <CelebTickerV2 items={celebs} />

        {/* Main Content Sections */}
        {sections.map((sec, idx) => (
          <section key={idx} className={`container mx-auto max-w-7xl px-4 py-12 ${idx % 2 === 1 ? 'bg-white/50' : ''}`}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className={idx % 2 === 1 ? 'md:order-2' : ''}>
                {(() => {
                  const IconComponent = sectionIconMap[sec.emoji];
                  return IconComponent ? <IconComponent size={40} className="text-emerald-600 mb-4" /> : <div className="text-4xl mb-4">{sec.emoji}</div>;
                })()}
                <h2 className="text-3xl md:text-4xl font-bold mb-2">{sec.title}</h2>
                <p className="text-xl text-gray-600 mb-6">{sec.line}</p>
                <p className="text-gray-700 mb-6 leading-relaxed">{sec.context.body}</p>
                <ul className="space-y-3 mb-6">
                  {sec.context.bullets.map((bullet, i) => (
                    <li key={i} className="flex gap-3">
                      <Check size={18} className="text-emerald-600 flex-shrink-0 mt-1" />
                      <span className="text-gray-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>{t("meetyourself2.escaper.try_this") || "Try this:"}</strong> {sec.context.nudge}
                  </p>
                </div>
                <ShinyButton href={sec.cta.href}>{sec.cta.label}</ShinyButton>
              </div>
              <div className={`relative h-96 rounded-2xl overflow-hidden shadow-xl ${idx % 2 === 1 ? 'md:order-1' : ''}`}>
                <StreamStrip frames={sec.frames} />
              </div>
            </div>
          </section>
        ))}

        {/* Bridge Section */}
        <section className="container mx-auto max-w-7xl px-4 py-12 bg-[#0B4422] text-white rounded-3xl my-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("meetyourself2.escaper.bridge.title") || "You can start fresh without leaving every time."}
            </h2>
            <p className="text-lg mb-8 leading-relaxed">
              {t("meetyourself2.escaper.bridge.body") || "Drishiq helps you understand your escape patterns and learn to stay with courage."}
            </p>
            <a href="/signup" className="inline-block rounded-2xl px-5 py-2.5 bg-white text-[#0B4422] font-semibold hover:bg-gray-100 transition">
              {t("meetyourself2.escaper.bridge.cta") || "Start your clarity check →"}
            </a>
          </div>
        </section>

        {/* How Drishiq Helps */}
        <section id="how" className="container mx-auto max-w-7xl px-4 py-12">
          <h3 className="text-2xl md:text-3xl font-semibold mb-8">
            {t("meetyourself2.escaper.how.title") || "How Drishiq Helps"}
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: "🗺️", h: t("meetyourself2.escaper.how.0.h") || "Pattern Mapping", d: t("meetyourself2.escaper.how.0.d") || "Identify your escape triggers and cycles." },
              { icon: "🌱", h: t("meetyourself2.escaper.how.1.h") || "Courage Practice", d: t("meetyourself2.escaper.how.1.d") || "Small steps to face discomfort." },
              { icon: "🔍", h: t("meetyourself2.escaper.how.2.h") || "Grounding Tools", d: t("meetyourself2.escaper.how.2.d") || "Stay when the urge to run is strong." },
              { icon: "💪", h: t("meetyourself2.escaper.how.3.h") || "Resolution Strategies", d: t("meetyourself2.escaper.how.3.d") || "Learn to solve problems instead of avoiding them." },
            ].map((f, i) => {
              const IconComponent = howIconMap[f.icon];
              return (
              <FM.div 
                key={i} 
                initial={{ opacity: 0, y: 8 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ duration: 0.35, delay: i * 0.05 }} 
                className="rounded-2xl bg-white border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {IconComponent ? <IconComponent size={32} className="text-emerald-600 mb-3" /> : <div className="text-3xl mb-3">{f.icon}</div>}
                <div className="text-xl font-bold text-gray-900 mb-3">{f.h}</div>
                <p className="text-gray-600 leading-relaxed">{f.d}</p>
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
        @keyframes esc-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: esc-rtl 22s linear infinite; }
        
        /* Stream strip (R→L) */
        @keyframes stream-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stream-wrap { position: absolute; inset: 0; overflow: hidden; }
        .stream-track { display:flex; width:200%; height:100%; animation: stream-rtl 35s linear infinite; }
        .stream-track:hover { animation-play-state: paused; }
        .stream-item { position: relative; height:100%; width: 500px; flex: 0 0 auto; }
        .stream-item img { height:100%; width:100%; object-fit: cover; }
        .stream-cap { position:absolute; inset-inline:0.5rem; bottom:0.5rem; color:white; padding:0.5rem; border-radius:0.75rem; background: linear-gradient(to top, rgba(11,68,34,.9), rgba(11,68,34,.4), transparent); }
        .stream-cap .text-sm { font-size: 16px; }
        .stream-cap .text-xs { font-size: 14px; }
      `}</style>
    </div>
  );
}

// ---- Components ----
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