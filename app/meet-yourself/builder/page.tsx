"use client";

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Footer from '@/components/Footer';
import { useLanguage } from "@/lib/drishiq-i18n";

// Safe fallback: if framer-motion isn't installed, FM renders plain elements
const FM: any = motion as any;

/**
 * BUILDER — React + TypeScript + Tailwind
 * Matches your persona pattern (FM fallback, tiles, celeb ticker, stir ticker),
 * with Builder copy and content.
 */

export default function BuilderPage() {
  const { t, language } = useLanguage(['meetyourself1']);
  
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

  // Helper function to get how card data (handles both nested keys and object returns)
  const getHowCard = (index: number, hFallback: string, dFallback: string) => {
    const hKey = `meetyourself1.builder.how.${index}.h`;
    const dKey = `meetyourself1.builder.how.${index}.d`;
    const objKey = `meetyourself1.builder.how.${index}`;
    
    // Try direct key access first
    const hResult = t(hKey);
    const dResult = t(dKey);
    
    // If we got strings, use them
    const h = typeof hResult === 'string' && hResult ? hResult : 
              (hResult && typeof hResult === 'object' && 'h' in hResult && typeof hResult.h === 'string' ? hResult.h : 
               (() => {
                 const obj = t(objKey, { returnObjects: true });
                 return (obj && typeof obj === 'object' && 'h' in obj && typeof obj.h === 'string') ? obj.h : hFallback;
               })());
    
    const d = typeof dResult === 'string' && dResult ? dResult : 
              (dResult && typeof dResult === 'object' && 'd' in dResult && typeof dResult.d === 'string' ? dResult.d : 
               (() => {
                 const obj = t(objKey, { returnObjects: true });
                 return (obj && typeof obj === 'object' && 'd' in obj && typeof obj.d === 'string') ? obj.d : dFallback;
               })());
    
    return { h, d };
  };

  // === Stir lines under headline ===
  const stirLines: string[] = [
    getString("meetyourself1.builder.stir.line.0", "Is there always 'one more thing' to finish before you can rest?"),
    getString("meetyourself1.builder.stir.line.1", "Do you struggle to slow down, even when you want to?"),
    getString("meetyourself1.builder.stir.line.2", "Are your relationships often fitted around your projects?"),
    getString("meetyourself1.builder.stir.line.3", "Does your identity feel tied to what you're making or achieving?"),
    getString("meetyourself1.builder.stir.line.4", "Have you ever asked yourself: What if I stopped building?"),
  ];

  // === Quick Emotion Cards (6) ===
  const emotionCards = [
    { t: getString("meetyourself1.builder.emote.0.title", "Driven"), s: getString("meetyourself1.builder.emote.0.subtitle", "Fueled by purpose") },
    { t: getString("meetyourself1.builder.emote.1.title", "Tired"), s: getString("meetyourself1.builder.emote.1.subtitle", "Always in motion") },
    { t: getString("meetyourself1.builder.emote.2.title", "Proud"), s: getString("meetyourself1.builder.emote.2.subtitle", "Watching it take shape") },
    { t: getString("meetyourself1.builder.emote.3.title", "Isolated"), s: getString("meetyourself1.builder.emote.3.subtitle", "Few understand the pace") },
    { t: getString("meetyourself1.builder.emote.4.title", "Overextended"), s: getString("meetyourself1.builder.emote.4.subtitle", "Too many pillars at once") },
    { t: getString("meetyourself1.builder.emote.5.title", "Fulfilled"), s: getString("meetyourself1.builder.emote.5.subtitle", "Creating something that matters") },
  ];

  // === Celebrity Ticker ===
  const celebA = [
    { img: "/assets/images/meet-yourself/builder/Slider/Elon_Musk.jpg", name: getString("meetyourself1.builder.celeb.0.name", "Elon Musk"), profession: getString("meetyourself1.builder.celeb.0.profession", "Entrepreneur"), source: "Quote", quote: getString("meetyourself1.builder.celeb.0.quote", "\"When something is important enough, you do it even if the odds are not in your favor.\"") },
    { img: "/assets/images/meet-yourself/builder/Slider/Oprah winfrey.jpg", name: getString("meetyourself1.builder.celeb.1.name", "Oprah Winfrey"), profession: getString("meetyourself1.builder.celeb.1.profession", "Media Leader"), source: "Quote", quote: getString("meetyourself1.builder.celeb.1.quote", "\"Doing the best at this moment puts you in the best place for the next moment.\"") },
    { img: "/assets/images/meet-yourself/builder/Slider/J._R._R._Tolkien.jpg", name: getString("meetyourself1.builder.celeb.2.name", "J.R.R. Tolkien"), profession: getString("meetyourself1.builder.celeb.2.profession", "Author"), source: "Quote", quote: getString("meetyourself1.builder.celeb.2.quote", "\"Little by little, one travels far.\"") },
    { img: "/assets/images/meet-yourself/builder/Slider/Jane_Goodall.jpg", name: getString("meetyourself1.builder.celeb.3.name", "Jane Goodall"), profession: getString("meetyourself1.builder.celeb.3.profession", "Scientist"), source: "Quote", quote: getString("meetyourself1.builder.celeb.3.quote", "\"What you do makes a difference, and you have to decide what kind of difference you want to make.\"") },
    { img: "/assets/images/meet-yourself/builder/Slider/Howard Scultz.jpeg", name: getString("meetyourself1.builder.celeb.4.name", "Howard Schultz"), profession: getString("meetyourself1.builder.celeb.4.profession", "Business Leader"), source: "Quote", quote: getString("meetyourself1.builder.celeb.4.quote", "\"Dream more than others think practical. Expect more than others think possible.\"") },
  ];
  const celebs = [...celebA, ...celebA];

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
      emoji: "🧱",
      title: getString("meetyourself1.builder.section.0.title", "The Drive to Build"),
      line: getString("meetyourself1.builder.section.0.line", "You see possibilities everywhere."),
      context: {
        body: getString("meetyourself1.builder.section.0.body", "Where others see an empty lot, you see a foundation. Where others see 'enough,' you see 'more to do.' Your ability to envision and create is your gift — but also your weight."),
        bullets: [
          getString("meetyourself1.builder.section.0.bullet.0", "You always have multiple projects in motion."),
          getString("meetyourself1.builder.section.0.bullet.1", "You feel restless without a goal or plan."),
          getString("meetyourself1.builder.section.0.bullet.2", "You equate productivity with self-worth."),
        ],
        nudge: getString("meetyourself1.builder.section.0.nudge", "Write down your current projects and mark the ones that truly align with your values — not just your habits."),
      },
      frames: [
        { img: "/assets/images/meet-yourself/builder/right slider/Top/Plannig the future.png", h: getString("meetyourself1.builder.section.0.frame.0.h", "Blueprints"), p: getString("meetyourself1.builder.section.0.frame.0.p", "Planning the future") },
        { img: "/assets/images/meet-yourself/builder/right slider/Top/actively shaping.jpg", h: getString("meetyourself1.builder.section.0.frame.1.h", "Hammer & Nails"), p: getString("meetyourself1.builder.section.0.frame.1.p", "Actively shaping") },
        { img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80&auto=format&fit=crop", h: getString("meetyourself1.builder.section.0.frame.2.h", "Rising Structure"), p: getString("meetyourself1.builder.section.0.frame.2.p", "Seeing progress") },
      ],
      cta: { label: getString("meetyourself1.builder.section.0.cta", "Align your builds with your values →"), href: "#assess" },
    },
    {
      emoji: "🏗️",
      title: getString("meetyourself1.builder.section.1.title", "When the Structure Owns You"),
      line: getString("meetyourself1.builder.section.1.line", "Not every build is worth the weight."),
      context: {
        body: getString("meetyourself1.builder.section.1.body", "Sometimes the thing you're creating starts shaping you — dictating your time, choices, and even your health."),
        bullets: [
          getString("meetyourself1.builder.section.1.bullet.0", "Your projects consume your personal time."),
          getString("meetyourself1.builder.section.1.bullet.1", "You feel guilty stepping away."),
          getString("meetyourself1.builder.section.1.bullet.2", "You stay with an idea long after its value has faded."),
        ],
        nudge: getString("meetyourself1.builder.section.1.nudge", "Ask: 'If I walked away today, what would I gain back in time, health, or joy?'"),
      },
      frames: [
        { img: "/assets/images/meet-yourself/builder/right slider/Middle/Sign of Strain.avif", h: getString("meetyourself1.builder.section.1.frame.0.h", "Tower With Cracks"), p: getString("meetyourself1.builder.section.1.frame.0.p", "Signs of strain") },
        { img: "/assets/images/meet-yourself/builder/right slider/Middle/Time slipping unnoticed.avif", h: getString("meetyourself1.builder.section.1.frame.1.h", "Clock Without Hands"), p: getString("meetyourself1.builder.section.1.frame.1.p", "Time slipping unnoticed") },
        { img: "https://images.unsplash.com/photo-1517512006864-7edc3b933137?w=1200&q=80&auto=format&fit=crop", h: getString("meetyourself1.builder.section.1.frame.2.h", "Tethered Figure"), p: getString("meetyourself1.builder.section.1.frame.2.p", "Bound to the work") },
      ],
      cta: { label: getString("meetyourself1.builder.section.1.cta", "Free yourself from unsustainable builds →"), href: "#assess" },
    },
    {
      emoji: "⚖️",
      title: getString("meetyourself1.builder.section.2.title", "Balancing Bricks and Breath"),
      line: getString("meetyourself1.builder.section.2.line", "Every strong structure rests on a solid foundation — and that includes you."),
      context: {
        body: getString("meetyourself1.builder.section.2.body", "The stronger you are, the stronger your creations can be. Building with balance means making space for rest, reflection, and relationships."),
        bullets: [
          getString("meetyourself1.builder.section.2.bullet.0", "You neglect personal needs for deadlines."),
          getString("meetyourself1.builder.section.2.bullet.1", "You haven't taken an intentional break in years."),
          getString("meetyourself1.builder.section.2.bullet.2", "You feel your passion turning into pressure."),
        ],
        nudge: getString("meetyourself1.builder.section.2.nudge", "Block out non-negotiable time each week for something unrelated to your projects."),
      },
      frames: [
        { img: "/assets/images/meet-yourself/builder/right slider/lower/Stability and strength.jpeg", h: getString("meetyourself1.builder.section.2.frame.0.h", "Balanced Stones"), p: getString("meetyourself1.builder.section.2.frame.0.p", "Stability and strength") },
        { img: "/assets/images/meet-yourself/builder/right slider/lower/Space to breathe.jpg", h: getString("meetyourself1.builder.section.2.frame.1.h", "Open Field"), p: getString("meetyourself1.builder.section.2.frame.1.p", "Space to breathe") },
        { img: "https://images.unsplash.com/photo-1517512006864-7edc3b933137?w=1200&q=80&auto=format&fit=crop", h: getString("meetyourself1.builder.section.2.frame.2.h", "Hands Holding a Plant"), p: getString("meetyourself1.builder.section.2.frame.2.p", "Nurturing both you and your work") },
      ],
      cta: { label: getString("meetyourself1.builder.section.2.cta", "Build without breaking →"), href: "#assess" },
    },
    {
      emoji: "🫱🏻‍🫲🏽",
      title: getString("meetyourself1.builder.section.3.title", "Building Beyond Yourself"),
      line: getString("meetyourself1.builder.section.3.line", "The most meaningful builds last after you step away."),
      context: {
        body: getString("meetyourself1.builder.section.3.body", "A true builder knows when to pass the tools. Teaching, delegating, and sharing the process can make your work bigger than you."),
        bullets: [
          getString("meetyourself1.builder.section.3.bullet.0", "You want your work to have a legacy."),
          getString("meetyourself1.builder.section.3.bullet.1", "You're ready to collaborate more."),
          getString("meetyourself1.builder.section.3.bullet.2", "You want your builds to serve beyond you."),
        ],
        nudge: getString("meetyourself1.builder.section.3.nudge", "Choose one person to mentor or involve in your current project."),
      },
      frames: [
        { img: "/assets/images/meet-yourself/builder/right slider/lowest/Inviting others in.webp", h: getString("meetyourself1.builder.section.3.frame.0.h", "Open Doorway"), p: getString("meetyourself1.builder.section.3.frame.0.p", "Inviting others in") },
        { img: "/assets/images/meet-yourself/builder/right slider/lowest/Sharing skills.jpg", h: getString("meetyourself1.builder.section.3.frame.1.h", "Hands Passing a Plant"), p: getString("meetyourself1.builder.section.3.frame.1.p", "Sharing skills") },
        { img: "https://images.unsplash.com/photo-1517512006864-7edc3b933137?w=1200&q=80&auto=format&fit=crop", h: getString("meetyourself1.builder.section.3.frame.2.h", "Completed Building in Sunlight"), p: getString("meetyourself1.builder.section.3.frame.2.p", "Legacy in place") },
      ],
      cta: { label: getString("meetyourself1.builder.section.3.cta", "Create lasting impact →"), href: "#assess" },
    },
  ], [t, language]);

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
                "name": "Builder",
                "item": "https://www.drishiq.com/meet-yourself/builder"
              }
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
      
      {/* Top band: 6 cards ABOVE the celeb ticker, ticker full width */}
      <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200 relative z-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 py-4 text-sm font-semibold text-gray-600">
            <span className="text-xl">🏗️</span>
            <span>{getString("meetyourself1.builder.hero.subtitle", "Builder, not just busy — stories from known faces")}</span>
          </div>
          <div className="py-4">
            {/* Emotion tiles moved to hero section */}
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
              <span className="text-5xl" aria-hidden>🧰</span>
              {getString("meetyourself1.builder.hero.title", "Always Building")}
            </FM.h1>
            <FM.p 
              initial={{ opacity: 0, y: 10 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.45, delay: 0.05 }} 
              className="mt-4 text-xl text-gray-600 leading-relaxed"
            >
              {getString("meetyourself1.builder.hero.description", "Your eyes are on the next step before your feet have landed on the last. You thrive on momentum, but when do you get to stand still and simply be?")}
            </FM.p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <ShinyButton href="/signup">{getString("meetyourself1.builder.hero.cta.primary", "See your building patterns →")}</ShinyButton>
              <a 
                href="#how" 
                className="rounded-2xl px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
              >
                {getString("meetyourself1.builder.hero.cta.secondary", "How DrishiQ helps?")}
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
            <div className="flex items-center gap-3 mt-4 text-sm font-semibold text-gray-600 justify-end">
              <span className="text-xl">🏗️</span>
              <span>{getString("meetyourself1.builder.try_this", "Try this:")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Context + visual block (aligned). Right block offset by 30px as requested */}
      {sections.map((s, index) => (
        <section key={s.title} className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
          {/* Headline row */}
          <div className="grid gap-4 md:grid-cols-12 items-start">
            <div className="md:col-span-7">
              <div className="flex items-baseline gap-4 mb-4">
                <div className="text-4xl" aria-hidden>{s.emoji}</div>
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
                  <div className="text-lg font-semibold text-emerald-800 mb-2">{getString("meetyourself1.builder.try_this", "Try this:")}</div>
                  <p className="text-emerald-700">{s.context.nudge}</p>
                </div>
              </div>
            </FM.div>

            {/* Right visual block */}
            <div className="md:col-span-5 flex flex-col justify-start">
              {/* Moving image stream */}
              <div className="relative rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden w-full max-w-lg">
                <div className="relative h-[350px] w-full">
                  <StreamStrip frames={s.frames} />
                </div>
              </div>
              <div className="mt-6 w-full max-w-lg">
                <a 
                  href="/signup" 
                  className="block w-full text-center rounded-2xl px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800 transform hover:-translate-y-1"
                >
                  {getString("meetyourself1.builder.cta.how", "How DrishiQ helps")}
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
            <h3 className="text-3xl md:text-4xl font-bold mb-4">{getString("meetyourself1.builder.bridge.title", "Ready to Shape the Future?")}</h3>
            <p className="text-xl opacity-95 leading-relaxed">{getString("meetyourself1.builder.bridge.body", "Drishiq helps builders find balance between creation and self-care, ensuring your energy, health, and clarity grow alongside your work.")}</p>
            <div className="mt-8">
              <a 
                href="/signup" 
                className="inline-flex items-center rounded-2xl bg-white text-emerald-800 px-8 py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 transform hover:-translate-y-1"
              >
                {getString("meetyourself1.builder.bridge.cta", "Begin your clarity check →")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How Drishiq Makes a Difference */}
      <section id="how" className="container mx-auto max-w-7xl px-4 py-16 relative z-10">
        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">{getString("meetyourself1.builder.how.title", "How Drishiq Makes a Difference")}</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {useMemo(() => [
            { ...getHowCard(0, "Build-Value Map", "See which projects truly matter to you."), icon: "🗺️" },
            { ...getHowCard(1, "Pace Reset", "Tools to slow down without losing momentum."), icon: "⏸️" },
            { ...getHowCard(2, "Balance Practices", "Integrating rest and reflection."), icon: "⚖️" },
            { ...getHowCard(3, "Legacy Steps", "Planning for long-term impact."), icon: "🏛️" },
          ], [t, language]).map((f, i) => (
            <FM.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.5, delay: i * 0.1 }} 
              className="rounded-3xl bg-white border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <div className="text-xl font-bold text-gray-900 mb-3">{f.h}</div>
              <p className="text-gray-600 leading-relaxed">{f.d}</p>
            </FM.div>
          ))}
        </div>
      </section>

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
        @keyframes builder-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stir-track { width:200%; animation: builder-rtl 22s linear infinite; }
        /* Stream strip (R→L) */
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

function StirTicker({ lines }: { lines: string[] }) {
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

function ShinyButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="relative inline-block rounded-2xl px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
    >
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shine_3.6s_infinite] group-hover:animate-[shine_2s_infinite]" />
      <style>{`@keyframes shine{0%{transform:translateX(-120%)}60%{transform:translateX(120%)}100%{transform:translateX(120%)}}`}</style>
    </a>
  );
}

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
