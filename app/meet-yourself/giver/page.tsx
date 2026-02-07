"use client";

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";
import { LifeBuoy, HeartHandshake, Anchor, Coffee, Construction, Map, BatteryCharging, Shield, MessageCircle, Check, Sparkle, type LucideIcon } from 'lucide-react';

// Icon mappings for dynamic rendering
const sectionIconMap: Record<string, LucideIcon> = {
  "⚓": Anchor,
  "☕": Coffee,
  "🚧": Construction,
  "🫶": HeartHandshake,
};

const howIconMap: Record<string, LucideIcon> = {
  "🗺️": Map,
  "🔋": BatteryCharging,
  "🛡️": Shield,
  "💬": MessageCircle,
};

const FM: any = motion as any;

export default function SupportGiverPage() {
  const { t, language } = useLanguage(['meetyourself2']);
  
  useEffect(() => {
    console.assert(!!FM, "[Smoke Test] Using framer-motion if present; otherwise falling back to plain elements.");
  }, []);

  // Helper function to safely extract string from translation (handles objects)
  const getString = (key: string, fallback: string = ""): string => {
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
  };

  // === Stir lines under headline ===
  const stirLines: string[] = useMemo(() => [
    t("meetyourself2.giver.stir.line.0") || "When did you last ask for help?",
    t("meetyourself2.giver.stir.line.1") || "Do you feel tired more than you feel appreciated?",
    t("meetyourself2.giver.stir.line.2") || "How often do you say 'I'm fine' when you're not?",
    t("meetyourself2.giver.stir.line.3") || "Does helping still feel good, or just expected?",
    t("meetyourself2.giver.stir.line.4") || "Where do you put your own dreams when others need you?",
  ], [t, language]);

  // === Quick Emotion Cards (6) ===
  const emotionCards = useMemo(() => [
    { t: t("meetyourself2.giver.emote.0.title") || "Strong", s: t("meetyourself2.giver.emote.0.subtitle") || "Steady for everyone" },
    { t: t("meetyourself2.giver.emote.1.title") || "Invisible", s: t("meetyourself2.giver.emote.1.subtitle") || "Forgotten in the background" },
    { t: t("meetyourself2.giver.emote.2.title") || "Proud", s: t("meetyourself2.giver.emote.2.subtitle") || "Being the one who can handle it" },
    { t: t("meetyourself2.giver.emote.3.title") || "Drained", s: t("meetyourself2.giver.emote.3.subtitle") || "Energy scattered across others" },
    { t: t("meetyourself2.giver.emote.4.title") || "Protective", s: t("meetyourself2.giver.emote.4.subtitle") || "Shielding the people you love" },
    { t: t("meetyourself2.giver.emote.5.title") || "Lonely", s: t("meetyourself2.giver.emote.5.subtitle") || "Few know how much you hold" },
  ], [t, language]);

  // === Celebrity Ticker ===
  const celebs = useMemo(() => {
    const celebItems = [];
    for (let i = 0; i < 5; i++) {
      const name = t(`meetyourself2.giver.celeb.${i}.name`);
      const profession = t(`meetyourself2.giver.celeb.${i}.profession`);
      const quote = t(`meetyourself2.giver.celeb.${i}.quote`);
      
      const defaultNames = ["Princess Diana", "Mahatma Gandhi", "Michelle Obama", "Fred Rogers", "Dalai Lama"];
      const defaultProfessions = ["Humanitarian", "Leader", "Former First Lady", "TV Host", "Spiritual Leader"];
      const defaultQuotes = [
        "\"Carry out a random act of kindness, with no expectation of reward.\"",
        "\"The best way to find yourself is to lose yourself in the service of others.\"",
        "\"You can't pour from an empty cup. Take care of yourself first.\"",
        "\"Look for the helpers. You will always find people who are helping.\"",
        "\"Our prime purpose in this life is to help others. And if you can't help them, at least don't hurt them.\""
      ];
      const imageNames = ['Diana_Princess', 'Mahatma-Gandhi', 'Michelle-Obama', 'Fred_Rogers', 'Dalai_Lama'];
      
      celebItems.push({
        img: `/assets/images/meet-yourself/giver/celebs/${imageNames[i]}.jpg`,
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
      emoji: "⚓",
      title: t("meetyourself2.giver.section.0.title") || "Carrying More Than You Say",
      line: t("meetyourself2.giver.section.0.line") || "You're the anchor in everyone's storm.",
      context: {
        body: t("meetyourself2.giver.section.0.body") || "You've learned to be unshakable for others. But even anchors need ground.",
        bullets: [
          t("meetyourself2.giver.section.0.bullet.0") || "People assume you're always available.",
          t("meetyourself2.giver.section.0.bullet.1") || "You solve problems before they're asked aloud.",
          t("meetyourself2.giver.section.0.bullet.2") || "You hide your exhaustion to keep people calm.",
        ],
        nudge: t("meetyourself2.giver.section.0.nudge") || "Choose one small moment today to say, 'I need a break,' and take it — no explanations.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/giver/right slider/top/Always ready to help..jpg", h: t("meetyourself2.giver.section.0.frame.0.h") || "Always ready to help", p: t("meetyourself2.giver.section.0.frame.0.p") || "Always ready to help" },
        { img: "/assets/images/meet-yourself/giver/right slider/top/Handling load of others..jpeg", h: t("meetyourself2.giver.section.0.frame.1.h") || "Handling load of others", p: t("meetyourself2.giver.section.0.frame.1.p") || "Handling load of others" },
        { img: "/assets/images/meet-yourself/giver/right slider/top/Always ready to help..jpg", h: t("meetyourself2.giver.section.0.frame.2.h") || "Always ready to help", p: t("meetyourself2.giver.section.0.frame.2.p") || "Always ready to help" },
      ],
      cta: { label: getString("meetyourself2.giver.section.0.cta.label", "Take one small pause →"), href: "/signup" },
    },
    {
      emoji: "☕",
      title: t("meetyourself2.giver.section.1.title") || "Giving Without Refilling",
      line: t("meetyourself2.giver.section.1.line") || "Your cup keeps tipping forward.",
      context: {
        body: t("meetyourself2.giver.section.1.body") || "Helping others feels natural — until your reserves run low. Then giving stops feeling generous and starts feeling heavy.",
        bullets: [
          t("meetyourself2.giver.section.1.bullet.0") || "You skip meals, sleep, or breaks to be there for someone.",
          t("meetyourself2.giver.section.1.bullet.1") || "You feel resentment creeping in, but push it down.",
          t("meetyourself2.giver.section.1.bullet.2") || "You rarely ask for anything back.",
        ],
        nudge: t("meetyourself2.giver.section.1.nudge") || "Block 30 minutes for yourself today. Protect it like you protect others' needs.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/giver/right slider/medium/Energy drains out..jpeg", h: t("meetyourself2.giver.section.1.frame.0.h") || "Energy drains out", p: t("meetyourself2.giver.section.1.frame.0.p") || "Energy drains out" },
        { img: "/assets/images/meet-yourself/giver/right slider/medium/Running on empty..jpg", h: t("meetyourself2.giver.section.1.frame.1.h") || "Running on empty", p: t("meetyourself2.giver.section.1.frame.1.p") || "Running on empty" },
        { img: "/assets/images/meet-yourself/giver/right slider/medium/Energy drains out..jpeg", h: t("meetyourself2.giver.section.1.frame.2.h") || "Energy drains out", p: t("meetyourself2.giver.section.1.frame.2.p") || "Energy drains out" },
      ],
      cta: { label: getString("meetyourself2.giver.section.1.cta.label", "Refill before you give →"), href: "/signup" },
    },
    {
      emoji: "🚧",
      title: t("meetyourself2.giver.section.2.title") || "Boundaries You Haven't Drawn",
      line: t("meetyourself2.giver.section.2.line") || "Saying yes has become automatic.",
      context: {
        body: t("meetyourself2.giver.section.2.body") || "Sometimes, supporting others means learning when to step back. Saying no doesn't mean you care less — it means you last longer.",
        bullets: [
          t("meetyourself2.giver.section.2.bullet.0") || "You cancel your own plans when someone calls.",
          t("meetyourself2.giver.section.2.bullet.1") || "You feel guilty about needing personal time.",
          t("meetyourself2.giver.section.2.bullet.2") || "You can't remember the last time you declined a request.",
        ],
        nudge: t("meetyourself2.giver.section.2.nudge") || "Say, 'I can help later' instead of 'yes' immediately. Notice how it feels.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/giver/right slider/lower/Limits that protect you..jpg", h: t("meetyourself2.giver.section.2.frame.0.h") || "Limits that protect you", p: t("meetyourself2.giver.section.2.frame.0.p") || "Limits that protect you" },
        { img: "/assets/images/meet-yourself/giver/right slider/lower/Offer whatever is left..jpeg", h: t("meetyourself2.giver.section.2.frame.1.h") || "Offer whatever is left", p: t("meetyourself2.giver.section.2.frame.1.p") || "Offer whatever is left" },
        { img: "/assets/images/meet-yourself/giver/right slider/lower/Limits that protect you..jpg", h: t("meetyourself2.giver.section.2.frame.2.h") || "Limits that protect you", p: t("meetyourself2.giver.section.2.frame.2.p") || "Limits that protect you" },
      ],
      cta: { label: getString("meetyourself2.giver.section.2.cta.label", "Set one boundary today →"), href: "/signup" },
    },
    {
      emoji: "🫶",
      title: t("meetyourself2.giver.section.3.title") || "The Helper Who Also Needs Help",
      line: t("meetyourself2.giver.section.3.line") || "Strength is knowing when to lean, too.",
      context: {
        body: t("meetyourself2.giver.section.3.body") || "Support givers often forget they're allowed to ask for help. Letting others in doesn't make you less — it makes you human.",
        bullets: [
          t("meetyourself2.giver.section.3.bullet.0") || "You avoid asking to keep from burdening anyone.",
          t("meetyourself2.giver.section.3.bullet.1") || "You worry people will see you as weak.",
          t("meetyourself2.giver.section.3.bullet.2") || "You feel relief only in secret when someone steps up for you.",
        ],
        nudge: t("meetyourself2.giver.section.3.nudge") || "Share one thing you're struggling with to someone you trust. Let them respond.",
      },
      frames: [
        { img: "/assets/images/meet-yourself/giver/right slider/lowest/Lighter together..jpg", h: t("meetyourself2.giver.section.3.frame.0.h") || "Lighter together", p: t("meetyourself2.giver.section.3.frame.0.p") || "Lighter together" },
        { img: "/assets/images/meet-yourself/giver/right slider/lowest/Strength in allowing care..jpg", h: t("meetyourself2.giver.section.3.frame.1.h") || "Strength in allowing care", p: t("meetyourself2.giver.section.3.frame.1.p") || "Strength in allowing care" },
        { img: "/assets/images/meet-yourself/giver/right slider/lowest/Lighter together..jpg", h: t("meetyourself2.giver.section.3.frame.2.h") || "Lighter together", p: t("meetyourself2.giver.section.3.frame.2.p") || "Lighter together" },
      ],
      cta: { label: getString("meetyourself2.giver.section.3.cta.label", "Ask once this week →"), href: "/signup" },
    },
  ], [t, language]);

  // === Try this text ===
  const tryThisText = useMemo(() => {
    return t("meetyourself2.giver.try_this") || "Try this:";
  }, [t, language]);

  // === How DrishiQ Makes a Difference ===
  const howTitle = useMemo(() => {
    return t("meetyourself2.giver.how.title") || "How DrishiQ Makes a Difference";
  }, [t, language]);

  const howCards = useMemo(() => [
    { icon: "🗺️", h: t("meetyourself2.giver.how.0.h") || "Clear Energy Map", d: t("meetyourself2.giver.how.0.d") || "See where your giving drains you most." },
    { icon: "🔋", h: t("meetyourself2.giver.how.1.h") || "Recharge Plans", d: t("meetyourself2.giver.how.1.d") || "Simple, doable ways to refill before you're empty." },
    { icon: "🛡️", h: t("meetyourself2.giver.how.2.h") || "Boundary Tools", d: t("meetyourself2.giver.how.2.d") || "Practice saying no with confidence." },
    { icon: "💬", h: t("meetyourself2.giver.how.3.h") || "Check-ins for You", d: t("meetyourself2.giver.how.3.d") || "A safe space to be heard without being needed." },
  ], [t, language]);

  // === Hero section translations ===
  const topbandLabel = useMemo(() => {
    return t("meetyourself2.giver.topband.label") || "Support Giver, not just helper — stories from known faces";
  }, [t, language]);

  const heroTitle = useMemo(() => {
    return t("meetyourself2.giver.hero.title") || "Missing From Self";
  }, [t, language]);

  const heroSubtitle = useMemo(() => {
    return t("meetyourself2.giver.hero.subtitle") || "Being a support giver is a gift, but it can quietly drain the parts of you no one sees. This space is for noticing your own needs without guilt.";
  }, [t, language]);

  const heroCtaEarlyAccess = useMemo(() => {
    return t("meetyourself2.giver.cta.early_access") || "Check in with yourself — right here";
  }, [t, language]);

  const heroCtaHowLabel = useMemo(() => {
    return t("meetyourself2.giver.cta.how.label") || "How Drishiq helps";
  }, [t, language]);

  const heroCtaHowSentence = useMemo(() => {
    return t("meetyourself2.giver.cta.how.sentence") || "Protect your energy. Restore your balance.";
  }, [t, language]);

  const emoteHeader = useMemo(() => {
    return t("meetyourself2.giver.emote_header") || "What support giving can feel like";
  }, [t, language]);

  // === Bridge section translations ===
  const bridgeTitle = useMemo(() => {
    return t("meetyourself2.giver.bridge.title") || "You deserve the same care you give.";
  }, [t, language]);

  const bridgeBody = useMemo(() => {
    return t("meetyourself2.giver.bridge.body") || "Drishiq helps you stay a generous, steady presence while protecting your energy. You don't have to choose between helping and being whole.";
  }, [t, language]);

  const bridgeCta = useMemo(() => {
    return t("meetyourself2.giver.bridge.cta") || "Begin your clarity check →";
  }, [t, language]);

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
                "name": "Giver",
                "item": "https://www.drishiq.com/meet-yourself/giver"
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
              <LifeBuoy size={20} className="text-emerald-600" />
              <span>{topbandLabel}</span>
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
              <LifeBuoy size={48} className="text-emerald-600" aria-hidden />
              {heroTitle}
            </FM.h1>
            <FM.p 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.45, delay: 0.05 }} 
              className="mt-4 text-xl text-gray-600 leading-relaxed"
            >
              {heroSubtitle}
            </FM.p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ShinyButton href="/signup">
                {heroCtaEarlyAccess}
              </ShinyButton>
              <a 
                href="#how" 
                className="rounded-2xl px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
              >
                {heroCtaHowLabel}
              </a>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {heroCtaHowSentence}
            </p>
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
              <HeartHandshake size={20} className="text-pink-500" />
              <span>{emoteHeader}</span>
            </div>
          </div>
        </div>
      </section>

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
                    <strong>{tryThisText}</strong> {sec.context.nudge}
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
              {bridgeTitle}
            </h2>
            <p className="text-lg mb-8 leading-relaxed">
              {bridgeBody}
            </p>
            <a href="/signup" className="inline-flex items-center rounded-2xl bg-white text-[#0B4422] px-5 py-3 font-semibold shadow hover:shadow-md">
              {bridgeCta}
            </a>
          </div>
        </section>

        {/* How DrishiQ Makes a Difference */}
        <section id="how" className="container mx-auto max-w-7xl px-4 py-8">
          <h3 className="text-2xl md:text-3xl font-semibold">
            {howTitle}
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {howCards.map((f, i) => {
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
        @keyframes sg-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: sg-rtl 22s linear infinite; }
        
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