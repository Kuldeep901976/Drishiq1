'use client';

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";
import { Handshake, Smartphone, Search, MessageCircle, Compass, Scale, Sprout, Sparkles, Sparkle, Check, type LucideIcon } from 'lucide-react';

// Icon mappings for dynamic rendering
const sectionIconMap: Record<string, LucideIcon> = {
  "🤝": Handshake,
  "🧭": Compass,
  "⚖️": Scale,
  "🌱": Sprout,
};

const howIconMap: Record<string, LucideIcon> = {
  "🤝": Handshake,
  "📱": Smartphone,
  "🔍": Search,
  "💬": MessageCircle,
};

// Typed alias to allow FM.h1/FM.p/FM.div without TS errors
const FM: any = motion as any;

/**
 * DependentPage — takes direct reference from your SoloPage pattern
 * Structure:
 *  - Top band: hero tiles ABOVE the celeb ticker; ticker full width
 *  - Hero with emoji, headline, subcopy, primary CTA + secondary link
 *  - Stir ticker (chips style) under hero
 *  - Four content sections: left context (white box), right emotional visual offset by 30px, CTA below image
 *  - "How Drishik helps" feature grid
 *  - Footer note
 *
 * Color tokens mirror Solo (#0B4422 etc.).
 */

export default function DependentPage() {
  const { t, language } = useLanguage(['meetyourself1']);
  
  // --- Smoke test to guard against FM availability ---
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // === How Drishik Makes a Difference Section ===
  const howDifferenceMakes = useMemo(() => [
    { icon: "🤝", h: t("meetyourself1.dependent.how.0.h") || "Clarity Conversations", d: t("meetyourself1.dependent.how.0.d") || "Gentle prompts that turn fog into words — then into choices." },
    { icon: "📱", h: t("meetyourself1.dependent.how.1.h") || "You‑Pace Plans", d: t("meetyourself1.dependent.how.1.d") || "Small, stackable actions. No pressure, just momentum." },
    { icon: "🔍", h: t("meetyourself1.dependent.how.2.h") || "Pattern Finder", d: t("meetyourself1.dependent.how.2.d") || "Notice who and what truly fuels you. Nudge what matters." },
    { icon: "💬", h: t("meetyourself1.dependent.how.3.h") || "Check‑ins that Care", d: t("meetyourself1.dependent.how.3.d") || "Short, human‑sounding follow‑ups so progress feels supported, not policed." }
  ], [t]);

  // === Emotion Cards (6) ===
  const emotionCards = useMemo(() => [
    { t: t("meetyourself1.dependent.emote.0.title") || "Support", s: t("meetyourself1.dependent.emote.0.subtitle") || "Hands that steady" },
    { t: t("meetyourself1.dependent.emote.1.title") || "Trust", s: t("meetyourself1.dependent.emote.1.subtitle") || "Built in small acts" },
    { t: t("meetyourself1.dependent.emote.2.title") || "Space", s: t("meetyourself1.dependent.emote.2.subtitle") || "Love with air" },
    { t: t("meetyourself1.dependent.emote.3.title") || "Boundaries", s: t("meetyourself1.dependent.emote.3.subtitle") || "Kind and clear" },
    { t: t("meetyourself1.dependent.emote.4.title") || "Gratitude", s: t("meetyourself1.dependent.emote.4.subtitle") || "Thanks, not debt" },
    { t: t("meetyourself1.dependent.emote.5.title") || "Growth", s: t("meetyourself1.dependent.emote.5.subtitle") || "Updraft together" }
  ], [t]);

  // === Celebrity Ticker ===
  const celebA = t("meetyourself1.dependent.celeb.items", { returnObjects: true }) || [
    { img: "/assets/images/meet-yourself/dependent/celebs/maya_angelou.jpg", name: "Maya Angelou", profession: "Poet", source: "Interview", quote: "\"Nobody, but nobody, can make it out here alone.\"" },
    { img: "/assets/images/meet-yourself/dependent/celebs/Steve_Jobs.jpg", name: "Steve Jobs", profession: "Entrepreneur", source: "Talk", quote: "\"Great things in business are never done by one person.\"" },
    { img: "/assets/images/meet-yourself/dependent/celebs/Priyanka-chopra.jpg", name: "Priyanka Chopra Jonas", profession: "Actor", source: "TEDx", quote: "\"Leaning on others doesn't make you less — it makes you human.\"" },
    { img: "/assets/images/meet-yourself/dependent/celebs/Stephen_Hawking.jpg", name: "Stephen Hawking", profession: "Physicist", source: "Lecture", quote: "\"We are all now connected, like neurons in a giant brain.\"" },
    { img: "/assets/images/meet-yourself/dependent/celebs/Sachin_Tendulkar.jpg", name: "Sachin Tendulkar", profession: "Cricketer", source: "Press", quote: "\"I owe my success to the people who stood by me.\"" }
  ];
  const celebs = Array.isArray(celebA) ? [...celebA, ...celebA] : [];

  // === Context sections (DEPENDENT) ===
  const sections = useMemo(() => [
    {
      emoji: "🤝",
      title: t("meetyourself1.dependent.section.0.title") || "The Comfort of Connection",
      line: t("meetyourself1.dependent.section.0.line") || "Warmth that steadies. Routines that root.",
      context: {
        body: t("meetyourself1.dependent.section.0.body") || "Shared routines, inside jokes, someone to check in at the end of the day — these bonds keep you grounded. But comfort can also become a shield that keeps you from growing.",
        bullets: [
          t("meetyourself1.dependent.section.0.bullet.0") || "You lean on a small circle for most decisions.",
          t("meetyourself1.dependent.section.0.bullet.1") || "You feel anchored — and sometimes hesitant to step out.",
          t("meetyourself1.dependent.section.0.bullet.2") || "You say yes by default to keep peace."
        ],
        nudge: t("meetyourself1.dependent.section.0.nudge") || "List two supports that energize you and one that quietly drains you. Keep the first two close; redesign the third."
      },
      frames: [
        { img: "/assets/images/meet-yourself/dependent/right slider/top/Their rock in storms.jpeg", h: t("meetyourself1.dependent.section.0.frame.0.h") || "Their rock in storms", p: t("meetyourself1.dependent.section.0.frame.0.p") || "Their rock in storms" },
        { img: "/assets/images/meet-yourself/dependent/right slider/top/You hold others up..jpg", h: t("meetyourself1.dependent.section.0.frame.1.h") || "You hold others up", p: t("meetyourself1.dependent.section.0.frame.1.p") || "You hold others up" },
        { img: "/assets/images/meet-yourself/dependent/right slider/top/Their rock in storms.jpeg", h: t("meetyourself1.dependent.section.0.frame.2.h") || "Their rock in storms", p: t("meetyourself1.dependent.section.0.frame.2.p") || "Their rock in storms" }
      ],
      cta: { label: t("meetyourself1.dependent.section.0.cta.label") || "Map energizing supports →", sentence: t("meetyourself1.dependent.section.0.cta.sentence") || "Some hands help you grow, some hold you back.", href: "/signup" }
    },
    {
      emoji: "🧭",
      title: t("meetyourself1.dependent.section.1.title") || "Boundaries Within Bonds",
      line: t("meetyourself1.dependent.section.1.line") || "Closeness with air. Love with space.",
      context: {
        body: t("meetyourself1.dependent.section.1.body") || "Every healthy dependency has invisible lines. Too much reliance can blur them, too much distance can break them. Redrawing lines with clarity keeps trust from turning into tension.",
        bullets: [
          t("meetyourself1.dependent.section.1.bullet.0") || "You apologize for taking time alone.",
          t("meetyourself1.dependent.section.1.bullet.1") || "You share passwords, calendars, plans by habit.",
          t("meetyourself1.dependent.section.1.bullet.2") || "Saying 'no' feels like a threat to the relationship."
        ],
        nudge: t("meetyourself1.dependent.section.1.nudge") || "Write one boundary as a kind promise: 'I’ll reply after 7pm tomorrow. I want to give this my best mind.'"
      },
      frames: [
        { img: "/assets/images/meet-yourself/dependent/right slider/medium/Keeping them safe..jpeg", h: t("meetyourself1.dependent.section.1.frame.0.h") || "Keeping them safe", p: t("meetyourself1.dependent.section.1.frame.0.p") || "Keeping them safe" },
        { img: "/assets/images/meet-yourself/dependent/right slider/medium/Their success is yours..png", h: t("meetyourself1.dependent.section.1.frame.1.h") || "Their success is yours", p: t("meetyourself1.dependent.section.1.frame.1.p") || "Their success is yours" },
        { img: "/assets/images/meet-yourself/dependent/right slider/medium/Keeping them safe..jpeg", h: t("meetyourself1.dependent.section.1.frame.2.h") || "Keeping them safe", p: t("meetyourself1.dependent.section.1.frame.2.p") || "Keeping them safe" }
      ],
      cta: { label: t("meetyourself1.dependent.section.1.cta.label") || "Write one kind boundary →", sentence: t("meetyourself1.dependent.section.1.cta.sentence") || "Boundaries don't destroy love. They purify it.", href: "/signup" }
    },
    {
      emoji: "⚖️",
      title: t("meetyourself1.dependent.section.2.title") || "The Weight of Expectations",
      line: t("meetyourself1.dependent.section.2.line") || "Gratitude is not a contract.",
      context: {
        body: t("meetyourself1.dependent.section.2.body") || "Sometimes support comes with strings — obligations you didn't sign up for. It's not selfish to ask where the giving ends and the living begins.",
        bullets: [
          t("meetyourself1.dependent.section.2.bullet.0") || "You keep receipts of favors (theirs or yours).",
          t("meetyourself1.dependent.section.2.bullet.1") || "You say 'sorry' for needs that are human.",
          t("meetyourself1.dependent.section.2.bullet.2") || "You worry love will be withdrawn if you set limits."
        ],
        nudge: t("meetyourself1.dependent.section.2.nudge") || "Write a thank-you that doesn't promise payback: 'Thank you for being there. It meant a lot.' Period."
      },
      frames: [
        { img: "/assets/images/meet-yourself/dependent/right slider/lower/Finding your limits..jpeg", h: t("meetyourself1.dependent.section.2.frame.0.h") || "Finding your limits", p: t("meetyourself1.dependent.section.2.frame.0.p") || "Finding your limits" },
        { img: "/assets/images/meet-yourself/dependent/right slider/lower/Love with wisdom..jpg", h: t("meetyourself1.dependent.section.2.frame.1.h") || "Love with wisdom", p: t("meetyourself1.dependent.section.2.frame.1.p") || "Love with wisdom" },
        { img: "/assets/images/meet-yourself/dependent/right slider/lower/Finding your limits..jpeg", h: t("meetyourself1.dependent.section.2.frame.2.h") || "Finding your limits", p: t("meetyourself1.dependent.section.2.frame.2.p") || "Finding your limits" }
      ],
      cta: { label: t("meetyourself1.dependent.section.2.cta.label") || "Practice clean gratitude →", sentence: t("meetyourself1.dependent.section.2.cta.sentence") || "Gratitude is not a debt. It's a deep breath.", href: "/signup" }
    },
    {
      emoji: "🌱",
      title: t("meetyourself1.dependent.section.3.title") || "Mutual Growth",
      line: t("meetyourself1.dependent.section.3.line") || "Reliance that becomes resilience.",
      context: {
        body: t("meetyourself1.dependent.section.3.body") || "Dependence can be a launchpad when it's built on respect and shared progress. When you grow, your connections grow too.",
        bullets: [
          t("meetyourself1.dependent.section.3.bullet.0") || "You celebrate skills, not just favors.",
          t("meetyourself1.dependent.section.3.bullet.1") || "You ask 'What helps you grow?' as often as 'Can you help me?'.",
          t("meetyourself1.dependent.section.3.bullet.2") || "You turn support into shared momentum."
        ],
        nudge: t("meetyourself1.dependent.section.3.nudge") || "Ask one person this week: 'What's one small way I can back your goal?' Then do it."
      },
      frames: [
        { img: "/assets/images/meet-yourself/dependent/right slider/lowest/Stronger as a team..jpg", h: t("meetyourself1.dependent.section.3.frame.0.h") || "Stronger as a team", p: t("meetyourself1.dependent.section.3.frame.0.p") || "Stronger as a team" },
        { img: "/assets/images/meet-yourself/dependent/right slider/lowest/Walking side by side..jpg", h: t("meetyourself1.dependent.section.3.frame.1.h") || "Walking side by side", p: t("meetyourself1.dependent.section.3.frame.1.p") || "Walking side by side" },
        { img: "/assets/images/meet-yourself/dependent/right slider/lowest/Stronger as a team..jpg", h: t("meetyourself1.dependent.section.3.frame.2.h") || "Stronger as a team", p: t("meetyourself1.dependent.section.3.frame.2.p") || "Stronger as a team" }
      ],
      cta: { label: t("meetyourself1.dependent.section.3.cta.label") || "Make growth mutual →", sentence: t("meetyourself1.dependent.section.3.cta.sentence") || "Real strength isn't what you build alone. It's what you can build together.", href: "/signup" }
    }
  ], [t, language]);

  const stirLines = useMemo(() => [
    t("meetyourself1.dependent.stir.line.0") || "Who steadies you—and who steers you?",
    t("meetyourself1.dependent.stir.line.1") || "Are your yes's chosen or automatic?",
    t("meetyourself1.dependent.stir.line.2") || "Where does care feel heavy?",
    t("meetyourself1.dependent.stir.line.3") || "What boundary would make you kinder?",
    t("meetyourself1.dependent.stir.line.4") || "Which support fuels real growth?"
  ], [t]);

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
                "name": "Dependent",
                "item": "https://www.drishiq.com/meet-yourself/dependent"
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
              <Handshake size={20} className="text-emerald-600" />
              <span>{t("meetyourself1.dependent.topband.label") || "Dependent, not diminished — stories from known faces"}</span>
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
              <Handshake size={48} className="text-emerald-600" aria-hidden />
              {t("meetyourself1.dependent.hero.title") || "Dependent, By Design"}
            </FM.h1>
            <FM.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.05 }} className="mt-2 text-lg opacity-90">
              {t("meetyourself1.dependent.hero.subtitle") || "Interdependence isn't a flaw. It's how humans move — together. The art is knowing which ties lift you, and which ones quietly tie you down."}
            </FM.p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ShinyButton href="/signup">{t("meetyourself1.dependent.cta.early_access") || "Check your dependency map"}</ShinyButton>
              <a 
                href="#how" 
                className="rounded-2xl px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
              >
                {t("meetyourself1.dependent.cta.how") || "How Drishik helps"}
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
              <Sparkles size={20} className="text-amber-500" />
              <span>{t("meetyourself1.dependent.emote.header") || "What dependency can feel like"}</span>
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
                  {s.context.bullets.map((b: string, idx: number) => (
                    <li key={idx} className="text-base">{b}</li>
                  ))}
                </ul>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6">
                  <div className="text-lg font-semibold text-emerald-800 mb-2">{t("meetyourself1.dependent.try_this") || t("meetyourself1.builder.try_this") || "Try this:"}</div>
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
                  <div className="font-bold">{s.cta.label}</div>
                  <div className="text-sm opacity-90 mt-1">{s.cta.sentence}</div>
                </a>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Bridge / Invitation */}
      <section className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">{t("meetyourself1.dependent.bridge.title") || "Interdependence Can Be Your Strength"}</h3>
            <p className="text-xl opacity-95 leading-relaxed">{t("meetyourself1.dependent.bridge.body") || "Drishik helps you recognize the support that empowers you — not the connections that bind. Because healthy interdependence means leaning on others without losing yourself."}</p>
            <div className="mt-8">
              <a 
                href="/signup" 
                className="inline-flex items-center rounded-2xl bg-white text-emerald-800 px-8 py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 transform hover:-translate-y-1"
              >
                {t("meetyourself1.dependent.bridge.cta") || "Start your clarity journey →"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How Drishik helps */}
      <section id="how" className="container mx-auto max-w-7xl px-4 py-8">
        <h3 className="text-2xl md:text-3xl font-semibold">{t("meetyourself1.dependent.how.title") || "How Drishik Makes a Difference"}</h3>
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

      {/* Local styles for the celebrity ticker & stir ticker */}
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
        @keyframes dep-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: dep-rtl 22s linear infinite; }
        
        /* StreamStrip styles */
        .stream-wrap { overflow: hidden; height: 100%; }
        .stream-track { display: flex; height: 100%; animation: stream-rtl 20s linear infinite; }
        .stream-item { flex: none; width: 100%; height: 100%; position: relative; }
        .stream-item img { width: 100%; height: 100%; object-fit: cover; }
        .stream-cap { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); color: white; padding: 1rem; }
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

function ShinyButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="relative inline-block rounded-2xl px-5 py-2.5 bg-[#0B4422] text-white shadow hover:shadow-xl transition overflow-hidden">
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shine_3.6s_infinite]" />
      <style>{`@keyframes shine{0%{transform:translateX(-120%)}60%{transform:translateX(120%)}100%{transform:translateX(120%)}}`}</style>
    </a>
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

function HeroTiles() {
  const items = [
    { t: "Support", s: "Hands that steady" },
    { t: "Trust", s: "Built in small acts" },
    { t: "Space", s: "Love with air" },
    { t: "Boundaries", s: "Kind and clear" },
    { t: "Gratitude", s: "Thanks, not debt" },
    { t: "Growth", s: "Updraft together" }
  ];
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